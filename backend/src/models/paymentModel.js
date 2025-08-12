import mongoose from 'mongoose';

const paymentSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  rideId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Ride',
    index: true
  },
  provider: {
    type: String,
    required: true,
    enum: ['razorpay', 'stripe', 'upi', 'wallet', 'cod'],
    index: true
  },
  amount: {
    type: Number,
    required: true,
    min: 0
  },
  currency: {
    type: String,
    default: 'INR',
    uppercase: true
  },
  status: {
    type: String,
    required: true,
    enum: ['pending', 'processing', 'completed', 'failed', 'cancelled', 'refunded'],
    default: 'pending',
    index: true
  },
  paymentMethod: {
    type: String,
    required: true
  },
  providerRef: {
    type: String,
    index: true
  },
  providerData: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  },
  
  // Timing information
  createdAt: {
    type: Date,
    default: Date.now,
    index: true
  },
  processingStartedAt: Date,
  completedAt: Date,
  failedAt: Date,
  cancelledAt: Date,
  
  // Refund information
  refundAmount: {
    type: Number,
    min: 0
  },
  refundReason: String,
  refundedAt: Date,
  refundRef: String,
  
  // Fee information
  processingFee: {
    type: Number,
    default: 0,
    min: 0
  },
  platformFee: {
    type: Number,
    default: 0,
    min: 0
  },
  
  // Driver payout information (75% of amount)
  driverPayout: {
    amount: {
      type: Number,
      min: 0
    },
    status: {
      type: String,
      enum: ['pending', 'processing', 'completed', 'failed'],
      default: 'pending'
    },
    payoutRef: String,
    processedAt: Date,
    driverId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }
  },
  
  // Metadata and tracking
  metadata: {
    ip: String,
    userAgent: String,
    deviceId: String,
    location: {
      latitude: Number,
      longitude: Number
    },
    failureReason: String,
    retryCount: {
      type: Number,
      default: 0
    },
    webhookReceived: {
      type: Boolean,
      default: false
    },
    webhookData: mongoose.Schema.Types.Mixed
  },
  
  // Dispute and chargeback information
  disputes: [{
    disputeId: String,
    reason: String,
    amount: Number,
    status: {
      type: String,
      enum: ['open', 'under_review', 'won', 'lost']
    },
    createdAt: {
      type: Date,
      default: Date.now
    },
    resolvedAt: Date
  }],
  
  // Reconciliation
  reconciled: {
    type: Boolean,
    default: false
  },
  reconciledAt: Date,
  settlementId: String
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes for better query performance
paymentSchema.index({ userId: 1, createdAt: -1 });
paymentSchema.index({ rideId: 1 });
paymentSchema.index({ provider: 1, status: 1 });
paymentSchema.index({ providerRef: 1 });
paymentSchema.index({ 'driverPayout.driverId': 1, 'driverPayout.status': 1 });
paymentSchema.index({ createdAt: -1 });

// Virtual for calculating company commission (25%)
paymentSchema.virtual('companyCommission').get(function() {
  return Math.round(this.amount * 0.25);
});

// Virtual for calculating driver earning (75%)
paymentSchema.virtual('driverEarning').get(function() {
  return Math.round(this.amount * 0.75);
});

// Virtual for net amount after fees
paymentSchema.virtual('netAmount').get(function() {
  return this.amount - (this.processingFee || 0) - (this.platformFee || 0);
});

// Instance methods
paymentSchema.methods.markAsCompleted = function(providerRef, providerData = {}) {
  this.status = 'completed';
  this.providerRef = providerRef;
  this.completedAt = new Date();
  this.providerData = { ...this.providerData, ...providerData };
  return this.save();
};

paymentSchema.methods.markAsFailed = function(reason) {
  this.status = 'failed';
  this.failedAt = new Date();
  this.metadata.failureReason = reason;
  return this.save();
};

paymentSchema.methods.processRefund = function(amount, reason) {
  this.status = 'refunded';
  this.refundAmount = amount || this.amount;
  this.refundReason = reason;
  this.refundedAt = new Date();
  return this.save();
};

paymentSchema.methods.updateDriverPayout = function(status, payoutRef = null) {
  this.driverPayout.status = status;
  if (payoutRef) {
    this.driverPayout.payoutRef = payoutRef;
  }
  if (status === 'completed') {
    this.driverPayout.processedAt = new Date();
  }
  return this.save();
};

// Static methods
paymentSchema.statics.getPaymentStats = function(startDate, endDate) {
  return this.aggregate([
    {
      $match: {
        createdAt: { $gte: startDate, $lte: endDate }
      }
    },
    {
      $group: {
        _id: {
          provider: '$provider',
          status: '$status'
        },
        count: { $sum: 1 },
        totalAmount: { $sum: '$amount' },
        avgAmount: { $avg: '$amount' }
      }
    },
    {
      $group: {
        _id: '$_id.provider',
        statuses: {
          $push: {
            status: '$_id.status',
            count: '$count',
            totalAmount: '$totalAmount',
            avgAmount: '$avgAmount'
          }
        },
        totalTransactions: { $sum: '$count' },
        totalVolume: { $sum: '$totalAmount' }
      }
    }
  ]);
};

paymentSchema.statics.getRevenueStats = function(startDate, endDate) {
  return this.aggregate([
    {
      $match: {
        status: 'completed',
        createdAt: { $gte: startDate, $lte: endDate }
      }
    },
    {
      $group: {
        _id: {
          $dateToString: { format: '%Y-%m-%d', date: '$createdAt' }
        },
        totalRevenue: { $sum: '$amount' },
        companyCommission: { $sum: { $multiply: ['$amount', 0.25] } },
        driverPayouts: { $sum: { $multiply: ['$amount', 0.75] } },
        transactionCount: { $sum: 1 },
        processingFees: { $sum: '$processingFee' }
      }
    },
    {
      $sort: { _id: 1 }
    }
  ]);
};

paymentSchema.statics.getPendingPayouts = function() {
  return this.find({
    status: 'completed',
    'driverPayout.status': 'pending'
  }).populate('driverPayout.driverId', 'name email phone');
};

// Pre-save middleware
paymentSchema.pre('save', function(next) {
  // Calculate driver payout if not set
  if (this.status === 'completed' && !this.driverPayout.amount) {
    this.driverPayout.amount = this.driverEarning;
  }
  
  // Update processing started time
  if (this.isModified('status') && this.status === 'processing' && !this.processingStartedAt) {
    this.processingStartedAt = new Date();
  }
  
  next();
});

// Post-save middleware
paymentSchema.post('save', function(doc) {
  // Emit events for status changes
  if (doc.isModified('status')) {
    // Here you could emit events for webhooks, notifications, etc.
    console.log(`Payment ${doc._id} status changed to ${doc.status}`);
  }
});

export const Payment = mongoose.model('Payment', paymentSchema);
