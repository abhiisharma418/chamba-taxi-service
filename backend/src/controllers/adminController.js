import { User } from '../models/userModel.js';
import { Ride } from '../models/rideModel.js';
import  Vehicle  from '../models/vehicleModel.js';

export const getStats = async (req, res) => {
  try {
    const [
      totalUsers,
      totalRides,
      vehicles,
      activeDrivers,
      completedRides,
      cancelledRides,
      todayRevenue
    ] = await Promise.all([
      User.countDocuments(),
      Ride.countDocuments(),
      Vehicle.countDocuments(),
      User.countDocuments({ role: 'driver', isActive: true }),
      Ride.countDocuments({ status: 'completed' }),
      Ride.countDocuments({ status: 'cancelled' }),
      Ride.aggregate([
        {
          $match: {
            status: 'completed',
            createdAt: {
              $gte: new Date(new Date().setHours(0,0,0,0))
            }
          }
        },
        { $group: { _id: null, total: { $sum: '$fare' } } }
      ]).then(result => result[0]?.total || 0)
    ]);

    const averageRating = await Ride.aggregate([
      { $match: { rating: { $exists: true, $ne: null } } },
      { $group: { _id: null, avgRating: { $avg: '$rating' } } }
    ]).then(result => Math.round((result[0]?.avgRating || 0) * 10) / 10);

    res.json({
      success: true,
      data: {
        totalUsers,
        totalRides,
        vehicles,
        activeDrivers,
        totalCustomers: await User.countDocuments({ role: 'customer' }),
        completedRides,
        cancelledRides,
        todayRevenue,
        averageRating,
        onlineDrivers: activeDrivers // Simplified for now
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const listUsers = async (req, res) => {
  try {
    const list = await User.find().select('-passwordHash').sort({ createdAt: -1 });
    res.json({ success: true, data: list });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const updateUserStatus = async (req, res) => {
  try {
    const user = await User.findByIdAndUpdate(req.params.id, { isActive: !!req.body.isActive }, { new: true }).select('-passwordHash');
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });
    res.json({ success: true, data: user });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Rides management
export const getRides = async (req, res) => {
  try {
    const rides = await Ride.find()
      .populate('customerId', 'name email phone')
      .populate('driverId', 'name email phone')
      .sort({ createdAt: -1 })
      .limit(100);

    const formattedRides = rides.map(ride => ({
      id: ride._id,
      customerId: ride.customerId?._id,
      driverId: ride.driverId?._id,
      customerName: ride.customerId?.name || 'Unknown',
      driverName: ride.driverId?.name || 'Unassigned',
      pickup: ride.pickup,
      destination: ride.destination,
      status: ride.status,
      fare: ride.fare,
      createdAt: ride.createdAt,
      vehicleType: ride.vehicleType || 'car'
    }));

    res.json({ success: true, data: formattedRides });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const updateRideStatus = async (req, res) => {
  try {
    const { status } = req.body;
    const ride = await Ride.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true }
    );
    if (!ride) return res.status(404).json({ success: false, message: 'Ride not found' });
    res.json({ success: true, data: ride });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Drivers management
export const getDrivers = async (req, res) => {
  try {
    const drivers = await User.find({ role: 'driver' })
      .select('-passwordHash')
      .sort({ createdAt: -1 });

    const driversWithStats = await Promise.all(drivers.map(async (driver) => {
      const [totalRides, earnings] = await Promise.all([
        Ride.countDocuments({ driverId: driver._id }),
        Ride.aggregate([
          { $match: { driverId: driver._id, status: 'completed' } },
          { $group: { _id: null, total: { $sum: '$fare' } } }
        ]).then(result => result[0]?.total || 0)
      ]);

      const avgRating = await Ride.aggregate([
        { $match: { driverId: driver._id, rating: { $exists: true, $ne: null } } },
        { $group: { _id: null, avgRating: { $avg: '$rating' } } }
      ]).then(result => Math.round((result[0]?.avgRating || 0) * 10) / 10);

      return {
        id: driver._id,
        name: driver.name,
        email: driver.email,
        phone: driver.phone,
        vehicle: driver.vehicle || 'Not specified',
        license: driver.license || 'Not provided',
        rating: avgRating,
        totalRides,
        status: driver.isActive ? 'online' : 'offline',
        earnings,
        joinedDate: driver.createdAt?.toISOString()?.split('T')[0] || 'Unknown'
      };
    }));

    res.json({ success: true, data: driversWithStats });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const approveDriver = async (req, res) => {
  try {
    const driver = await User.findByIdAndUpdate(
      req.params.id,
      { isActive: true, approvedAt: new Date() },
      { new: true }
    ).select('-passwordHash');

    if (!driver) return res.status(404).json({ success: false, message: 'Driver not found' });
    res.json({ success: true, data: driver });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const suspendDriver = async (req, res) => {
  try {
    const driver = await User.findByIdAndUpdate(
      req.params.id,
      { isActive: false, suspendedAt: new Date() },
      { new: true }
    ).select('-passwordHash');

    if (!driver) return res.status(404).json({ success: false, message: 'Driver not found' });
    res.json({ success: true, data: driver });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Customers management
export const getCustomers = async (req, res) => {
  try {
    const customers = await User.find({ role: 'customer' })
      .select('-passwordHash')
      .sort({ createdAt: -1 });

    const customersWithStats = await Promise.all(customers.map(async (customer) => {
      const [totalRides, totalSpent] = await Promise.all([
        Ride.countDocuments({ customerId: customer._id }),
        Ride.aggregate([
          { $match: { customerId: customer._id, status: 'completed' } },
          { $group: { _id: null, total: { $sum: '$fare' } } }
        ]).then(result => result[0]?.total || 0)
      ]);

      const avgRating = await Ride.aggregate([
        { $match: { customerId: customer._id, rating: { $exists: true, $ne: null } } },
        { $group: { _id: null, avgRating: { $avg: '$rating' } } }
      ]).then(result => Math.round((result[0]?.avgRating || 0) * 10) / 10);

      return {
        id: customer._id,
        name: customer.name,
        email: customer.email,
        phone: customer.phone,
        totalRides,
        totalSpent,
        rating: avgRating,
        joinedDate: customer.createdAt?.toISOString()?.split('T')[0] || 'Unknown',
        status: customer.isActive ? 'active' : 'inactive'
      };
    }));

    res.json({ success: true, data: customersWithStats });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Pricing management
export const getPricing = async (req, res) => {
  try {
    // For now, return default pricing structure
    // In future, this could be stored in database
    const pricing = {
      baseFare: 50,
      perKmRate: 12,
      perMinuteRate: 2,
      surgeMultiplier: 1.0,
      minimumFare: 80,
      cancellationFee: 25,
      vehicleTypes: {
        car: { multiplier: 1.0, name: 'Car' },
        suv: { multiplier: 1.3, name: 'SUV' },
        auto: { multiplier: 0.8, name: 'Auto Rickshaw' }
      }
    };

    res.json({ success: true, data: pricing });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const updatePricing = async (req, res) => {
  try {
    // For now, just return the updated pricing
    // In future, this would save to database
    const updatedPricing = req.body;

    res.json({ success: true, data: updatedPricing });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
