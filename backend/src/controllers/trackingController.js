import Joi from 'joi';
import trackingService from '../services/trackingService.js';
import { Ride } from '../models/rideModel.js';

// Start tracking a ride
export const startTracking = async (req, res) => {
  const schema = Joi.object({
    rideId: Joi.string().required(),
    driverId: Joi.string().optional(),
    customerId: Joi.string().optional()
  });

  const { error, value } = schema.validate(req.body);
  if (error) return res.status(400).json({ success: false, message: error.message });

  try {
    // Get ride details if not provided
    const ride = await Ride.findById(value.rideId);
    if (!ride) return res.status(404).json({ success: false, message: 'Ride not found' });

    const driverId = value.driverId || ride.driverId;
    const customerId = value.customerId || ride.customerId;

    if (!driverId || !customerId) {
      return res.status(400).json({ 
        success: false, 
        message: 'Driver and customer IDs are required' 
      });
    }

    const result = await trackingService.startRideTracking(
      value.rideId,
      driverId.toString(),
      customerId.toString()
    );

    if (result.success) {
      res.json({ success: true, data: result });
    } else {
      res.status(400).json({ success: false, message: result.error });
    }
  } catch (error) {
    console.error('Start tracking error:', error);
    res.status(500).json({ success: false, message: 'Failed to start tracking' });
  }
};

// Update driver location
export const updateLocation = async (req, res) => {
  const schema = Joi.object({
    lat: Joi.number().min(-90).max(90).required(),
    lng: Joi.number().min(-180).max(180).required(),
    heading: Joi.number().min(0).max(360).optional(),
    speed: Joi.number().min(0).optional(),
    accuracy: Joi.number().min(0).optional()
  });

  const { error, value } = schema.validate(req.body);
  if (error) return res.status(400).json({ success: false, message: error.message });

  try {
    const driverId = req.user.id;
    
    const result = await trackingService.updateDriverLocation(driverId, value);
    
    // Also check geofence
    await trackingService.checkGeofence(driverId, { lat: value.lat, lng: value.lng });

    if (result.success) {
      res.json({ success: true, data: result });
    } else {
      res.status(400).json({ success: false, message: result.error });
    }
  } catch (error) {
    console.error('Update location error:', error);
    res.status(500).json({ success: false, message: 'Failed to update location' });
  }
};

// Stop tracking a ride
export const stopTracking = async (req, res) => {
  const schema = Joi.object({
    rideId: Joi.string().required(),
    reason: Joi.string().valid('completed', 'cancelled', 'manual').default('completed')
  });

  const { error, value } = schema.validate(req.body);
  if (error) return res.status(400).json({ success: false, message: error.message });

  try {
    const result = await trackingService.stopRideTracking(value.rideId, value.reason);

    if (result.success) {
      res.json({ success: true, data: result });
    } else {
      res.status(404).json({ success: false, message: result.message });
    }
  } catch (error) {
    console.error('Stop tracking error:', error);
    res.status(500).json({ success: false, message: 'Failed to stop tracking' });
  }
};

// Get ride tracking status
export const getTrackingStatus = async (req, res) => {
  try {
    const { rideId } = req.params;
    
    const status = trackingService.getRideTrackingStatus(rideId);
    
    if (status) {
      res.json({ success: true, data: status });
    } else {
      res.status(404).json({ success: false, message: 'Ride not being tracked' });
    }
  } catch (error) {
    console.error('Get tracking status error:', error);
    res.status(500).json({ success: false, message: 'Failed to get tracking status' });
  }
};

// Get all active rides (admin only)
export const getActiveRides = async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Admin access required' });
    }

    const activeRides = trackingService.getActiveRides();
    res.json({ success: true, data: activeRides });
  } catch (error) {
    console.error('Get active rides error:', error);
    res.status(500).json({ success: false, message: 'Failed to get active rides' });
  }
};

// Share live location
export const shareLiveLocation = async (req, res) => {
  const schema = Joi.object({
    rideId: Joi.string().required(),
    customerId: Joi.string().required()
  });

  const { error, value } = schema.validate(req.body);
  if (error) return res.status(400).json({ success: false, message: error.message });

  try {
    const driverId = req.user.id;
    
    const result = await trackingService.shareLiveLocation(
      value.rideId,
      driverId,
      value.customerId
    );

    if (result.success) {
      res.json({ success: true, data: result });
    } else {
      res.status(400).json({ success: false, message: result.message });
    }
  } catch (error) {
    console.error('Share location error:', error);
    res.status(500).json({ success: false, message: 'Failed to share location' });
  }
};

// Trigger emergency tracking
export const triggerEmergency = async (req, res) => {
  const schema = Joi.object({
    rideId: Joi.string().required(),
    location: Joi.object({
      lat: Joi.number().required(),
      lng: Joi.number().required()
    }).required(),
    message: Joi.string().optional()
  });

  const { error, value } = schema.validate(req.body);
  if (error) return res.status(400).json({ success: false, message: error.message });

  try {
    const triggeredBy = req.user.id;
    
    const result = await trackingService.triggerEmergencyTracking(
      value.rideId,
      triggeredBy,
      value.location
    );

    if (result.success) {
      // Also log emergency in database
      await Ride.findByIdAndUpdate(value.rideId, {
        $push: {
          emergencyAlerts: {
            triggeredBy,
            location: value.location,
            message: value.message,
            timestamp: new Date()
          }
        }
      });

      res.json({ success: true, data: result });
    } else {
      res.status(400).json({ success: false, message: result.message });
    }
  } catch (error) {
    console.error('Trigger emergency error:', error);
    res.status(500).json({ success: false, message: 'Failed to trigger emergency' });
  }
};

// Get driver location history for a ride
export const getLocationHistory = async (req, res) => {
  try {
    const { rideId } = req.params;
    
    const ride = await Ride.findById(rideId);
    if (!ride) return res.status(404).json({ success: false, message: 'Ride not found' });

    // Check if user has access to this ride
    if (req.user.role !== 'admin' && 
        ride.customerId.toString() !== req.user.id && 
        ride.driverId?.toString() !== req.user.id) {
      return res.status(403).json({ success: false, message: 'Access denied' });
    }

    // In a real app, you'd store location history in database
    // For now, return current tracking status
    const status = trackingService.getRideTrackingStatus(rideId);
    
    res.json({ 
      success: true, 
      data: {
        rideId,
        currentStatus: status,
        message: 'Location history feature coming soon'
      }
    });
  } catch (error) {
    console.error('Get location history error:', error);
    res.status(500).json({ success: false, message: 'Failed to get location history' });
  }
};

// Batch location update (for efficiency)
export const batchUpdateLocation = async (req, res) => {
  const schema = Joi.object({
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

  const { error, value } = schema.validate(req.body);
  if (error) return res.status(400).json({ success: false, message: error.message });

  try {
    const driverId = req.user.id;
    const results = [];

    // Process locations in order (most recent last)
    const sortedLocations = value.locations.sort((a, b) => 
      new Date(a.timestamp) - new Date(b.timestamp)
    );

    for (const location of sortedLocations) {
      const result = await trackingService.updateDriverLocation(driverId, location);
      results.push(result);
    }

    // Check geofence with latest location
    const latestLocation = sortedLocations[sortedLocations.length - 1];
    await trackingService.checkGeofence(driverId, latestLocation);

    res.json({ 
      success: true, 
      data: {
        processed: results.length,
        successful: results.filter(r => r.success).length,
        failed: results.filter(r => !r.success).length
      }
    });
  } catch (error) {
    console.error('Batch update location error:', error);
    res.status(500).json({ success: false, message: 'Failed to batch update locations' });
  }
};
