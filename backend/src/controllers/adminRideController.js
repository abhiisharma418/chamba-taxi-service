const { Ride } = require('../models/rideModel');
const { User } = require('../models/userModel');
const { AdminAction } = require('../models/adminUserModel');
const TrackingData = require('../models/trackingModel');

// Get all active rides with real-time tracking
const getActiveRides = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 20,
      status,
      driverId,
      customerId,
      region
    } = req.query;

    const query = {
      status: { $in: ['requested', 'accepted', 'on-trip', 'driver_arrived'] }
    };

    if (status) query.status = status;
    if (driverId) query.driverId = driverId;
    if (customerId) query.customerId = customerId;

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const activeRides = await Ride.find(query)
      .populate('customerId', 'name email phone')
      .populate('driverId', 'name email phone')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit))
      .lean();

    // Get tracking data for each ride
    const ridesWithTracking = await Promise.all(
      activeRides.map(async (ride) => {
        let trackingData = null;
        if (ride.driverId) {
          trackingData = await TrackingData.findOne({
            driverId: ride.driverId,
            rideId: ride._id
          }).sort({ timestamp: -1 }).lean();
        }

        return {
          ...ride,
          tracking: trackingData,
          estimatedArrival: trackingData ? calculateETA(trackingData, ride.pickup) : null
        };
      })
    );

    const total = await Ride.countDocuments(query);

    res.json({
      success: true,
      data: {
        rides: ridesWithTracking,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / parseInt(limit))
        }
      }
    });
  } catch (error) {
    console.error('Get active rides error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch active rides',
      error: error.message
    });
  }
};

// Get ride details with full tracking history
const getRideDetails = async (req, res) => {
  try {
    const { rideId } = req.params;

    const ride = await Ride.findById(rideId)
      .populate('customerId', 'name email phone')
      .populate('driverId', 'name email phone')
      .lean();

    if (!ride) {
      return res.status(404).json({
        success: false,
        message: 'Ride not found'
      });
    }

    // Get complete tracking history
    const trackingHistory = await TrackingData.find({
      rideId: rideId
    }).sort({ timestamp: 1 }).lean();

    // Get driver's current location if ride is active
    let currentLocation = null;
    if (ride.driverId && ['accepted', 'on-trip', 'driver_arrived'].includes(ride.status)) {
      currentLocation = await TrackingData.findOne({
        driverId: ride.driverId
      }).sort({ timestamp: -1 }).lean();
    }

    // Calculate ride analytics
    const analytics = calculateRideAnalytics(trackingHistory, ride);

    res.json({
      success: true,
      data: {
        ride,
        tracking: {
          history: trackingHistory,
          current: currentLocation,
          analytics
        }
      }
    });
  } catch (error) {
    console.error('Get ride details error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch ride details',
      error: error.message
    });
  }
};

// Get real-time ride statistics
const getRideStats = async (req, res) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const [
      totalActiveRides,
      ridesRequested,
      ridesInProgress,
      ridesCompleted,
      todayRides,
      avgWaitTime,
      avgTripTime,
      statusBreakdown,
      hourlyStats
    ] = await Promise.all([
      Ride.countDocuments({
        status: { $in: ['requested', 'accepted', 'on-trip', 'driver_arrived'] }
      }),
      Ride.countDocuments({ status: 'requested' }),
      Ride.countDocuments({ status: { $in: ['accepted', 'on-trip', 'driver_arrived'] } }),
      Ride.countDocuments({ 
        status: 'completed',
        completedAt: { $gte: today, $lt: tomorrow }
      }),
      Ride.countDocuments({
        createdAt: { $gte: today, $lt: tomorrow }
      }),
      calculateAverageWaitTime(),
      calculateAverageTripTime(),
      Ride.aggregate([
        { $match: { createdAt: { $gte: today, $lt: tomorrow } } },
        { $group: { _id: '$status', count: { $sum: 1 } } }
      ]),
      getHourlyRideStats(today)
    ]);

    res.json({
      success: true,
      data: {
        overview: {
          totalActiveRides,
          ridesRequested,
          ridesInProgress,
          ridesCompleted,
          todayRides
        },
        performance: {
          avgWaitTime: Math.round(avgWaitTime),
          avgTripTime: Math.round(avgTripTime)
        },
        breakdown: {
          byStatus: statusBreakdown,
          byHour: hourlyStats
        }
      }
    });
  } catch (error) {
    console.error('Get ride stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch ride statistics',
      error: error.message
    });
  }
};

// Manually assign driver to ride
const assignDriver = async (req, res) => {
  try {
    const { rideId } = req.params;
    const { driverId, reason } = req.body;

    const [ride, driver] = await Promise.all([
      Ride.findById(rideId),
      User.findById(driverId)
    ]);

    if (!ride) {
      return res.status(404).json({
        success: false,
        message: 'Ride not found'
      });
    }

    if (!driver || driver.role !== 'driver') {
      return res.status(404).json({
        success: false,
        message: 'Driver not found'
      });
    }

    if (ride.status !== 'requested') {
      return res.status(400).json({
        success: false,
        message: 'Ride is not in requested status'
      });
    }

    const previousState = ride.toObject();

    // Assign driver
    ride.driverId = driverId;
    ride.status = 'accepted';
    ride.acceptedAt = new Date();
    await ride.save();

    // Log admin action
    await AdminAction.logAction(
      req.user.id,
      'manual_driver_assign',
      'ride',
      rideId,
      previousState,
      ride.toObject(),
      reason || 'Manual driver assignment',
      { ipAddress: req.ip, userAgent: req.get('User-Agent') }
    );

    res.json({
      success: true,
      data: ride,
      message: 'Driver assigned successfully'
    });
  } catch (error) {
    console.error('Assign driver error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to assign driver',
      error: error.message
    });
  }
};

// Cancel ride
const cancelRide = async (req, res) => {
  try {
    const { rideId } = req.params;
    const { reason } = req.body;

    const ride = await Ride.findById(rideId);

    if (!ride) {
      return res.status(404).json({
        success: false,
        message: 'Ride not found'
      });
    }

    if (ride.status === 'completed' || ride.status === 'cancelled') {
      return res.status(400).json({
        success: false,
        message: 'Ride cannot be cancelled'
      });
    }

    const previousState = ride.toObject();

    // Cancel ride
    ride.status = 'cancelled';
    ride.cancelledAt = new Date();
    ride.cancellationReason = reason;
    ride.cancelledBy = 'admin';
    await ride.save();

    // Log admin action
    await AdminAction.logAction(
      req.user.id,
      'ride_cancel',
      'ride',
      rideId,
      previousState,
      ride.toObject(),
      reason || 'Admin cancellation',
      { ipAddress: req.ip, userAgent: req.get('User-Agent') }
    );

    res.json({
      success: true,
      data: ride,
      message: 'Ride cancelled successfully'
    });
  } catch (error) {
    console.error('Cancel ride error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to cancel ride',
      error: error.message
    });
  }
};

// Get driver locations (for map view)
const getDriverLocations = async (req, res) => {
  try {
    const { bounds, status = 'all' } = req.query;

    let query = { role: 'driver' };
    
    if (status !== 'all') {
      query.status = status;
    }

    // Get active drivers
    const drivers = await User.find(query)
      .select('name phone status')
      .lean();

    const driverIds = drivers.map(d => d._id);

    // Get latest location for each driver
    const locations = await TrackingData.aggregate([
      { $match: { driverId: { $in: driverIds } } },
      { $sort: { timestamp: -1 } },
      {
        $group: {
          _id: '$driverId',
          location: { $first: '$location' },
          timestamp: { $first: '$timestamp' },
          speed: { $first: '$speed' },
          heading: { $first: '$heading' }
        }
      }
    ]);

    // Combine driver info with locations
    const driversWithLocations = drivers.map(driver => {
      const location = locations.find(loc => loc._id.toString() === driver._id.toString());
      return {
        ...driver,
        location: location ? {
          coordinates: location.location.coordinates,
          timestamp: location.timestamp,
          speed: location.speed,
          heading: location.heading
        } : null
      };
    }).filter(driver => driver.location); // Only include drivers with known locations

    // Filter by bounds if provided
    let filteredDrivers = driversWithLocations;
    if (bounds) {
      const { north, south, east, west } = JSON.parse(bounds);
      filteredDrivers = driversWithLocations.filter(driver => {
        const [lng, lat] = driver.location.coordinates;
        return lat >= south && lat <= north && lng >= west && lng <= east;
      });
    }

    res.json({
      success: true,
      data: filteredDrivers
    });
  } catch (error) {
    console.error('Get driver locations error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch driver locations',
      error: error.message
    });
  }
};

// Helper functions
function calculateETA(trackingData, destination) {
  if (!trackingData || !trackingData.location || !destination.coordinates) {
    return null;
  }

  const distance = calculateDistance(
    trackingData.location.coordinates[1],
    trackingData.location.coordinates[0],
    destination.coordinates[1],
    destination.coordinates[0]
  );

  // Estimate based on average speed (assuming 30 km/h in city)
  const avgSpeed = 30; // km/h
  const etaMinutes = (distance / avgSpeed) * 60;

  return Math.round(etaMinutes);
}

function calculateDistance(lat1, lon1, lat2, lon2) {
  const R = 6371; // Radius of the Earth in km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
}

function calculateRideAnalytics(trackingHistory, ride) {
  if (!trackingHistory.length) return {};

  const startTime = new Date(ride.createdAt);
  const acceptTime = ride.acceptedAt ? new Date(ride.acceptedAt) : null;
  const startTripTime = ride.startedAt ? new Date(ride.startedAt) : null;
  const endTime = ride.completedAt ? new Date(ride.completedAt) : new Date();

  let totalDistance = 0;
  let maxSpeed = 0;
  let avgSpeed = 0;

  for (let i = 1; i < trackingHistory.length; i++) {
    const prev = trackingHistory[i - 1];
    const curr = trackingHistory[i];
    
    if (prev.location && curr.location) {
      const segmentDistance = calculateDistance(
        prev.location.coordinates[1],
        prev.location.coordinates[0],
        curr.location.coordinates[1],
        curr.location.coordinates[0]
      );
      totalDistance += segmentDistance;
    }

    if (curr.speed > maxSpeed) {
      maxSpeed = curr.speed;
    }
  }

  if (trackingHistory.length > 0) {
    avgSpeed = trackingHistory.reduce((sum, point) => sum + (point.speed || 0), 0) / trackingHistory.length;
  }

  return {
    waitTime: acceptTime ? (acceptTime - startTime) / 1000 / 60 : null, // minutes
    tripDuration: startTripTime ? (endTime - startTripTime) / 1000 / 60 : null, // minutes
    totalDistance: Math.round(totalDistance * 100) / 100, // km
    maxSpeed: Math.round(maxSpeed),
    avgSpeed: Math.round(avgSpeed),
    trackingPoints: trackingHistory.length
  };
}

async function calculateAverageWaitTime() {
  const rides = await Ride.find({
    status: { $nin: ['requested'] },
    acceptedAt: { $exists: true }
  }).select('createdAt acceptedAt').lean();

  if (rides.length === 0) return 0;

  const totalWaitTime = rides.reduce((sum, ride) => {
    return sum + (new Date(ride.acceptedAt) - new Date(ride.createdAt));
  }, 0);

  return totalWaitTime / rides.length / 1000 / 60; // minutes
}

async function calculateAverageTripTime() {
  const rides = await Ride.find({
    status: 'completed',
    startedAt: { $exists: true },
    completedAt: { $exists: true }
  }).select('startedAt completedAt').lean();

  if (rides.length === 0) return 0;

  const totalTripTime = rides.reduce((sum, ride) => {
    return sum + (new Date(ride.completedAt) - new Date(ride.startedAt));
  }, 0);

  return totalTripTime / rides.length / 1000 / 60; // minutes
}

async function getHourlyRideStats(startDate) {
  const endDate = new Date(startDate);
  endDate.setDate(endDate.getDate() + 1);

  return Ride.aggregate([
    {
      $match: {
        createdAt: { $gte: startDate, $lt: endDate }
      }
    },
    {
      $group: {
        _id: { $hour: '$createdAt' },
        count: { $sum: 1 },
        completed: {
          $sum: { $cond: [{ $eq: ['$status', 'completed'] }, 1, 0] }
        },
        cancelled: {
          $sum: { $cond: [{ $eq: ['$status', 'cancelled'] }, 1, 0] }
        }
      }
    },
    { $sort: { _id: 1 } }
  ]);
}

module.exports = {
  getActiveRides,
  getRideDetails,
  getRideStats,
  assignDriver,
  cancelRide,
  getDriverLocations
};
