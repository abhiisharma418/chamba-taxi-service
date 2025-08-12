import Joi from 'joi';
import { Ride } from '../models/rideModel.js';
import { User } from '../models/userModel.js';
import { calculateDistance, calculateFare, getFareBreakdown } from '../services/fareService.js';
import { findNearbyDrivers, assignDriverToRide } from '../services/driverMatchingService.js';
import { startDispatch } from '../services/dispatchService.js';

const estimateSchema = Joi.object({
  pickup: Joi.object({
    address: Joi.string().required(),
    coordinates: Joi.array().items(Joi.number()).length(2).required()
  }).required(),
  destination: Joi.object({
    address: Joi.string().required(),
    coordinates: Joi.array().items(Joi.number()).length(2).required()
  }).required(),
  vehicleType: Joi.string().valid('car', 'bike').required(),
  regionType: Joi.string().default('city')
});

const createRideSchema = Joi.object({
  pickup: Joi.object({
    address: Joi.string().required(),
    coordinates: Joi.array().items(Joi.number()).length(2).required()
  }).required(),
  destination: Joi.object({
    address: Joi.string().required(),
    coordinates: Joi.array().items(Joi.number()).length(2).required()
  }).required(),
  vehicleType: Joi.string().valid('car', 'bike').required(),
  regionType: Joi.string().default('city'),
  paymentMethod: Joi.string().valid('cod', 'razorpay', 'stripe', 'upi').required(),
  paymentStatus: Joi.string().valid('pending', 'completed', 'failed').default('pending'),
  amount: Joi.number().positive().required(),
  transactionId: Joi.string().allow('', null),
  customerId: Joi.string().required()
});

export const estimateFare = async (req, res) => {
  try {
    const { error, value } = estimateSchema.validate(req.body);
    if (error) {
      return res.status(400).json({ 
        success: false, 
        message: error.details[0].message 
      });
    }

    const { pickup, destination, vehicleType, regionType } = value;

    // Calculate distance and duration
    const distance = calculateDistance(
      pickup.coordinates[1], pickup.coordinates[0],
      destination.coordinates[1], destination.coordinates[0]
    );

    // Estimate duration based on distance and region
    const duration = estimateDuration(distance, regionType);

    // Calculate fare with surge pricing
    const surgeMultiplier = getSurgeMultiplier(pickup.address, new Date());
    const fareData = calculateFare(distance, duration, vehicleType, surgeMultiplier);
    
    // Get detailed breakdown including 75-25 split
    const breakdown = getFareBreakdown(fareData.totalFare);

    const response = {
      success: true,
      data: {
        distanceKm: parseFloat(distance.toFixed(2)),
        durationMin: Math.round(duration),
        estimated: fareData.totalFare,
        price: fareData.totalFare,
        regionType,
        vehicleType,
        surge: surgeMultiplier,
        breakdown: {
          baseFare: fareData.baseFare,
          distanceCharge: fareData.distanceCharge,
          timeCharge: fareData.timeCharge,
          totalFare: fareData.totalFare,
          driverEarning: breakdown.driverEarning, // 75%
          companyCommission: breakdown.companyCommission, // 25%
          surgeApplied: surgeMultiplier > 1
        }
      }
    };

    res.json(response);
  } catch (error) {
    console.error('Fare estimation error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Fare estimation failed' 
    });
  }
};

export const createRide = async (req, res) => {
  try {
    const { error, value } = createRideSchema.validate(req.body);
    if (error) {
      return res.status(400).json({ 
        success: false, 
        message: error.details[0].message 
      });
    }

    const { pickup, destination, vehicleType, paymentMethod, amount, customerId } = value;

    // Verify customer exists
    const customer = await User.findById(customerId);
    if (!customer) {
      return res.status(404).json({ 
        success: false, 
        message: 'Customer not found' 
      });
    }

    // Calculate actual fare (in case frontend sent wrong amount)
    const distance = calculateDistance(
      pickup.coordinates[1], pickup.coordinates[0],
      destination.coordinates[1], destination.coordinates[0]
    );
    const duration = estimateDuration(distance, value.regionType);
    const surgeMultiplier = getSurgeMultiplier(pickup.address, new Date());
    const fareData = calculateFare(distance, duration, vehicleType, surgeMultiplier);
    const breakdown = getFareBreakdown(fareData.totalFare);

    // Create ride record
    const ride = new Ride({
      customerId,
      pickup,
      destination,
      vehicleType,
      distance: parseFloat(distance.toFixed(2)),
      duration: Math.round(duration),
      fare: {
        estimated: fareData.totalFare,
        actual: fareData.totalFare,
        breakdown: {
          baseFare: fareData.baseFare,
          distanceCharge: fareData.distanceCharge,
          timeCharge: fareData.timeCharge,
          surge: surgeMultiplier,
          driverEarning: breakdown.driverEarning,
          companyCommission: breakdown.companyCommission
        }
      },
      paymentMethod,
      paymentStatus: paymentMethod === 'cod' ? 'pending' : 'pending',
      status: 'requested',
      requestedAt: new Date()
    });

    await ride.save();

    // Find and assign nearby drivers
    try {
      const nearbyDrivers = await findNearbyDrivers(
        pickup.coordinates[1], pickup.coordinates[0], 
        vehicleType, 
        10 // 10km radius
      );

      if (nearbyDrivers.length > 0) {
        // Start driver dispatch process
        await startDispatch(ride._id, pickup, nearbyDrivers);
        ride.status = 'dispatching';
        await ride.save();
      } else {
        ride.status = 'no_drivers_available';
        await ride.save();
      }
    } catch (dispatchError) {
      console.error('Driver dispatch error:', dispatchError);
      // Continue with ride creation even if dispatch fails
    }

    const response = {
      success: true,
      data: {
        id: ride._id,
        _id: ride._id,
        status: ride.status,
        pickup: ride.pickup,
        destination: ride.destination,
        fare: ride.fare,
        vehicleType: ride.vehicleType,
        paymentMethod: ride.paymentMethod,
        estimatedArrival: ride.status === 'dispatching' ? '3-5 minutes' : null,
        breakdown: ride.fare.breakdown
      }
    };

    res.status(201).json(response);
  } catch (error) {
    console.error('Ride creation error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to create ride' 
    });
  }
};

export const getRide = async (req, res) => {
  try {
    const rideId = req.params.id;
    const userId = req.user.id;

    const ride = await Ride.findById(rideId)
      .populate('customerId', 'name phone email')
      .populate('driverId', 'name phone vehicleModel vehicleNumber');

    if (!ride) {
      return res.status(404).json({ 
        success: false, 
        message: 'Ride not found' 
      });
    }

    // Check if user is authorized to view this ride
    if (ride.customerId._id.toString() !== userId && 
        ride.driverId?.toString() !== userId && 
        req.user.role !== 'admin') {
      return res.status(403).json({ 
        success: false, 
        message: 'Not authorized to view this ride' 
      });
    }

    res.json({ success: true, data: ride });
  } catch (error) {
    console.error('Get ride error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to get ride details' 
    });
  }
};

export const updateStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    const userId = req.user.id;

    const validStatuses = [
      'requested', 'dispatching', 'driver_assigned', 'driver_arrived', 
      'on_trip', 'completed', 'cancelled'
    ];

    if (!validStatuses.includes(status)) {
      return res.status(400).json({ 
        success: false, 
        message: 'Invalid status' 
      });
    }

    const ride = await Ride.findById(id);
    if (!ride) {
      return res.status(404).json({ 
        success: false, 
        message: 'Ride not found' 
      });
    }

    // Authorization check
    const isCustomer = ride.customerId.toString() === userId;
    const isDriver = ride.driverId?.toString() === userId;
    const isAdmin = req.user.role === 'admin';

    if (!isCustomer && !isDriver && !isAdmin) {
      return res.status(403).json({ 
        success: false, 
        message: 'Not authorized to update this ride' 
      });
    }

    // Update ride status
    ride.status = status;
    
    // Set completion time and calculate final fare
    if (status === 'completed') {
      ride.completedAt = new Date();
      
      // Finalize driver earnings (75% of total fare)
      const breakdown = getFareBreakdown(ride.fare.estimated);
      ride.fare.actual = ride.fare.estimated;
      ride.fare.breakdown.driverEarning = breakdown.driverEarning;
      ride.fare.breakdown.companyCommission = breakdown.companyCommission;
    }

    if (status === 'cancelled') {
      ride.cancelledAt = new Date();
    }

    await ride.save();

    res.json({ 
      success: true, 
      data: { 
        id: ride._id, 
        status: ride.status,
        fare: ride.fare
      } 
    });
  } catch (error) {
    console.error('Update ride status error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to update ride status' 
    });
  }
};

export const getHistory = async (req, res) => {
  try {
    const userId = req.user.id;
    const userRole = req.user.role;
    const { page = 1, limit = 20 } = req.query;

    let query = {};
    
    if (userRole === 'customer') {
      query.customerId = userId;
    } else if (userRole === 'driver') {
      query.driverId = userId;
    }
    // Admin can see all rides (no query filter)

    const rides = await Ride.find(query)
      .populate('customerId', 'name phone')
      .populate('driverId', 'name phone vehicleModel vehicleNumber')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Ride.countDocuments(query);

    res.json({ 
      success: true, 
      data: rides,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Get ride history error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to get ride history' 
    });
  }
};

// Helper functions
function estimateDuration(distanceKm, regionType) {
  // Average speeds based on region
  const avgSpeeds = {
    'city': 25,      // 25 km/h in city
    'highway': 60,   // 60 km/h on highway
    'rural': 40      // 40 km/h in rural areas
  };
  
  const speed = avgSpeeds[regionType] || avgSpeeds.city;
  return (distanceKm / speed) * 60; // Convert to minutes
}

function getSurgeMultiplier(address, dateTime) {
  const hour = dateTime.getHours();
  const day = dateTime.getDay(); // 0 = Sunday, 6 = Saturday
  
  // Peak hours surge
  if ((hour >= 8 && hour <= 10) || (hour >= 17 && hour <= 20)) {
    if (day >= 1 && day <= 5) { // Weekdays
      return 1.5;
    }
  }
  
  // Weekend surge
  if (day === 0 || day === 6) {
    return 1.2;
  }
  
  // Location-based surge
  const lowerAddress = address.toLowerCase();
  if (lowerAddress.includes('mall') || 
      lowerAddress.includes('station') || 
      lowerAddress.includes('airport')) {
    return 1.3;
  }
  
  return 1.0; // No surge
}
