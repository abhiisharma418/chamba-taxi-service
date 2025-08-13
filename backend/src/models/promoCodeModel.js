import mongoose from 'mongoose';

const promoCodeSchema = new mongoose.Schema({
  code: {
    type: String,
    required: true,
    unique: true,
    uppercase: true,
    trim: true,
    minlength: 3,
    maxlength: 20,
    index: true
  },
  name: {
    type: String,
    required: true,
    maxlength: 100
  },
  description: {
    type: String,
    maxlength: 500
  },
  type: {
    type: String,
    enum: ['percentage', 'fixed_amount', 'free_ride'],
    required: true
  },
  value: {
    type: Number,
    required: true,
    min: 0
  },
  // For percentage discounts, maximum discount amount
  maxDiscountAmount: {
    type: Number,
    min: 0
  },
  // Minimum order amount to apply promo
  minOrderAmount: {
    type: Number,
    default: 0,
    min: 0
  },
  // Maximum order amount to apply promo
  maxOrderAmount: {
    type: Number
  },
  // Validity period
  validFrom: {
    type: Date,
    required: true
  },
  validUntil: {
    type: Date,
    required: true
  },
  // Usage limits
  totalUsageLimit: {
    type: Number,
    min: 1
  },
  usagePerUserLimit: {
    type: Number,
    default: 1,
    min: 1
  },
  currentUsageCount: {
    type: Number,
    default: 0,
    min: 0
  },
  // Target users
  applicableUserTypes: [{
    type: String,
    enum: ['new_user', 'existing_user', 'premium_user', 'all']
  }],
  // Target cities/zones
  applicableCities: [String],
  applicableZones: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Zone'
  }],
  // Target vehicle types
  applicableVehicleTypes: [{
    type: String,
    enum: ['auto', 'bike', 'car', 'premium']
  }],
  // Days and time restrictions
  applicableDays: [{
    type: String,
    enum: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday']
  }],
  applicableTimeSlots: [{
    startTime: String, // Format: "HH:MM"
    endTime: String    // Format: "HH:MM"
  }],
  // Status and visibility
  status: {
    type: String,
    enum: ['active', 'inactive', 'expired', 'suspended'],
    default: 'active'
  },
  isVisible: {
    type: Boolean,
    default: true
  },
  // Special conditions
  isFirstRideOnly: {
    type: Boolean,
    default: false
  },
  isReferralCode: {
    type: Boolean,
    default: false
  },
  referralReward: {
    referrerReward: {
      type: Number,
      default: 0
    },
    refereeReward: {
      type: Number,
      default: 0
    }
  },
  // Campaign information
  campaignName: String,
  campaignType: {
    type: String,
    enum: ['seasonal', 'launch', 'retention', 'acquisition', 'loyalty', 'partnership']
  },
  // Usage tracking
  usageHistory: [{
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    rideId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Ride'
    },
    discountAmount: {
      type: Number,
      required: true
    },
    originalAmount: {
      type: Number,
      required: true
    },
    finalAmount: {
      type: Number,
      required: true
    },
    usedAt: {
      type: Date,
      default: Date.now
    },
    ip: String,
    userAgent: String
  }],
  // Admin tracking
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'AdminUser',
    required: true
  },
  modifiedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'AdminUser'
  },
  // Analytics
  analytics: {
    totalUsage: {
      type: Number,
      default: 0
    },
    uniqueUsers: {
      type: Number,
      default: 0
    },
    totalDiscountGiven: {
      type: Number,
      default: 0
    },
    conversionRate: {
      type: Number,
      default: 0
    },
    avgOrderValue: {
      type: Number,
      default: 0
    }
  }
}, {
  timestamps: true
});

// Indexes for performance
promoCodeSchema.index({ code: 1 });
promoCodeSchema.index({ status: 1, validFrom: 1, validUntil: 1 });
promoCodeSchema.index({ 'usageHistory.userId': 1 });
promoCodeSchema.index({ campaignType: 1, createdAt: -1 });

// Virtual for checking if promo is currently valid
promoCodeSchema.virtual('isCurrentlyValid').get(function() {
  const now = new Date();
  return this.status === 'active' && 
         this.validFrom <= now && 
         this.validUntil >= now &&
         (!this.totalUsageLimit || this.currentUsageCount < this.totalUsageLimit);
});

// Virtual for usage percentage
promoCodeSchema.virtual('usagePercentage').get(function() {
  if (!this.totalUsageLimit) return 0;
  return (this.currentUsageCount / this.totalUsageLimit) * 100;
});

// Method to check if user can use this promo
promoCodeSchema.methods.canUserUse = function(userId, userType = 'existing_user', isFirstRide = false) {
  // Check if promo is valid
  if (!this.isCurrentlyValid) return { valid: false, reason: 'Promo code is not currently valid' };
  
  // Check user type eligibility
  if (this.applicableUserTypes.length > 0 && 
      !this.applicableUserTypes.includes('all') && 
      !this.applicableUserTypes.includes(userType)) {
    return { valid: false, reason: 'This promo is not applicable for your user type' };
  }
  
  // Check first ride restriction
  if (this.isFirstRideOnly && !isFirstRide) {
    return { valid: false, reason: 'This promo is only valid for first rides' };
  }
  
  // Check user usage limit
  const userUsageCount = this.usageHistory.filter(usage => 
    usage.userId.toString() === userId.toString()
  ).length;
  
  if (userUsageCount >= this.usagePerUserLimit) {
    return { valid: false, reason: 'You have already used this promo code the maximum number of times' };
  }
  
  return { valid: true };
};

// Method to calculate discount
promoCodeSchema.methods.calculateDiscount = function(orderAmount, vehicleType = null, city = null) {
  // Check minimum order amount
  if (orderAmount < this.minOrderAmount) {
    return { 
      valid: false, 
      reason: `Minimum order amount is ₹${this.minOrderAmount}`,
      discount: 0 
    };
  }
  
  // Check maximum order amount
  if (this.maxOrderAmount && orderAmount > this.maxOrderAmount) {
    return { 
      valid: false, 
      reason: `Maximum order amount is ₹${this.maxOrderAmount}`,
      discount: 0 
    };
  }
  
  // Check vehicle type eligibility
  if (this.applicableVehicleTypes.length > 0 && 
      vehicleType && 
      !this.applicableVehicleTypes.includes(vehicleType)) {
    return { 
      valid: false, 
      reason: 'This promo is not applicable for the selected vehicle type',
      discount: 0 
    };
  }
  
  // Check city eligibility
  if (this.applicableCities.length > 0 && 
      city && 
      !this.applicableCities.includes(city)) {
    return { 
      valid: false, 
      reason: 'This promo is not applicable in your city',
      discount: 0 
    };
  }
  
  let discount = 0;
  let finalAmount = orderAmount;
  
  if (this.type === 'percentage') {
    discount = (orderAmount * this.value) / 100;
    // Apply max discount limit if specified
    if (this.maxDiscountAmount && discount > this.maxDiscountAmount) {
      discount = this.maxDiscountAmount;
    }
  } else if (this.type === 'fixed_amount') {
    discount = Math.min(this.value, orderAmount); // Don't exceed order amount
  } else if (this.type === 'free_ride') {
    discount = orderAmount; // Full ride is free
  }
  
  finalAmount = Math.max(0, orderAmount - discount);
  
  return {
    valid: true,
    discount: Math.round(discount),
    finalAmount: Math.round(finalAmount),
    originalAmount: orderAmount,
    savings: Math.round(discount)
  };
};

// Method to record usage
promoCodeSchema.methods.recordUsage = async function(userId, rideId, discountAmount, originalAmount, finalAmount, metadata = {}) {
  this.usageHistory.push({
    userId,
    rideId,
    discountAmount,
    originalAmount,
    finalAmount,
    ip: metadata.ip,
    userAgent: metadata.userAgent
  });
  
  this.currentUsageCount += 1;
  this.analytics.totalUsage += 1;
  this.analytics.totalDiscountGiven += discountAmount;
  
  // Update unique users count
  const uniqueUserIds = [...new Set(this.usageHistory.map(usage => usage.userId.toString()))];
  this.analytics.uniqueUsers = uniqueUserIds.length;
  
  // Update average order value
  if (this.usageHistory.length > 0) {
    const totalOriginalAmount = this.usageHistory.reduce((sum, usage) => sum + usage.originalAmount, 0);
    this.analytics.avgOrderValue = totalOriginalAmount / this.usageHistory.length;
  }
  
  return this.save();
};

// Static method to find applicable promos for a user
promoCodeSchema.statics.findApplicablePromos = function(criteria = {}) {
  const {
    userType = 'existing_user',
    city,
    vehicleType,
    orderAmount,
    isFirstRide = false
  } = criteria;
  
  const now = new Date();
  const currentDay = now.toLocaleLowerCase().slice(0, 3) + 
                    now.toLocaleLowerCase().slice(0, 1).toUpperCase() + 
                    now.toLocaleLowerCase().slice(1);
  
  return this.find({
    status: 'active',
    isVisible: true,
    validFrom: { $lte: now },
    validUntil: { $gte: now },
    $or: [
      { totalUsageLimit: { $exists: false } },
      { $expr: { $lt: ['$currentUsageCount', '$totalUsageLimit'] } }
    ],
    $or: [
      { applicableUserTypes: { $size: 0 } },
      { applicableUserTypes: 'all' },
      { applicableUserTypes: userType }
    ],
    ...(city && { 
      $or: [
        { applicableCities: { $size: 0 } },
        { applicableCities: city }
      ]
    }),
    ...(vehicleType && {
      $or: [
        { applicableVehicleTypes: { $size: 0 } },
        { applicableVehicleTypes: vehicleType }
      ]
    }),
    ...(orderAmount && {
      minOrderAmount: { $lte: orderAmount },
      $or: [
        { maxOrderAmount: { $exists: false } },
        { maxOrderAmount: { $gte: orderAmount } }
      ]
    }),
    ...(isFirstRide === false && { isFirstRideOnly: false })
  }).sort({ value: -1, createdAt: -1 });
};

export const PromoCode = mongoose.model('PromoCode', promoCodeSchema);
