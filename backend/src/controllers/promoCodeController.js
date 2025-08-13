import { PromoCode } from '../models/promoCodeModel.js';
import { User } from '../models/userModel.js';
import { Ride } from '../models/rideModel.js';
import notificationService from '../services/notificationService.js';

export class PromoCodeController {
  // Create a new promo code (Admin only)
  static async createPromoCode(req, res) {
    try {
      const {
        code,
        name,
        description,
        type,
        value,
        maxDiscountAmount,
        minOrderAmount,
        maxOrderAmount,
        validFrom,
        validUntil,
        totalUsageLimit,
        usagePerUserLimit,
        applicableUserTypes,
        applicableCities,
        applicableVehicleTypes,
        applicableDays,
        applicableTimeSlots,
        isFirstRideOnly,
        isReferralCode,
        referralReward,
        campaignName,
        campaignType,
        isVisible
      } = req.body;

      const adminId = req.user.id;

      // Validate required fields
      if (!code || !name || !type || value === undefined || !validFrom || !validUntil) {
        return res.status(400).json({
          success: false,
          message: 'Missing required fields'
        });
      }

      // Validate date range
      if (new Date(validFrom) >= new Date(validUntil)) {
        return res.status(400).json({
          success: false,
          message: 'Valid from date must be before valid until date'
        });
      }

      // Check if promo code already exists
      const existingPromo = await PromoCode.findOne({ code: code.toUpperCase() });
      if (existingPromo) {
        return res.status(409).json({
          success: false,
          message: 'Promo code already exists'
        });
      }

      // Create promo code
      const promoCode = new PromoCode({
        code: code.toUpperCase(),
        name,
        description,
        type,
        value,
        maxDiscountAmount,
        minOrderAmount: minOrderAmount || 0,
        maxOrderAmount,
        validFrom: new Date(validFrom),
        validUntil: new Date(validUntil),
        totalUsageLimit,
        usagePerUserLimit: usagePerUserLimit || 1,
        applicableUserTypes: applicableUserTypes || [],
        applicableCities: applicableCities || [],
        applicableVehicleTypes: applicableVehicleTypes || [],
        applicableDays: applicableDays || [],
        applicableTimeSlots: applicableTimeSlots || [],
        isFirstRideOnly: isFirstRideOnly || false,
        isReferralCode: isReferralCode || false,
        referralReward: referralReward || {},
        campaignName,
        campaignType,
        isVisible: isVisible !== false,
        createdBy: adminId
      });

      await promoCode.save();

      res.status(201).json({
        success: true,
        data: promoCode,
        message: 'Promo code created successfully'
      });

    } catch (error) {
      console.error('Error creating promo code:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to create promo code',
        error: error.message
      });
    }
  }

  // Get all promo codes (Admin only)
  static async getAllPromoCodes(req, res) {
    try {
      const {
        page = 1,
        limit = 20,
        status,
        type,
        campaignType,
        search,
        sortBy = 'createdAt',
        sortOrder = 'desc'
      } = req.query;

      const filter = {};
      if (status) filter.status = status;
      if (type) filter.type = type;
      if (campaignType) filter.campaignType = campaignType;

      if (search) {
        filter.$or = [
          { code: { $regex: search, $options: 'i' } },
          { name: { $regex: search, $options: 'i' } },
          { description: { $regex: search, $options: 'i' } }
        ];
      }

      const skip = (page - 1) * limit;
      const sort = { [sortBy]: sortOrder === 'desc' ? -1 : 1 };

      const [promoCodes, totalCodes] = await Promise.all([
        PromoCode.find(filter)
          .populate('createdBy', 'name email')
          .populate('modifiedBy', 'name email')
          .sort(sort)
          .skip(skip)
          .limit(parseInt(limit))
          .lean(),
        PromoCode.countDocuments(filter)
      ]);

      res.json({
        success: true,
        data: {
          promoCodes,
          pagination: {
            page: parseInt(page),
            limit: parseInt(limit),
            total: totalCodes,
            pages: Math.ceil(totalCodes / limit)
          }
        }
      });

    } catch (error) {
      console.error('Error fetching promo codes:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch promo codes',
        error: error.message
      });
    }
  }

  // Get single promo code details (Admin only)
  static async getPromoCodeById(req, res) {
    try {
      const { id } = req.params;

      const promoCode = await PromoCode.findById(id)
        .populate('createdBy', 'name email')
        .populate('modifiedBy', 'name email')
        .populate('usageHistory.userId', 'name email phone')
        .lean();

      if (!promoCode) {
        return res.status(404).json({
          success: false,
          message: 'Promo code not found'
        });
      }

      res.json({
        success: true,
        data: promoCode
      });

    } catch (error) {
      console.error('Error fetching promo code:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch promo code',
        error: error.message
      });
    }
  }

  // Update promo code (Admin only)
  static async updatePromoCode(req, res) {
    try {
      const { id } = req.params;
      const updateData = req.body;
      const adminId = req.user.id;

      const promoCode = await PromoCode.findById(id);
      if (!promoCode) {
        return res.status(404).json({
          success: false,
          message: 'Promo code not found'
        });
      }

      // Don't allow changing certain fields if promo has been used
      if (promoCode.currentUsageCount > 0) {
        const restrictedFields = ['code', 'type', 'value'];
        const hasRestrictedChanges = restrictedFields.some(field => 
          updateData[field] !== undefined && updateData[field] !== promoCode[field]
        );
        
        if (hasRestrictedChanges) {
          return res.status(400).json({
            success: false,
            message: 'Cannot modify core promo details after it has been used'
          });
        }
      }

      // Update fields
      Object.keys(updateData).forEach(key => {
        if (updateData[key] !== undefined) {
          promoCode[key] = updateData[key];
        }
      });

      promoCode.modifiedBy = adminId;
      await promoCode.save();

      res.json({
        success: true,
        data: promoCode,
        message: 'Promo code updated successfully'
      });

    } catch (error) {
      console.error('Error updating promo code:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to update promo code',
        error: error.message
      });
    }
  }

  // Delete promo code (Admin only)
  static async deletePromoCode(req, res) {
    try {
      const { id } = req.params;

      const promoCode = await PromoCode.findById(id);
      if (!promoCode) {
        return res.status(404).json({
          success: false,
          message: 'Promo code not found'
        });
      }

      // Don't allow deletion if promo has been used
      if (promoCode.currentUsageCount > 0) {
        return res.status(400).json({
          success: false,
          message: 'Cannot delete promo code that has been used. Consider deactivating it instead.'
        });
      }

      await PromoCode.findByIdAndDelete(id);

      res.json({
        success: true,
        message: 'Promo code deleted successfully'
      });

    } catch (error) {
      console.error('Error deleting promo code:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to delete promo code',
        error: error.message
      });
    }
  }

  // Validate promo code for user
  static async validatePromoCode(req, res) {
    try {
      const { code, orderAmount, vehicleType, city } = req.body;
      const userId = req.user.id;

      if (!code) {
        return res.status(400).json({
          success: false,
          message: 'Promo code is required'
        });
      }

      const promoCode = await PromoCode.findOne({ 
        code: code.toUpperCase(),
        status: 'active'
      });

      if (!promoCode) {
        return res.status(404).json({
          success: false,
          message: 'Invalid promo code'
        });
      }

      // Get user details
      const user = await User.findById(userId);
      const userRideCount = await Ride.countDocuments({ 
        customerId: userId, 
        status: 'completed' 
      });
      
      const userType = userRideCount === 0 ? 'new_user' : 'existing_user';
      const isFirstRide = userRideCount === 0;

      // Check if user can use this promo
      const canUse = promoCode.canUserUse(userId, userType, isFirstRide);
      if (!canUse.valid) {
        return res.status(400).json({
          success: false,
          message: canUse.reason
        });
      }

      // Calculate discount
      const discountResult = promoCode.calculateDiscount(orderAmount, vehicleType, city);
      
      if (!discountResult.valid) {
        return res.status(400).json({
          success: false,
          message: discountResult.reason
        });
      }

      res.json({
        success: true,
        data: {
          promoCode: {
            id: promoCode._id,
            code: promoCode.code,
            name: promoCode.name,
            description: promoCode.description,
            type: promoCode.type
          },
          discount: discountResult
        },
        message: 'Promo code is valid'
      });

    } catch (error) {
      console.error('Error validating promo code:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to validate promo code',
        error: error.message
      });
    }
  }

  // Apply promo code to a ride
  static async applyPromoCode(req, res) {
    try {
      const { rideId, promoCodeId } = req.body;
      const userId = req.user.id;

      // Get ride and promo code
      const [ride, promoCode] = await Promise.all([
        Ride.findById(rideId),
        PromoCode.findById(promoCodeId)
      ]);

      if (!ride) {
        return res.status(404).json({
          success: false,
          message: 'Ride not found'
        });
      }

      if (!promoCode) {
        return res.status(404).json({
          success: false,
          message: 'Promo code not found'
        });
      }

      // Verify user owns the ride
      if (ride.customerId.toString() !== userId) {
        return res.status(403).json({
          success: false,
          message: 'Unauthorized to apply promo to this ride'
        });
      }

      // Check if ride already has a promo applied
      if (ride.promoCode) {
        return res.status(400).json({
          success: false,
          message: 'A promo code has already been applied to this ride'
        });
      }

      // Validate promo code again
      const user = await User.findById(userId);
      const userRideCount = await Ride.countDocuments({ 
        customerId: userId, 
        status: 'completed' 
      });
      
      const userType = userRideCount === 0 ? 'new_user' : 'existing_user';
      const isFirstRide = userRideCount === 0;

      const canUse = promoCode.canUserUse(userId, userType, isFirstRide);
      if (!canUse.valid) {
        return res.status(400).json({
          success: false,
          message: canUse.reason
        });
      }

      // Calculate discount
      const discountResult = promoCode.calculateDiscount(
        ride.fare.estimated, 
        ride.vehicleType, 
        ride.pickup.city
      );

      if (!discountResult.valid) {
        return res.status(400).json({
          success: false,
          message: discountResult.reason
        });
      }

      // Apply promo to ride
      ride.promoCode = {
        id: promoCode._id,
        code: promoCode.code,
        discountAmount: discountResult.discount,
        originalAmount: discountResult.originalAmount,
        finalAmount: discountResult.finalAmount
      };

      ride.fare.discount = discountResult.discount;
      ride.fare.final = discountResult.finalAmount;

      await ride.save();

      // Record promo usage
      await promoCode.recordUsage(
        userId,
        rideId,
        discountResult.discount,
        discountResult.originalAmount,
        discountResult.finalAmount,
        {
          ip: req.ip,
          userAgent: req.get('User-Agent')
        }
      );

      res.json({
        success: true,
        data: {
          ride: ride,
          discount: discountResult
        },
        message: 'Promo code applied successfully'
      });

    } catch (error) {
      console.error('Error applying promo code:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to apply promo code',
        error: error.message
      });
    }
  }

  // Get available promo codes for user
  static async getAvailablePromoCodes(req, res) {
    try {
      const { orderAmount, vehicleType, city } = req.query;
      const userId = req.user.id;

      // Get user details
      const userRideCount = await Ride.countDocuments({ 
        customerId: userId, 
        status: 'completed' 
      });
      
      const userType = userRideCount === 0 ? 'new_user' : 'existing_user';
      const isFirstRide = userRideCount === 0;

      // Find applicable promo codes
      const promoCodes = await PromoCode.findApplicablePromos({
        userType,
        city,
        vehicleType,
        orderAmount: orderAmount ? parseFloat(orderAmount) : undefined,
        isFirstRide
      });

      // Filter by user-specific restrictions and calculate potential discounts
      const availablePromos = [];
      
      for (const promo of promoCodes) {
        const canUse = promo.canUserUse(userId, userType, isFirstRide);
        if (canUse.valid) {
          let discount = null;
          if (orderAmount) {
            const discountResult = promo.calculateDiscount(
              parseFloat(orderAmount), 
              vehicleType, 
              city
            );
            if (discountResult.valid) {
              discount = discountResult;
            }
          }

          availablePromos.push({
            id: promo._id,
            code: promo.code,
            name: promo.name,
            description: promo.description,
            type: promo.type,
            value: promo.value,
            maxDiscountAmount: promo.maxDiscountAmount,
            minOrderAmount: promo.minOrderAmount,
            validUntil: promo.validUntil,
            isFirstRideOnly: promo.isFirstRideOnly,
            discount
          });
        }
      }

      res.json({
        success: true,
        data: {
          promoCodes: availablePromos,
          userType,
          isFirstRide
        }
      });

    } catch (error) {
      console.error('Error fetching available promo codes:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch available promo codes',
        error: error.message
      });
    }
  }

  // Get promo code analytics (Admin only)
  static async getPromoCodeAnalytics(req, res) {
    try {
      const { period = '30d', campaignType } = req.query;

      let startDate = new Date();
      if (period === '7d') {
        startDate.setDate(startDate.getDate() - 7);
      } else if (period === '30d') {
        startDate.setDate(startDate.getDate() - 30);
      } else if (period === '90d') {
        startDate.setDate(startDate.getDate() - 90);
      }

      const filter = {
        createdAt: { $gte: startDate }
      };

      if (campaignType) {
        filter.campaignType = campaignType;
      }

      const [
        totalPromoCodes,
        activePromoCodes,
        totalUsage,
        totalDiscountGiven,
        topPromoCodes,
        usageByType,
        usageByDay
      ] = await Promise.all([
        PromoCode.countDocuments(filter),
        PromoCode.countDocuments({ ...filter, status: 'active' }),
        PromoCode.aggregate([
          { $match: filter },
          { $group: { _id: null, total: { $sum: '$analytics.totalUsage' } } }
        ]),
        PromoCode.aggregate([
          { $match: filter },
          { $group: { _id: null, total: { $sum: '$analytics.totalDiscountGiven' } } }
        ]),
        PromoCode.find(filter)
          .sort({ 'analytics.totalUsage': -1 })
          .limit(10)
          .select('code name analytics'),
        PromoCode.aggregate([
          { $match: filter },
          { $group: { _id: '$type', count: { $sum: 1 }, usage: { $sum: '$analytics.totalUsage' } } }
        ]),
        PromoCode.aggregate([
          { $match: filter },
          { $unwind: '$usageHistory' },
          {
            $group: {
              _id: { $dateToString: { format: '%Y-%m-%d', date: '$usageHistory.usedAt' } },
              usage: { $sum: 1 },
              discount: { $sum: '$usageHistory.discountAmount' }
            }
          },
          { $sort: { _id: 1 } }
        ])
      ]);

      res.json({
        success: true,
        data: {
          overview: {
            totalPromoCodes,
            activePromoCodes,
            totalUsage: totalUsage[0]?.total || 0,
            totalDiscountGiven: totalDiscountGiven[0]?.total || 0
          },
          topPromoCodes,
          usageByType,
          usageByDay,
          period: {
            startDate,
            endDate: new Date()
          }
        }
      });

    } catch (error) {
      console.error('Error fetching promo code analytics:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch promo code analytics',
        error: error.message
      });
    }
  }

  // Bulk operations (Admin only)
  static async bulkUpdatePromoCodes(req, res) {
    try {
      const { promoCodeIds, action, data } = req.body;
      const adminId = req.user.id;

      if (!promoCodeIds || !Array.isArray(promoCodeIds) || promoCodeIds.length === 0) {
        return res.status(400).json({
          success: false,
          message: 'Invalid promo code IDs'
        });
      }

      let updateResult;

      switch (action) {
        case 'activate':
          updateResult = await PromoCode.updateMany(
            { _id: { $in: promoCodeIds } },
            { status: 'active', modifiedBy: adminId }
          );
          break;

        case 'deactivate':
          updateResult = await PromoCode.updateMany(
            { _id: { $in: promoCodeIds } },
            { status: 'inactive', modifiedBy: adminId }
          );
          break;

        case 'delete':
          // Only delete unused promo codes
          updateResult = await PromoCode.deleteMany({
            _id: { $in: promoCodeIds },
            currentUsageCount: 0
          });
          break;

        case 'update':
          if (!data) {
            return res.status(400).json({
              success: false,
              message: 'Update data is required'
            });
          }
          updateResult = await PromoCode.updateMany(
            { _id: { $in: promoCodeIds } },
            { ...data, modifiedBy: adminId }
          );
          break;

        default:
          return res.status(400).json({
            success: false,
            message: 'Invalid action'
          });
      }

      res.json({
        success: true,
        data: updateResult,
        message: `Bulk ${action} completed successfully`
      });

    } catch (error) {
      console.error('Error in bulk operation:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to perform bulk operation',
        error: error.message
      });
    }
  }
}
