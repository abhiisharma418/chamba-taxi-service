const mongoose = require('mongoose');

// User Activity Log Schema
const userActivitySchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  action: {
    type: String,
    required: true,
    enum: [
      'login', 'logout', 'profile_update', 'document_upload', 
      'ride_request', 'ride_complete', 'payment_made', 'rating_given',
      'vehicle_added', 'vehicle_updated', 'support_ticket', 'password_change'
    ]
  },
  details: {
    type: mongoose.Schema.Types.Mixed // Flexible object for action-specific data
  },
  ipAddress: String,
  userAgent: String,
  location: {
    latitude: Number,
    longitude: Number,
    address: String
  },
  metadata: {
    deviceType: String,
    platform: String,
    appVersion: String
  }
}, {
  timestamps: true
});

// User Suspension Schema
const userSuspensionSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  suspendedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  reason: {
    type: String,
    required: true
  },
  type: {
    type: String,
    enum: ['temporary', 'permanent'],
    default: 'temporary'
  },
  startDate: {
    type: Date,
    default: Date.now
  },
  endDate: {
    type: Date
  },
  isActive: {
    type: Boolean,
    default: true
  },
  appealSubmitted: {
    type: Boolean,
    default: false
  },
  appealDetails: {
    message: String,
    submittedAt: Date,
    reviewedAt: Date,
    reviewedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    status: {
      type: String,
      enum: ['pending', 'approved', 'rejected'],
      default: 'pending'
    }
  }
}, {
  timestamps: true
});

// User Verification Schema
const userVerificationSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true
  },
  email: {
    verified: { type: Boolean, default: false },
    verifiedAt: Date,
    verificationToken: String
  },
  phone: {
    verified: { type: Boolean, default: false },
    verifiedAt: Date,
    verificationCode: String,
    verificationExpiry: Date
  },
  identity: {
    verified: { type: Boolean, default: false },
    verifiedAt: Date,
    verifiedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    documents: [{
      type: String,
      status: {
        type: String,
        enum: ['pending', 'approved', 'rejected'],
        default: 'pending'
      },
      rejectionReason: String,
      reviewedAt: Date,
      reviewedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
      }
    }]
  },
  background: {
    checked: { type: Boolean, default: false },
    checkedAt: Date,
    checkedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    status: {
      type: String,
      enum: ['pending', 'clear', 'flagged'],
      default: 'pending'
    },
    notes: String
  }
}, {
  timestamps: true
});

// Admin Action Log Schema
const adminActionSchema = new mongoose.Schema({
  adminId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  action: {
    type: String,
    required: true,
    enum: [
      'user_suspend', 'user_unsuspend', 'user_verify', 'user_reject',
      'document_approve', 'document_reject', 'fare_adjust', 'refund_process',
      'system_config_change', 'promotion_create', 'zone_update', 'user_delete'
    ]
  },
  targetType: {
    type: String,
    enum: ['user', 'ride', 'payment', 'vehicle', 'system', 'promotion', 'zone'],
    required: true
  },
  targetId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true
  },
  previousState: mongoose.Schema.Types.Mixed,
  newState: mongoose.Schema.Types.Mixed,
  reason: String,
  ipAddress: String,
  userAgent: String
}, {
  timestamps: true
});

// Indexes for better performance
userActivitySchema.index({ userId: 1, createdAt: -1 });
userActivitySchema.index({ action: 1, createdAt: -1 });
userSuspensionSchema.index({ userId: 1, isActive: 1 });
userVerificationSchema.index({ userId: 1 });
adminActionSchema.index({ adminId: 1, createdAt: -1 });
adminActionSchema.index({ targetType: 1, targetId: 1 });

// Virtual for activity summary
userActivitySchema.virtual('summary').get(function() {
  return {
    action: this.action,
    timestamp: this.createdAt,
    details: this.details
  };
});

// Method to log user activity
userActivitySchema.statics.logActivity = function(userId, action, details = {}, metadata = {}) {
  return this.create({
    userId,
    action,
    details,
    ipAddress: metadata.ipAddress,
    userAgent: metadata.userAgent,
    location: metadata.location,
    metadata: {
      deviceType: metadata.deviceType,
      platform: metadata.platform,
      appVersion: metadata.appVersion
    }
  });
};

// Method to get user activity stats
userActivitySchema.statics.getUserActivityStats = function(userId, days = 30) {
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);
  
  return this.aggregate([
    { $match: { userId: new mongoose.Types.ObjectId(userId), createdAt: { $gte: startDate } } },
    { $group: { _id: '$action', count: { $sum: 1 } } },
    { $sort: { count: -1 } }
  ]);
};

// Method to suspend user
userSuspensionSchema.statics.suspendUser = function(userId, suspendedBy, reason, type = 'temporary', endDate = null) {
  // Deactivate any existing active suspensions
  this.updateMany(
    { userId, isActive: true },
    { isActive: false }
  );
  
  return this.create({
    userId,
    suspendedBy,
    reason,
    type,
    endDate: type === 'temporary' ? endDate : null
  });
};

// Method to unsuspend user
userSuspensionSchema.statics.unsuspendUser = function(userId) {
  return this.updateMany(
    { userId, isActive: true },
    { isActive: false }
  );
};

// Method to check if user is suspended
userSuspensionSchema.statics.isUserSuspended = async function(userId) {
  const suspension = await this.findOne({
    userId,
    isActive: true,
    $or: [
      { type: 'permanent' },
      { type: 'temporary', endDate: { $gt: new Date() } }
    ]
  });
  
  return !!suspension;
};

// Method to verify user documents
userVerificationSchema.methods.verifyDocument = function(documentType, status, reviewedBy, rejectionReason = null) {
  const document = this.identity.documents.find(doc => doc.type === documentType);
  
  if (document) {
    document.status = status;
    document.reviewedAt = new Date();
    document.reviewedBy = reviewedBy;
    if (rejectionReason) document.rejectionReason = rejectionReason;
  } else {
    this.identity.documents.push({
      type: documentType,
      status,
      reviewedAt: new Date(),
      reviewedBy,
      rejectionReason
    });
  }
  
  // Check if all required documents are approved
  const requiredDocs = ['driving_license', 'aadhar_card', 'pan_card', 'vehicle_registration'];
  const approvedDocs = this.identity.documents.filter(doc => 
    requiredDocs.includes(doc.type) && doc.status === 'approved'
  );
  
  if (approvedDocs.length === requiredDocs.length) {
    this.identity.verified = true;
    this.identity.verifiedAt = new Date();
    this.identity.verifiedBy = reviewedBy;
  }
  
  return this.save();
};

// Method to log admin action
adminActionSchema.statics.logAction = function(adminId, action, targetType, targetId, previousState, newState, reason, metadata = {}) {
  return this.create({
    adminId,
    action,
    targetType,
    targetId,
    previousState,
    newState,
    reason,
    ipAddress: metadata.ipAddress,
    userAgent: metadata.userAgent
  });
};

const UserActivity = mongoose.model('UserActivity', userActivitySchema);
const UserSuspension = mongoose.model('UserSuspension', userSuspensionSchema);
const UserVerification = mongoose.model('UserVerification', userVerificationSchema);
const AdminAction = mongoose.model('AdminAction', adminActionSchema);

module.exports = {
  UserActivity,
  UserSuspension,
  UserVerification,
  AdminAction
};
