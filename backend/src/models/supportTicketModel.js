import mongoose from 'mongoose';

const supportTicketSchema = new mongoose.Schema({
  ticketId: {
    type: String,
    unique: true,
    required: true,
    index: true
  },
  user: {
    id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    name: {
      type: String,
      required: true
    },
    email: {
      type: String,
      required: true
    },
    phone: String,
    userType: {
      type: String,
      enum: ['customer', 'driver'],
      required: true
    }
  },
  category: {
    type: String,
    enum: [
      'ride_issue',
      'payment_issue', 
      'account_issue',
      'driver_behavior',
      'app_issue',
      'vehicle_issue',
      'safety_concern',
      'feature_request',
      'other'
    ],
    required: true
  },
  priority: {
    type: String,
    enum: ['low', 'medium', 'high', 'urgent'],
    default: 'medium'
  },
  status: {
    type: String,
    enum: ['open', 'in_progress', 'pending_user', 'resolved', 'closed'],
    default: 'open'
  },
  subject: {
    type: String,
    required: true,
    maxlength: 200
  },
  description: {
    type: String,
    required: true,
    maxlength: 2000
  },
  rideId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Ride'
  },
  assignedTo: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'AdminUser'
  },
  messages: [{
    sender: {
      id: {
        type: mongoose.Schema.Types.ObjectId,
        required: true
      },
      name: {
        type: String,
        required: true
      },
      type: {
        type: String,
        enum: ['user', 'admin'],
        required: true
      }
    },
    message: {
      type: String,
      required: true,
      maxlength: 1000
    },
    attachments: [{
      filename: String,
      url: String,
      type: {
        type: String,
        enum: ['image', 'document', 'video']
      }
    }],
    timestamp: {
      type: Date,
      default: Date.now
    },
    isInternal: {
      type: Boolean,
      default: false // Internal notes only visible to admins
    }
  }],
  metadata: {
    source: {
      type: String,
      enum: ['app', 'web', 'phone', 'email'],
      default: 'app'
    },
    deviceInfo: {
      platform: String,
      version: String,
      model: String
    },
    appVersion: String,
    location: {
      latitude: Number,
      longitude: Number,
      address: String
    }
  },
  resolution: {
    type: String,
    maxlength: 1000
  },
  feedback: {
    rating: {
      type: Number,
      min: 1,
      max: 5
    },
    comment: String,
    submittedAt: Date
  },
  tags: [String],
  escalated: {
    type: Boolean,
    default: false
  },
  escalatedAt: Date,
  estimatedResolutionTime: Date,
  actualResolutionTime: Date,
  firstResponseTime: Date,
  lastActivityAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Index for efficient queries
supportTicketSchema.index({ 'user.id': 1, status: 1 });
supportTicketSchema.index({ assignedTo: 1, status: 1 });
supportTicketSchema.index({ category: 1, priority: 1 });
supportTicketSchema.index({ createdAt: -1 });
supportTicketSchema.index({ lastActivityAt: -1 });

// Generate unique ticket ID
supportTicketSchema.pre('save', async function(next) {
  if (this.isNew) {
    const count = await this.constructor.countDocuments({});
    this.ticketId = `RWU-${String(count + 1).padStart(6, '0')}`;
  }
  this.lastActivityAt = new Date();
  next();
});

// Virtual for ticket age
supportTicketSchema.virtual('ageInHours').get(function() {
  return Math.floor((new Date() - this.createdAt) / (1000 * 60 * 60));
});

// Virtual for response time SLA
supportTicketSchema.virtual('slaStatus').get(function() {
  const hoursOpen = this.ageInHours;
  const priorityLimits = {
    urgent: 1,
    high: 4,
    medium: 24,
    low: 72
  };
  
  const limit = priorityLimits[this.priority];
  if (!this.firstResponseTime && hoursOpen > limit) {
    return 'breached';
  } else if (!this.firstResponseTime && hoursOpen > limit * 0.8) {
    return 'at_risk';
  }
  return 'on_track';
});

// Method to add message
supportTicketSchema.methods.addMessage = function(senderInfo, messageText, attachments = [], isInternal = false) {
  this.messages.push({
    sender: senderInfo,
    message: messageText,
    attachments,
    isInternal
  });
  
  // Set first response time if this is the first admin response
  if (senderInfo.type === 'admin' && !this.firstResponseTime) {
    this.firstResponseTime = new Date();
  }
  
  return this.save();
};

// Method to update status
supportTicketSchema.methods.updateStatus = function(newStatus, userId, resolution = null) {
  const oldStatus = this.status;
  this.status = newStatus;
  
  if (resolution) {
    this.resolution = resolution;
  }
  
  if (newStatus === 'resolved' || newStatus === 'closed') {
    this.actualResolutionTime = new Date();
  }
  
  // Add system message about status change
  this.messages.push({
    sender: {
      id: userId,
      name: 'System',
      type: 'admin'
    },
    message: `Ticket status changed from ${oldStatus} to ${newStatus}`,
    isInternal: true
  });
  
  return this.save();
};

export const SupportTicket = mongoose.model('SupportTicket', supportTicketSchema);
