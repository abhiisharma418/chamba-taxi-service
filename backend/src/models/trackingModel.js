import mongoose from 'mongoose';

const locationSchema = new mongoose.Schema({
  lat: {
    type: Number,
    required: true,
    min: -90,
    max: 90
  },
  lng: {
    type: Number,
    required: true,
    min: -180,
    max: 180
  },
  heading: {
    type: Number,
    min: 0,
    max: 360,
    default: 0
  },
  speed: {
    type: Number,
    min: 0,
    default: 0
  },
  accuracy: {
    type: Number,
    min: 0,
    default: 0
  },
  altitude: {
    type: Number,
    default: 0
  },
  timestamp: {
    type: Date,
    default: Date.now,
    index: true
  }
}, { _id: false });

const trackingSessionSchema = new mongoose.Schema({
  rideId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Ride',
    required: true,
    index: true
  },
  driverId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    index: true
  },
  customerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    index: true
  },
  
  // Session status
  isActive: {
    type: Boolean,
    default: true,
    index: true
  },
  startedAt: {
    type: Date,
    default: Date.now,
    index: true
  },
  endedAt: Date,
  duration: {
    type: Number, // in seconds
    min: 0
  },
  
  // Location tracking
  locationUpdates: [locationSchema],
  lastLocation: locationSchema,
  lastUpdateAt: Date,
  totalUpdates: {
    type: Number,
    default: 0
  },
  
  // Session metadata
  startedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  endedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  endReason: {
    type: String,
    enum: ['completed', 'cancelled', 'manual', 'timeout', 'error']
  },
  
  // Quality metrics
  avgAccuracy: Number,
  maxSpeed: Number,
  totalDistance: Number, // in kilometers
  signalLossCount: {
    type: Number,
    default: 0
  },
  
  // Emergency alerts
  emergencyAlerts: [{
    triggeredBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    location: locationSchema,
    message: String,
    timestamp: {
      type: Date,
      default: Date.now
    },
    resolved: {
      type: Boolean,
      default: false
    },
    resolvedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    resolvedAt: Date
  }],
  
  // Sharing information
  sharedWith: [{
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    sharedAt: {
      type: Date,
      default: Date.now
    },
    expiresAt: Date,
    accessToken: String
  }],
  
  // Metadata
  metadata: {
    platform: {
      type: String,
      enum: ['web', 'mobile_app', 'admin', 'api'],
      default: 'web'
    },
    userAgent: String,
    ip: String,
    deviceId: String,
    appVersion: String,
    
    // Configuration
    updateInterval: {
      type: Number,
      default: 5000 // milliseconds
    },
    highAccuracyMode: {
      type: Boolean,
      default: false
    },
    
    // Performance metrics
    batteryOptimized: Boolean,
    networkType: String,
    connectionQuality: {
      type: String,
      enum: ['excellent', 'good', 'fair', 'poor']
    }
  },
  
  // Geofencing alerts
  geofenceAlerts: [{
    type: {
      type: String,
      enum: ['entered', 'exited', 'dwelling']
    },
    zoneName: String,
    location: locationSchema,
    timestamp: {
      type: Date,
      default: Date.now
    }
  }],
  
  // Route deviation tracking
  routeDeviations: [{
    location: locationSchema,
    deviationDistance: Number, // in meters
    timestamp: {
      type: Date,
      default: Date.now
    },
    reason: String
  }]
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes for better performance
trackingSessionSchema.index({ rideId: 1, isActive: 1 });
trackingSessionSchema.index({ driverId: 1, isActive: 1 });
trackingSessionSchema.index({ customerId: 1, startedAt: -1 });
trackingSessionSchema.index({ startedAt: -1 });
trackingSessionSchema.index({ 'locationUpdates.timestamp': -1 });
trackingSessionSchema.index({ 'lastLocation.timestamp': -1 });

// Compound indexes
trackingSessionSchema.index({ rideId: 1, startedAt: -1 });
trackingSessionSchema.index({ driverId: 1, startedAt: -1 });

// Geospatial index for location-based queries
trackingSessionSchema.index({ 'lastLocation.lat': 1, 'lastLocation.lng': 1 });

// Virtual for session duration in real-time
trackingSessionSchema.virtual('currentDuration').get(function() {
  if (this.isActive) {
    return Math.round((new Date().getTime() - this.startedAt.getTime()) / 1000);
  }
  return this.duration || 0;
});

// Virtual for location update frequency
trackingSessionSchema.virtual('updateFrequency').get(function() {
  if (this.totalUpdates && this.currentDuration > 0) {
    return this.totalUpdates / (this.currentDuration / 60); // updates per minute
  }
  return 0;
});

// Virtual for average speed
trackingSessionSchema.virtual('avgSpeed').get(function() {
  if (this.locationUpdates.length < 2) return 0;
  
  const speeds = this.locationUpdates
    .filter(loc => loc.speed > 0)
    .map(loc => loc.speed);
  
  if (speeds.length === 0) return 0;
  
  return speeds.reduce((sum, speed) => sum + speed, 0) / speeds.length;
});

// Instance methods
trackingSessionSchema.methods.addLocationUpdate = function(locationData) {
  // Calculate metrics
  this.lastLocation = locationData;
  this.lastUpdateAt = new Date();
  this.locationUpdates.push(locationData);
  this.totalUpdates = this.locationUpdates.length;
  
  // Update quality metrics
  if (locationData.accuracy) {
    const accuracies = this.locationUpdates
      .filter(loc => loc.accuracy > 0)
      .map(loc => loc.accuracy);
    
    if (accuracies.length > 0) {
      this.avgAccuracy = accuracies.reduce((sum, acc) => sum + acc, 0) / accuracies.length;
    }
  }
  
  if (locationData.speed && (!this.maxSpeed || locationData.speed > this.maxSpeed)) {
    this.maxSpeed = locationData.speed;
  }
  
  // Calculate total distance
  if (this.locationUpdates.length >= 2) {
    const prevLocation = this.locationUpdates[this.locationUpdates.length - 2];
    const distance = this.calculateDistance(
      prevLocation.lat, prevLocation.lng,
      locationData.lat, locationData.lng
    );
    this.totalDistance = (this.totalDistance || 0) + distance;
  }
  
  return this.save();
};

trackingSessionSchema.methods.endSession = function(reason, endedBy) {
  this.isActive = false;
  this.endedAt = new Date();
  this.endReason = reason;
  this.endedBy = endedBy;
  this.duration = Math.round((this.endedAt.getTime() - this.startedAt.getTime()) / 1000);
  
  return this.save();
};

trackingSessionSchema.methods.addEmergencyAlert = function(triggeredBy, location, message) {
  this.emergencyAlerts.push({
    triggeredBy,
    location,
    message,
    timestamp: new Date()
  });
  
  return this.save();
};

trackingSessionSchema.methods.shareWith = function(userId, expiresAt) {
  const accessToken = generateAccessToken();
  
  this.sharedWith.push({
    userId,
    sharedAt: new Date(),
    expiresAt,
    accessToken
  });
  
  return { accessToken, save: () => this.save() };
};

trackingSessionSchema.methods.calculateDistance = function(lat1, lng1, lat2, lng2) {
  const R = 6371; // Earth's radius in km
  const dLat = toRadians(lat2 - lat1);
  const dLng = toRadians(lng2 - lng1);
  
  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRadians(lat1)) * Math.cos(toRadians(lat2)) *
    Math.sin(dLng / 2) * Math.sin(dLng / 2);
  
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
};

// Static methods
trackingSessionSchema.statics.getActiveSessionsCount = function() {
  return this.countDocuments({ isActive: true });
};

trackingSessionSchema.statics.getActiveSessionsByDriver = function(driverId) {
  return this.findOne({ driverId, isActive: true }).populate('rideId');
};

trackingSessionSchema.statics.getSessionsByRide = function(rideId) {
  return this.find({ rideId }).sort({ startedAt: -1 });
};

trackingSessionSchema.statics.getTrackingStats = function(startDate, endDate) {
  return this.aggregate([
    {
      $match: {
        startedAt: { $gte: startDate, $lte: endDate }
      }
    },
    {
      $group: {
        _id: {
          $dateToString: { format: '%Y-%m-%d', date: '$startedAt' }
        },
        totalSessions: { $sum: 1 },
        activeSessions: {
          $sum: { $cond: ['$isActive', 1, 0] }
        },
        avgDuration: { $avg: '$duration' },
        totalDistance: { $sum: '$totalDistance' },
        avgAccuracy: { $avg: '$avgAccuracy' },
        emergencyAlerts: { $sum: { $size: '$emergencyAlerts' } }
      }
    },
    {
      $sort: { _id: 1 }
    }
  ]);
};

trackingSessionSchema.statics.getLocationHistory = function(rideId, limit = 100) {
  return this.findOne({ rideId })
    .select('locationUpdates')
    .slice('locationUpdates', -limit);
};

trackingSessionSchema.statics.findNearbyActiveSessions = function(lat, lng, radiusKm = 10) {
  return this.find({
    isActive: true,
    'lastLocation.lat': {
      $gte: lat - (radiusKm / 111.32),
      $lte: lat + (radiusKm / 111.32)
    },
    'lastLocation.lng': {
      $gte: lng - (radiusKm / (111.32 * Math.cos(lat * Math.PI / 180))),
      $lte: lng + (radiusKm / (111.32 * Math.cos(lat * Math.PI / 180)))
    }
  });
};

// Pre-save middleware
trackingSessionSchema.pre('save', function(next) {
  // Limit location updates to prevent document size issues
  if (this.locationUpdates.length > 1000) {
    this.locationUpdates = this.locationUpdates.slice(-1000);
  }
  
  // Update total updates count
  this.totalUpdates = this.locationUpdates.length;
  
  next();
});

// Helper functions
function toRadians(degrees) {
  return degrees * (Math.PI / 180);
}

function generateAccessToken() {
  return Math.random().toString(36).substring(2, 15) + 
         Math.random().toString(36).substring(2, 15);
}

export const TrackingSession = mongoose.model('TrackingSession', trackingSessionSchema);
