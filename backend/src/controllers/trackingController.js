import Joi from 'joi';
import { TrackingSession } from '../models/trackingModel.js';
import { Ride } from '../models/rideModel.js';
import { User } from '../models/userModel.js';
import { updateDriverLocation } from '../services/driverMatchingService.js';
import broadcastLocationUpdate  from '../services/notificationService.js';
import { getRedis } from '../utils/redis.js';

const startTrackingSchema = Joi.object({
  rideId: Joi.string().required(),
  driverId: Joi.string().optional(),
  customerId: Joi.string().optional()
});

const locationUpdateSchema = Joi.object({
  lat: Joi.number().min(-90).max(90).required(),
  lng: Joi.number().min(-180).max(180).required(),
  heading: Joi.number().min(0).max(360).optional(),
  speed: Joi.number().min(0).optional(),
  accuracy: Joi.number().min(0).optional(),
  altitude: Joi.number().optional(),
  timestamp: Joi.date().optional()
});

const batchLocationSchema = Joi.object({
  locations: Joi.array().items(
    Joi.object({
      lat: Joi.number().min(-90).max(90).required(),
      lng: Joi.number().min(-180).max(180).required(),
      timestamp: Joi.date().required(),
      heading: Joi.number().min(0).max(360).optional(),
      speed: Joi.number().min(0).optional(),
      accuracy: Joi.number().min(0).optional()
    })
  ).min(1).max(50).required()
});

export const startTracking = async (req, res) => {
  try {
    const { error, value } = startTrackingSchema.validate(req.body);
    if (error) {
      return res.status(400).json({
        success: false,
        message: error.details[0].message
      });
    }

    const { rideId, driverId, customerId } = value;
    const userId = req.user.id;

    // Verify ride exists and user is authorized
    const ride = await Ride.findById(rideId);
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
        message: 'Not authorized to track this ride'
      });
    }

    // Check if tracking session already exists
    let session = await TrackingSession.findOne({ rideId, isActive: true });

    if (!session) {
      // Create new tracking session
      session = new TrackingSession({
        rideId,
        driverId: driverId || ride.driverId,
        customerId: customerId || ride.customerId,
        startedBy: userId,
        isActive: true,
        metadata: {
          userAgent: req.get('User-Agent'),
          ip: req.ip,
          platform: req.body.platform || 'web'
        }
      });

      await session.save();
    }

    // Store session in Redis for quick access
    const redis = getRedis();
    await redis.setex(`tracking:${rideId}`, 3600, JSON.stringify({
      sessionId: session._id,
      rideId,
      driverId: session.driverId,
      customerId: session.customerId,
      startedAt: session.startedAt
    }));

    res.json({
      success: true,
      data: {
        sessionId: session._id,
        rideId,
        status: 'tracking_started',
        message: 'Live tracking started successfully'
      }
    });

  } catch (error) {
    console.error('Start tracking error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to start tracking'
    });
  }
};

export const stopTracking = async (req, res) => {
  try {
    const schema = Joi.object({
      rideId: Joi.string().required(),
      reason: Joi.string().valid('completed', 'cancelled', 'manual').default('manual')
    });

    const { error, value } = schema.validate(req.body);
    if (error) {
      return res.status(400).json({
        success: false,
        message: error.details[0].message
      });
    }

    const { rideId, reason } = value;
    const userId = req.user.id;

    // Find active tracking session
    const session = await TrackingSession.findOne({ rideId, isActive: true });
    if (!session) {
      return res.status(404).json({
        success: false,
        message: 'No active tracking session found'
      });
    }

    // Authorization check
    const ride = await Ride.findById(rideId);
    const isAuthorized = ride && (
      ride.customerId.toString() === userId ||
      ride.driverId?.toString() === userId ||
      req.user.role === 'admin'
    );

    if (!isAuthorized) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to stop tracking'
      });
    }

    // Stop tracking session
    session.isActive = false;
    session.endedAt = new Date();
    session.endReason = reason;
    session.endedBy = userId;

    // Calculate session statistics
    const duration = (session.endedAt.getTime() - session.startedAt.getTime()) / 1000; // seconds
    session.duration = Math.round(duration);
    session.totalUpdates = session.locationUpdates.length;

    await session.save();

    // Remove from Redis
    const redis = getRedis();
    await redis.del(`tracking:${rideId}`);

    res.json({
      success: true,
      data: {
        sessionId: session._id,
        duration: session.duration,
        totalUpdates: session.totalUpdates,
        reason,
        message: 'Tracking stopped successfully'
      }
    });

  } catch (error) {
    console.error('Stop tracking error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to stop tracking'
    });
  }
};

export const updateLocation = async (req, res) => {
  try {
    const { error, value } = locationUpdateSchema.validate(req.body);
    if (error) {
      return res.status(400).json({
        success: false,
        message: error.details[0].message
      });
    }

    const userId = req.user.id;
    const { lat, lng, heading, speed, accuracy, altitude, timestamp } = value;

    // Find active tracking session for this user (as driver)
    const session = await TrackingSession.findOne({
      driverId: userId,
      isActive: true
    }).populate('rideId');

    if (!session) {
      return res.status(404).json({
        success: false,
        message: 'No active tracking session found'
      });
    }

    const locationData = {
      lat,
      lng,
      heading: heading || 0,
      speed: speed || 0,
      accuracy: accuracy || 0,
      altitude: altitude || 0,
      timestamp: timestamp ? new Date(timestamp) : new Date()
    };

    // Store location update in session
    session.locationUpdates.push(locationData);
    session.lastLocation = locationData;
    session.lastUpdateAt = new Date();

    // Limit stored locations to last 100 to prevent document size issues
    if (session.locationUpdates.length > 100) {
      session.locationUpdates = session.locationUpdates.slice(-100);
    }

    await session.save();

    // Update driver location in driver matching service
    await updateDriverLocation(userId, lat, lng);

    // Store latest location in Redis for quick access
    const redis = getRedis();
    await redis.setex(`driver:current_location:${userId}`, 300, JSON.stringify({
      lat,
      lng,
      heading,
      speed,
      accuracy,
      timestamp: locationData.timestamp,
      rideId: session.rideId
    }));

    // Broadcast location update to all subscribers
    await broadcastLocationUpdate(session.rideId.toString(), {
      driverId: userId,
      lat,
      lng,
      heading,
      speed,
      accuracy,
      timestamp: locationData.timestamp
    });

    // Calculate ETA if destination is available
    let eta = null;
    if (session.rideId?.destination?.coordinates) {
      eta = await calculateETA(
        lat, lng,
        session.rideId.destination.coordinates[1],
        session.rideId.destination.coordinates[0]
      );
    }

    res.json({
      success: true,
      data: {
        sessionId: session._id,
        location: locationData,
        eta,
        message: 'Location updated successfully'
      }
    });

  } catch (error) {
    console.error('Location update error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update location'
    });
  }
};

export const batchUpdateLocation = async (req, res) => {
  try {
    const { error, value } = batchLocationSchema.validate(req.body);
    if (error) {
      return res.status(400).json({
        success: false,
        message: error.details[0].message
      });
    }

    const userId = req.user.id;
    const { locations } = value;

    // Find active tracking session
    const session = await TrackingSession.findOne({
      driverId: userId,
      isActive: true
    });

    if (!session) {
      return res.status(404).json({
        success: false,
        message: 'No active tracking session found'
      });
    }

    // Process batch locations
    const processedLocations = locations.map(loc => ({
      lat: loc.lat,
      lng: loc.lng,
      heading: loc.heading || 0,
      speed: loc.speed || 0,
      accuracy: loc.accuracy || 0,
      timestamp: new Date(loc.timestamp)
    }));

    // Add to session (keep only last 100)
    session.locationUpdates.push(...processedLocations);
    if (session.locationUpdates.length > 100) {
      session.locationUpdates = session.locationUpdates.slice(-100);
    }

    // Update last location to the most recent one
    const latestLocation = processedLocations[processedLocations.length - 1];
    session.lastLocation = latestLocation;
    session.lastUpdateAt = new Date();

    await session.save();

    // Update driver location with latest position
    await updateDriverLocation(userId, latestLocation.lat, latestLocation.lng);

    // Broadcast only the latest location to avoid spam
    await broadcastLocationUpdate(session.rideId.toString(), {
      driverId: userId,
      ...latestLocation
    });

    res.json({
      success: true,
      data: {
        sessionId: session._id,
        processedCount: processedLocations.length,
        lastLocation: latestLocation,
        message: 'Batch location update completed'
      }
    });

  } catch (error) {
    console.error('Batch location update error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to process batch location update'
    });
  }
};

export const getTrackingStatus = async (req, res) => {
  try {
    const { rideId } = req.params;
    const userId = req.user.id;

    // Verify authorization
    const ride = await Ride.findById(rideId);
    if (!ride) {
      return res.status(404).json({
        success: false,
        message: 'Ride not found'
      });
    }

    const isAuthorized = (
      ride.customerId.toString() === userId ||
      ride.driverId?.toString() === userId ||
      req.user.role === 'admin'
    );

    if (!isAuthorized) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to view tracking status'
      });
    }

    // Get tracking session
    const session = await TrackingSession.findOne({ rideId, isActive: true })
      .populate('driverId', 'name phone vehicleModel vehicleNumber')
      .populate('customerId', 'name phone');

    if (!session) {
      return res.json({
        success: true,
        data: {
          isActive: false,
          message: 'No active tracking session'
        }
      });
    }

    // Get latest location from Redis if available
    const redis = getRedis();
    let currentLocation = null;
    
    if (session.driverId) {
      const locationData = await redis.get(`driver:current_location:${session.driverId._id}`);
      if (locationData) {
        currentLocation = JSON.parse(locationData);
      }
    }

    res.json({
      success: true,
      data: {
        sessionId: session._id,
        rideId,
        isActive: session.isActive,
        startedAt: session.startedAt,
        lastUpdateAt: session.lastUpdateAt,
        currentLocation: currentLocation || session.lastLocation,
        driver: session.driverId,
        customer: session.customerId,
        totalUpdates: session.locationUpdates.length,
        duration: session.isActive ? 
          Math.round((new Date().getTime() - session.startedAt.getTime()) / 1000) :
          session.duration
      }
    });

  } catch (error) {
    console.error('Get tracking status error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get tracking status'
    });
  }
};

export const getActiveRides = async (req, res) => {
  try {
    // Admin only endpoint
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Admin access required'
      });
    }

    const activeSessions = await TrackingSession.find({ isActive: true })
      .populate('rideId', 'pickup destination status fare vehicleType')
      .populate('driverId', 'name phone vehicleModel vehicleNumber')
      .populate('customerId', 'name phone')
      .sort({ startedAt: -1 });

    const redis = getRedis();
    const enrichedSessions = await Promise.all(
      activeSessions.map(async (session) => {
        let currentLocation = null;
        
        if (session.driverId) {
          const locationData = await redis.get(`driver:current_location:${session.driverId._id}`);
          if (locationData) {
            currentLocation = JSON.parse(locationData);
          }
        }

        return {
          sessionId: session._id,
          rideId: session.rideId,
          driver: session.driverId,
          customer: session.customerId,
          startedAt: session.startedAt,
          lastUpdateAt: session.lastUpdateAt,
          currentLocation: currentLocation || session.lastLocation,
          duration: Math.round((new Date().getTime() - session.startedAt.getTime()) / 1000)
        };
      })
    );

    res.json({
      success: true,
      data: enrichedSessions
    });

  } catch (error) {
    console.error('Get active rides error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get active rides'
    });
  }
};

export const shareLiveLocation = async (req, res) => {
  try {
    const schema = Joi.object({
      rideId: Joi.string().required(),
      customerId: Joi.string().required(),
      message: Joi.string().optional()
    });

    const { error, value } = schema.validate(req.body);
    if (error) {
      return res.status(400).json({
        success: false,
        message: error.details[0].message
      });
    }

    const { rideId, customerId, message } = value;

    // Generate shareable tracking link
    const trackingLink = `${process.env.FRONTEND_URL || 'https://ridewithus.app'}/track/${rideId}`;

    // Store shared location info
    const redis = getRedis();
    await redis.setex(`shared_tracking:${rideId}`, 3600, JSON.stringify({
      rideId,
      customerId,
      sharedAt: new Date(),
      expiresAt: new Date(Date.now() + 3600000), // 1 hour
      message: message || 'Live ride tracking'
    }));

    res.json({
      success: true,
      data: {
        trackingLink,
        expiresAt: new Date(Date.now() + 3600000),
        message: 'Location shared successfully'
      }
    });

  } catch (error) {
    console.error('Share location error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to share location'
    });
  }
};

export const triggerEmergency = async (req, res) => {
  try {
    const schema = Joi.object({
      rideId: Joi.string().required(),
      location: Joi.object({
        lat: Joi.number().required(),
        lng: Joi.number().required()
      }).required(),
      message: Joi.string().optional()
    });

    const { error, value } = schema.validate(req.body);
    if (error) {
      return res.status(400).json({
        success: false,
        message: error.details[0].message
      });
    }

    const { rideId, location, message } = value;
    const userId = req.user.id;

    // Get ride and user info
    const ride = await Ride.findById(rideId).populate('driverId customerId');
    if (!ride) {
      return res.status(404).json({
        success: false,
        message: 'Ride not found'
      });
    }

    // Log emergency alert
    const emergencyData = {
      rideId,
      userId,
      userRole: req.user.role,
      location,
      message: message || 'Emergency alert triggered',
      timestamp: new Date(),
      ride: {
        pickup: ride.pickup,
        destination: ride.destination,
        status: ride.status
      }
    };

    // Store in Redis for immediate access
    const redis = getRedis();
    await redis.lpush('emergency_alerts', JSON.stringify(emergencyData));
    await redis.expire('emergency_alerts', 86400); // 24 hours

    // Notify emergency contacts and admin
    await notifyEmergencyContacts(emergencyData);

    res.json({
      success: true,
      data: {
        alertId: `EMG_${Date.now()}`,
        message: 'Emergency alert sent successfully',
        timestamp: emergencyData.timestamp
      }
    });

  } catch (error) {
    console.error('Emergency trigger error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to trigger emergency alert'
    });
  }
};

// Helper functions
async function calculateETA(fromLat, fromLng, toLat, toLng) {
  try {
    // Simple calculation - in production, use Google Directions API
    const distance = calculateDistance(fromLat, fromLng, toLat, toLng);
    const avgSpeed = 30; // km/h average city speed
    return Math.round((distance / avgSpeed) * 60); // minutes
  } catch (error) {
    console.error('ETA calculation error:', error);
    return null;
  }
}

function calculateDistance(lat1, lng1, lat2, lng2) {
  const R = 6371; // Earth's radius in km
  const dLat = toRadians(lat2 - lat1);
  const dLng = toRadians(lng2 - lng1);
  
  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRadians(lat1)) * Math.cos(toRadians(lat2)) *
    Math.sin(dLng / 2) * Math.sin(dLng / 2);
  
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

function toRadians(degrees) {
  return degrees * (Math.PI / 180);
}

async function notifyEmergencyContacts(emergencyData) {
  try {
    // This would integrate with actual emergency services
    // For now, just log and notify admin
    console.log('EMERGENCY ALERT:', emergencyData);
    
    // You could integrate with:
    // - Local emergency services API
    // - SMS alerts to emergency contacts
    // - Email notifications
    // - Push notifications to admin panel
    
  } catch (error) {
    console.error('Emergency notification error:', error);
  }
}
