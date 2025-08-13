import mongoose from 'mongoose';

const scheduledRideSchema = new mongoose.Schema({
  rideId: {
    type: String,
    unique: true,
    required: true
  },
  customerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  driverId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: false
  },
  vehicleType: {
    type: String,
    enum: ['car', 'bike', 'premium', 'xl'],
    required: true,
    default: 'car'
  },
  pickupLocation: {
    address: {
      type: String,
      required: true,
      trim: true
    },
    coordinates: {
      latitude: {
        type: Number,
        required: true,
        min: -90,
        max: 90
      },
      longitude: {
        type: Number,
        required: true,
        min: -180,
        max: 180
      }
    },
    landmark: {
      type: String,
      trim: true
    }
  },
  destinationLocation: {
    address: {
      type: String,
      required: true,
      trim: true
    },
    coordinates: {
      latitude: {
        type: Number,
        required: true,
        min: -90,
        max: 90
      },
      longitude: {
        type: Number,
        required: true,
        min: -180,
        max: 180
      }
    },
    landmark: {
      type: String,
      trim: true
    }
  },
  scheduledDateTime: {
    type: Date,
    required: true,
    validate: {
      validator: function(value) {
        return value > new Date();
      },
      message: 'Scheduled time must be in the future'
    }
  },
  recurrence: {
    type: {
      type: String,
      enum: ['none', 'daily', 'weekly', 'monthly'],
      default: 'none'
    },
    endDate: {
      type: Date,
      required: false
    },
    daysOfWeek: [{
      type: Number,
      min: 0,
      max: 6
    }],
    frequency: {
      type: Number,
      default: 1,
      min: 1,
      max: 12
    }
  },
  fareEstimate: {
    baseFare: {
      type: Number,
      required: true,
      min: 0
    },
    distanceFare: {
      type: Number,
      required: true,
      min: 0
    },
    timeFare: {
      type: Number,
      required: true,
      min: 0
    },
    totalEstimate: {
      type: Number,
      required: true,
      min: 0
    },
    currency: {
      type: String,
      default: 'USD'
    }
  },
  paymentMethod: {
    type: {
      type: String,
      enum: ['cash', 'card', 'wallet', 'cod'],
      required: true
    },
    cardId: {
      type: String,
      required: function() { return this.paymentMethod.type === 'card'; }
    }
  },
  promoCode: {
    code: String,
    discountAmount: {
      type: Number,
      default: 0
    },
    discountType: {
      type: String,
      enum: ['percentage', 'fixed'],
      default: 'fixed'
    }
  },
  status: {
    type: String,
    enum: ['scheduled', 'confirmed', 'driver_assigned', 'started', 'completed', 'cancelled', 'failed'],
    default: 'scheduled'
  },
  priority: {
    type: String,
    enum: ['normal', 'high', 'urgent'],
    default: 'normal'
  },
  notifications: {
    reminderSent: {
      type: Boolean,
      default: false
    },
    confirmationSent: {
      type: Boolean,
      default: false
    },
    driverAssignedNotified: {
      type: Boolean,
      default: false
    },
    reminderTime: {
      type: Date,
      required: false
    }
  },
  specialRequests: [{
    type: {
      type: String,
      enum: ['child_seat', 'wheelchair_accessible', 'pet_friendly', 'extra_luggage', 'quiet_ride', 'music_preference']
    },
    description: String,
    fulfilled: {
      type: Boolean,
      default: false
    }
  }],
  passengerCount: {
    type: Number,
    default: 1,
    min: 1,
    max: 8
  },
  actualRideId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Booking',
    required: false
  },
  executionAttempts: [{
    attemptTime: {
      type: Date,
      default: Date.now
    },
    status: {
      type: String,
      enum: ['pending', 'driver_assigned', 'failed', 'completed']
    },
    failureReason: String,
    driverId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }
  }],
  customerNotes: {
    type: String,
    maxlength: 500
  },
  adminNotes: {
    type: String,
    maxlength: 1000
  },
  cancellationPolicy: {
    freeUntil: {
      type: Date,
      required: false
    },
    cancellationFee: {
      type: Number,
      default: 0
    }
  },
  estimatedDistance: {
    type: Number,
    required: true,
    min: 0
  },
  estimatedDuration: {
    type: Number,
    required: true,
    min: 0
  },
  weatherConsiderations: {
    checkWeather: {
      type: Boolean,
      default: false
    },
    weatherAlerts: [{
      alertType: String,
      severity: String,
      message: String,
      timestamp: Date
    }]
  },
  autoAssignment: {
    enabled: {
      type: Boolean,
      default: true
    },
    preferredDrivers: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }],
    exclusions: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }]
  }
}, {
  timestamps: true,
  indexes: [
    { customerId: 1, scheduledDateTime: 1 },
    { status: 1, scheduledDateTime: 1 },
    { driverId: 1, scheduledDateTime: 1 },
    { rideId: 1 }
  ]
});

// Generate unique ride ID
scheduledRideSchema.pre('save', async function(next) {
  if (this.isNew && !this.rideId) {
    const timestamp = Date.now().toString(36);
    const random = Math.random().toString(36).substr(2, 5);
    this.rideId = `SR${timestamp}${random}`.toUpperCase();
  }
  
  // Set reminder time (30 minutes before scheduled time)
  if (this.scheduledDateTime && !this.notifications.reminderTime) {
    this.notifications.reminderTime = new Date(this.scheduledDateTime.getTime() - 30 * 60 * 1000);
  }
  
  // Set free cancellation until (24 hours before for normal, 1 hour for urgent)
  if (this.scheduledDateTime && !this.cancellationPolicy.freeUntil) {
    const hoursBeforeFee = this.priority === 'urgent' ? 1 : 24;
    this.cancellationPolicy.freeUntil = new Date(this.scheduledDateTime.getTime() - hoursBeforeFee * 60 * 60 * 1000);
  }
  
  next();
});

// Instance methods
scheduledRideSchema.methods.canBeCancelled = function() {
  return this.status === 'scheduled' || this.status === 'confirmed';
};

scheduledRideSchema.methods.getCancellationFee = function() {
  if (new Date() < this.cancellationPolicy.freeUntil) {
    return 0;
  }
  return this.cancellationPolicy.cancellationFee || (this.fareEstimate.totalEstimate * 0.1);
};

scheduledRideSchema.methods.isExecutionTime = function(bufferMinutes = 10) {
  const now = new Date();
  const scheduledTime = new Date(this.scheduledDateTime);
  const bufferTime = bufferMinutes * 60 * 1000;
  
  return now >= (scheduledTime.getTime() - bufferTime) && now <= (scheduledTime.getTime() + bufferTime);
};

scheduledRideSchema.methods.shouldSendReminder = function() {
  const now = new Date();
  return !this.notifications.reminderSent && 
         this.notifications.reminderTime && 
         now >= this.notifications.reminderTime &&
         this.status === 'scheduled';
};

scheduledRideSchema.methods.getNextExecutionDates = function(count = 5) {
  if (this.recurrence.type === 'none') {
    return [this.scheduledDateTime];
  }
  
  const dates = [];
  let currentDate = new Date(this.scheduledDateTime);
  
  for (let i = 0; i < count; i++) {
    if (this.recurrence.endDate && currentDate > this.recurrence.endDate) {
      break;
    }
    
    dates.push(new Date(currentDate));
    
    switch (this.recurrence.type) {
      case 'daily':
        currentDate.setDate(currentDate.getDate() + this.recurrence.frequency);
        break;
      case 'weekly':
        currentDate.setDate(currentDate.getDate() + (7 * this.recurrence.frequency));
        break;
      case 'monthly':
        currentDate.setMonth(currentDate.getMonth() + this.recurrence.frequency);
        break;
    }
  }
  
  return dates;
};

scheduledRideSchema.methods.addExecutionAttempt = function(status, driverId = null, failureReason = null) {
  this.executionAttempts.push({
    status,
    driverId,
    failureReason,
    attemptTime: new Date()
  });
  return this.save();
};

// Static methods
scheduledRideSchema.statics.findDueForExecution = function(bufferMinutes = 10) {
  const now = new Date();
  const startTime = new Date(now.getTime() - bufferMinutes * 60 * 1000);
  const endTime = new Date(now.getTime() + bufferMinutes * 60 * 1000);
  
  return this.find({
    scheduledDateTime: { $gte: startTime, $lte: endTime },
    status: { $in: ['scheduled', 'confirmed'] }
  }).populate('customerId', 'name email phoneNumber')
    .populate('driverId', 'name email phoneNumber');
};

scheduledRideSchema.statics.findDueForReminder = function() {
  return this.find({
    'notifications.reminderSent': false,
    'notifications.reminderTime': { $lte: new Date() },
    status: 'scheduled'
  }).populate('customerId', 'name email phoneNumber');
};

scheduledRideSchema.statics.getUpcomingRides = function(customerId, limit = 10) {
  return this.find({
    customerId,
    scheduledDateTime: { $gte: new Date() },
    status: { $in: ['scheduled', 'confirmed', 'driver_assigned'] }
  }).sort({ scheduledDateTime: 1 })
    .limit(limit)
    .populate('driverId', 'name phoneNumber rating');
};

scheduledRideSchema.statics.getDriverSchedule = function(driverId, startDate, endDate) {
  return this.find({
    driverId,
    scheduledDateTime: { $gte: startDate, $lte: endDate },
    status: { $in: ['confirmed', 'driver_assigned'] }
  }).sort({ scheduledDateTime: 1 })
    .populate('customerId', 'name phoneNumber');
};

const ScheduledRide = mongoose.model('ScheduledRide', scheduledRideSchema);

export default ScheduledRide;
