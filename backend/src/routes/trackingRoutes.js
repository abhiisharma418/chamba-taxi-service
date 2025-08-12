import express from 'express';
import { authenticate, requireRoles } from '../middleware/auth.js';
import {
  startTracking,
  stopTracking,
  updateLocation,
  batchUpdateLocation,
  getTrackingStatus,
  getActiveRides,
  shareLiveLocation,
  triggerEmergency
} from '../controllers/trackingController.js';

const router = express.Router();

// Start/Stop tracking
router.post('/start', authenticate, startTracking);
router.post('/stop', authenticate, stopTracking);

// Location updates
router.post('/location', authenticate, requireRoles('driver'), updateLocation);
router.post('/location/batch', authenticate, requireRoles('driver'), batchUpdateLocation);

// Tracking status and data
router.get('/status/:rideId', authenticate, getTrackingStatus);
router.get('/active', authenticate, requireRoles('admin'), getActiveRides);

// Sharing and emergency
router.post('/share-location', authenticate, shareLiveLocation);
router.post('/emergency', authenticate, triggerEmergency);

// Location history
router.get('/history/:rideId', authenticate, async (req, res) => {
  try {
    const { rideId } = req.params;
    const { limit = 100 } = req.query;
    const userId = req.user.id;

    // Authorization check
    const { Ride } = await import('../models/rideModel.js');
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
        message: 'Not authorized to view tracking history'
      });
    }

    const { TrackingSession } = await import('../models/trackingModel.js');
    const session = await TrackingSession.getLocationHistory(rideId, parseInt(limit));

    if (!session) {
      return res.status(404).json({
        success: false,
        message: 'No tracking history found'
      });
    }

    res.json({
      success: true,
      data: {
        rideId,
        locationHistory: session.locationUpdates,
        totalPoints: session.locationUpdates.length
      }
    });

  } catch (error) {
    console.error('Get location history error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get location history'
    });
  }
});

// Public tracking endpoint (for shared links)
router.get('/public/:rideId/:token', async (req, res) => {
  try {
    const { rideId, token } = req.params;
    
    // Verify shared tracking token
    const { getRedis } = await import('../utils/redis.js');
    const redis = getRedis();
    const sharedData = await redis.get(`shared_tracking:${rideId}`);
    
    if (!sharedData) {
      return res.status(404).json({
        success: false,
        message: 'Shared tracking link expired or invalid'
      });
    }

    const trackingData = JSON.parse(sharedData);
    
    // Get current tracking status
    const { TrackingSession } = await import('../models/trackingModel.js');
    const session = await TrackingSession.findOne({ rideId, isActive: true })
      .populate('rideId', 'pickup destination status vehicleType')
      .select('lastLocation lastUpdateAt totalUpdates');

    if (!session) {
      return res.json({
        success: true,
        data: {
          rideId,
          isActive: false,
          message: 'Tracking session not active'
        }
      });
    }

    res.json({
      success: true,
      data: {
        rideId,
        isActive: true,
        ride: session.rideId,
        lastLocation: session.lastLocation,
        lastUpdateAt: session.lastUpdateAt,
        sharedAt: trackingData.sharedAt,
        expiresAt: trackingData.expiresAt
      }
    });

  } catch (error) {
    console.error('Public tracking error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get public tracking data'
    });
  }
});

// Analytics endpoints for admin
router.get('/analytics/stats', authenticate, requireRoles('admin'), async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    const start = startDate ? new Date(startDate) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const end = endDate ? new Date(endDate) : new Date();

    const { TrackingSession } = await import('../models/trackingModel.js');
    
    const stats = await TrackingSession.getTrackingStats(start, end);
    const activeCount = await TrackingSession.getActiveSessionsCount();

    res.json({
      success: true,
      data: {
        period: { startDate: start, endDate: end },
        activeSessionsCount: activeCount,
        dailyStats: stats
      }
    });

  } catch (error) {
    console.error('Tracking analytics error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get tracking analytics'
    });
  }
});

// Emergency alerts endpoint for admin
router.get('/emergency/alerts', authenticate, requireRoles('admin'), async (req, res) => {
  try {
    const { getRedis } = await import('../utils/redis.js');
    const redis = getRedis();
    
    const alerts = await redis.lrange('emergency_alerts', 0, -1);
    const parsedAlerts = alerts.map(alert => JSON.parse(alert));

    res.json({
      success: true,
      data: {
        alerts: parsedAlerts,
        count: parsedAlerts.length
      }
    });

  } catch (error) {
    console.error('Emergency alerts error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get emergency alerts'
    });
  }
});

// Driver location update endpoint (high frequency)
router.post('/driver/heartbeat', authenticate, requireRoles('driver'), async (req, res) => {
  try {
    const userId = req.user.id;
    const { lat, lng, heading, speed, accuracy } = req.body;

    if (!lat || !lng) {
      return res.status(400).json({
        success: false,
        message: 'Latitude and longitude are required'
      });
    }

    // Store in Redis for quick access
    const { getRedis } = await import('../utils/redis.js');
    const redis = getRedis();
    
    const locationData = {
      lat: parseFloat(lat),
      lng: parseFloat(lng),
      heading: heading || 0,
      speed: speed || 0,
      accuracy: accuracy || 0,
      timestamp: new Date().toISOString()
    };

    await redis.setex(`driver:live_location:${userId}`, 60, JSON.stringify(locationData));

    // Update in tracking session if active
    const { TrackingSession } = await import('../models/trackingModel.js');
    const session = await TrackingSession.getActiveSessionsByDriver(userId);
    
    if (session) {
      await session.addLocationUpdate(locationData);
      
      // Broadcast update
      const { broadcastLocationUpdate } = await import('../services/notificationService.js');
      await broadcastLocationUpdate(session.rideId.toString(), {
        driverId: userId,
        ...locationData
      });
    }

    res.json({
      success: true,
      data: {
        location: locationData,
        sessionActive: !!session
      }
    });

  } catch (error) {
    console.error('Driver heartbeat error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update driver location'
    });
  }
});

// Geofencing alerts
router.post('/geofence/alert', authenticate, async (req, res) => {
  try {
    const { rideId, zoneType, zoneName, location } = req.body;
    
    // Log geofence alert
    console.log(`Geofence alert: ${zoneType} ${zoneName} for ride ${rideId}`);
    
    // Store in tracking session
    const { TrackingSession } = await import('../models/trackingModel.js');
    const session = await TrackingSession.findOne({ rideId, isActive: true });
    
    if (session) {
      session.geofenceAlerts.push({
        type: zoneType,
        zoneName,
        location,
        timestamp: new Date()
      });
      await session.save();
    }

    res.json({
      success: true,
      message: 'Geofence alert recorded'
    });

  } catch (error) {
    console.error('Geofence alert error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to process geofence alert'
    });
  }
});

export default router;
