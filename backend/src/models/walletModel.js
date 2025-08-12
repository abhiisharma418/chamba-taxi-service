import mongoose from 'mongoose';

const walletTransactionSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  type: {
    type: String,
    required: true,
    enum: ['credit', 'debit'],
    index: true
  },
  amount: {
    type: Number,
    required: true,
    min: 0
  },
  description: {
    type: String,
    required: true,
    maxlength: 500
  },
  referenceId: {
    type: String,
    index: true
  },
  category: {
    type: String,
    enum: [
      'ride_payment',
      'ride_refund', 
      'wallet_topup',
      'driver_earning',
      'commission_deduction',
      'cashback',
      'bonus',
      'penalty',
      'transfer_in',
      'transfer_out',
      'withdrawal',
      'adjustment',
      'other'
    ],
    default: 'other'
  },
  status: {
    type: String,
    enum: ['pending', 'processing', 'completed', 'failed', 'cancelled'],
    default: 'completed',
    index: true
  },
  
  // Balance tracking
  balanceBefore: {
    type: Number,
    required: true,
    min: 0
  },
  balanceAfter: {
    type: Number,
    required: true,
    min: 0
  },
  
  // Payment provider information (if applicable)
  paymentProvider: {
    type: String,
    enum: ['razorpay', 'stripe', 'upi', 'bank_transfer', 'cash', 'internal']
  },
  providerTransactionId: String,
  
  // Metadata
  metadata: {
    source: {
      type: String,
      enum: ['web', 'mobile_app', 'admin', 'system', 'api'],
      default: 'web'
    },
    ip: String,
    userAgent: String,
    location: {
      latitude: Number,
      longitude: Number
    },
    deviceId: String,
    
    // For transfers
    fromUserId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    toUserId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    transferType: {
      type: String,
      enum: ['incoming', 'outgoing']
    },
    
    // For ride-related transactions
    rideId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Ride'
    },
    
    // For refunds
    isRefund: {
      type: Boolean,
      default: false
    },
    refundReason: String,
    originalTransactionId: String,
    
    // For admin adjustments
    adminId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    adminNote: String,
    
    // Additional data
    extra: mongoose.Schema.Types.Mixed
  },
  
  // Timing
  processedAt: {
    type: Date,
    default: Date.now
  },
  failedAt: Date,
  cancelledAt: Date,
  
  // Fee information
  processingFee: {
    type: Number,
    default: 0,
    min: 0
  },
  
  // Reconciliation
  reconciled: {
    type: Boolean,
    default: false
  },
  reconciledAt: Date,
  
  // Dispute handling
  disputed: {
    type: Boolean,
    default: false
  },
  disputeReason: String,
  disputeResolvedAt: Date
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes for better performance
walletTransactionSchema.index({ userId: 1, createdAt: -1 });
walletTransactionSchema.index({ userId: 1, type: 1 });
walletTransactionSchema.index({ referenceId: 1 });
walletTransactionSchema.index({ status: 1 });
walletTransactionSchema.index({ category: 1, createdAt: -1 });
walletTransactionSchema.index({ 'metadata.rideId': 1 });
walletTransactionSchema.index({ providerTransactionId: 1 });

// Virtual for display amount (with sign)
walletTransactionSchema.virtual('displayAmount').get(function() {
  return this.type === 'credit' ? this.amount : -this.amount;
});

// Virtual for formatted amount
walletTransactionSchema.virtual('formattedAmount').get(function() {
  const sign = this.type === 'credit' ? '+' : '-';
  return `${sign}₹${this.amount.toFixed(2)}`;
});

// Instance methods
walletTransactionSchema.methods.markAsCompleted = function() {
  this.status = 'completed';
  this.processedAt = new Date();
  return this.save();
};

walletTransactionSchema.methods.markAsFailed = function(reason) {
  this.status = 'failed';
  this.failedAt = new Date();
  this.metadata.failureReason = reason;
  return this.save();
};

walletTransactionSchema.methods.markAsCancelled = function(reason) {
  this.status = 'cancelled';
  this.cancelledAt = new Date();
  this.metadata.cancellationReason = reason;
  return this.save();
};

walletTransactionSchema.methods.addDispute = function(reason) {
  this.disputed = true;
  this.disputeReason = reason;
  return this.save();
};

walletTransactionSchema.methods.resolveDispute = function() {
  this.disputed = false;
  this.disputeResolvedAt = new Date();
  return this.save();
};

// Static methods
walletTransactionSchema.statics.getUserBalance = async function(userId) {
  const result = await this.aggregate([
    { $match: { userId: new mongoose.Types.ObjectId(userId), status: 'completed' } },
    {
      $group: {
        _id: null,
        balance: {
          $sum: {
            $cond: [
              { $eq: ['$type', 'credit'] },
              '$amount',
              { $multiply: ['$amount', -1] }
            ]
          }
        }
      }
    }
  ]);
  
  return result.length > 0 ? Math.max(0, result[0].balance) : 0;
};

walletTransactionSchema.statics.getTransactionSummary = function(userId, startDate, endDate) {
  return this.aggregate([
    {
      $match: {
        userId: new mongoose.Types.ObjectId(userId),
        status: 'completed',
        createdAt: { $gte: startDate, $lte: endDate }
      }
    },
    {
      $group: {
        _id: {
          type: '$type',
          category: '$category'
        },
        count: { $sum: 1 },
        totalAmount: { $sum: '$amount' },
        avgAmount: { $avg: '$amount' }
      }
    },
    {
      $group: {
        _id: '$_id.type',
        categories: {
          $push: {
            category: '$_id.category',
            count: '$count',
            totalAmount: '$totalAmount',
            avgAmount: '$avgAmount'
          }
        },
        totalCount: { $sum: '$count' },
        totalAmount: { $sum: '$totalAmount' }
      }
    }
  ]);
};

walletTransactionSchema.statics.getTopupHistory = function(userId, limit = 10) {
  return this.find({
    userId,
    type: 'credit',
    category: 'wallet_topup',
    status: 'completed'
  })
  .sort({ createdAt: -1 })
  .limit(limit)
  .select('amount createdAt paymentProvider providerTransactionId');
};

walletTransactionSchema.statics.getRideTransactions = function(rideId) {
  return this.find({
    'metadata.rideId': rideId,
    status: 'completed'
  })
  .populate('userId', 'name email role')
  .sort({ createdAt: 1 });
};

walletTransactionSchema.statics.getPendingTransactions = function() {
  return this.find({
    status: { $in: ['pending', 'processing'] }
  })
  .populate('userId', 'name email phone')
  .sort({ createdAt: 1 });
};

walletTransactionSchema.statics.getDisputedTransactions = function() {
  return this.find({
    disputed: true,
    disputeResolvedAt: { $exists: false }
  })
  .populate('userId', 'name email phone')
  .sort({ createdAt: -1 });
};

// Pre-save middleware
walletTransactionSchema.pre('save', function(next) {
  // Validate balance consistency
  if (this.type === 'debit' && this.balanceBefore < this.amount) {
    return next(new Error('Insufficient balance for debit transaction'));
  }
  
  // Set balanceAfter if not provided
  if (!this.balanceAfter) {
    if (this.type === 'credit') {
      this.balanceAfter = this.balanceBefore + this.amount;
    } else {
      this.balanceAfter = this.balanceBefore - this.amount;
    }
  }
  
  // Set category based on description if not provided
  if (!this.category || this.category === 'other') {
    this.category = this.inferCategory();
  }
  
  next();
});

// Method to infer category from description
walletTransactionSchema.methods.inferCategory = function() {
  const desc = this.description.toLowerCase();
  
  if (desc.includes('ride') && desc.includes('payment')) return 'ride_payment';
  if (desc.includes('ride') && desc.includes('refund')) return 'ride_refund';
  if (desc.includes('topup') || desc.includes('add money')) return 'wallet_topup';
  if (desc.includes('earning')) return 'driver_earning';
  if (desc.includes('commission')) return 'commission_deduction';
  if (desc.includes('cashback')) return 'cashback';
  if (desc.includes('bonus')) return 'bonus';
  if (desc.includes('penalty')) return 'penalty';
  if (desc.includes('transfer')) {
    return this.type === 'credit' ? 'transfer_in' : 'transfer_out';
  }
  if (desc.includes('withdrawal')) return 'withdrawal';
  if (desc.includes('adjustment')) return 'adjustment';
  
  return 'other';
};

export const WalletTransaction = mongoose.model('WalletTransaction', walletTransactionSchema);
