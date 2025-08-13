import express from 'express';
const router = express.Router();
import { body, param, query } from 'express-validator';
import auth from '../middleware/auth.js';
import rateLimit from '../middleware/rateLimit.js';
import scheduledRideController from '../controllers/scheduledRideController.js';

// Rate limiting for scheduled ride operations
const createScheduledRideLimit = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // Allow 10 scheduled rides per 15 minutes
  message: {
    success: false,
    message: 'Too many scheduled ride requests. Please try again later.'
  }
});

const updateScheduledRideLimit = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 20, // Allow 20 updates per 15 minutes
  message: {
    success: false,
    message: 'Too many update requests. Please try again later.'
  }
});

// Validation middleware
const createScheduledRideValidation = [
  body('vehicleType')
    .isIn(['car', 'bike', 'premium', 'xl'])
    .withMessage('Invalid vehicle type'),
  body('pickupLocation.address')
    .isString()
    .trim()
    .isLength({ min: 5, max: 255 })
    .withMessage('Pickup address is required and must be between 5-255 characters'),
  body('pickupLocation.coordinates.latitude')
    .isFloat({ min: -90, max: 90 })
    .withMessage('Invalid pickup latitude'),
  body('pickupLocation.coordinates.longitude')
    .isFloat({ min: -180, max: 180 })
    .withMessage('Invalid pickup longitude'),
  body('destinationLocation.address')
    .isString()
    .trim()
    .isLength({ min: 5, max: 255 })
    .withMessage('Destination address is required and must be between 5-255 characters'),
  body('destinationLocation.coordinates.latitude')
    .isFloat({ min: -90, max: 90 })
    .withMessage('Invalid destination latitude'),
  body('destinationLocation.coordinates.longitude')
    .isFloat({ min: -180, max: 180 })
    .withMessage('Invalid destination longitude'),
  body('scheduledDateTime')
    .isISO8601()
    .toDate()
    .withMessage('Invalid scheduled date time'),
  body('recurrence.type')
    .optional()
    .isIn(['none', 'daily', 'weekly', 'monthly'])
    .withMessage('Invalid recurrence type'),
  body('recurrence.endDate')
    .optional()
    .isISO8601()
    .toDate()
    .withMessage('Invalid recurrence end date'),
  body('recurrence.frequency')
    .optional()
    .isInt({ min: 1, max: 12 })
    .withMessage('Recurrence frequency must be between 1-12'),
  body('paymentMethod.type')
    .isIn(['cash', 'card', 'wallet', 'cod'])
    .withMessage('Invalid payment method'),
  body('paymentMethod.cardId')
    .optional()
    .isString()
    .withMessage('Invalid card ID'),
  body('priority')
    .optional()
    .isIn(['normal', 'high', 'urgent'])
    .withMessage('Invalid priority level'),
  body('passengerCount')
    .optional()
    .isInt({ min: 1, max: 8 })
    .withMessage('Passenger count must be between 1-8'),
  body('customerNotes')
    .optional()
    .isString()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Customer notes must be less than 500 characters'),
  body('specialRequests')
    .optional()
    .isArray()
    .withMessage('Special requests must be an array'),
  body('specialRequests.*.type')
    .optional()
    .isIn(['child_seat', 'wheelchair_accessible', 'pet_friendly', 'extra_luggage', 'quiet_ride', 'music_preference'])
    .withMessage('Invalid special request type')
];

const updateScheduledRideValidation = [
  body('vehicleType')
    .optional()
    .isIn(['car', 'bike', 'premium', 'xl'])
    .withMessage('Invalid vehicle type'),
  body('scheduledDateTime')
    .optional()
    .isISO8601()
    .toDate()
    .withMessage('Invalid scheduled date time'),
  body('passengerCount')
    .optional()
    .isInt({ min: 1, max: 8 })
    .withMessage('Passenger count must be between 1-8'),
  body('customerNotes')
    .optional()
    .isString()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Customer notes must be less than 500 characters'),
  body('priority')
    .optional()
    .isIn(['normal', 'high', 'urgent'])
    .withMessage('Invalid priority level')
];

// Routes

// Create a new scheduled ride
router.post('/',
  auth,
  createScheduledRideLimit,
  createScheduledRideValidation,
  scheduledRideController.createScheduledRide
);

// Get user's scheduled rides
router.get('/',
  auth,
  query('status')
    .optional()
    .isIn(['scheduled', 'confirmed', 'driver_assigned', 'started', 'completed', 'cancelled', 'failed', 'all'])
    .withMessage('Invalid status filter'),
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Page must be a positive integer'),
  query('limit')
    .optional()
    .isInt({ min: 1, max: 50 })
    .withMessage('Limit must be between 1 and 50'),
  query('upcoming')
    .optional()
    .isBoolean()
    .withMessage('Upcoming must be a boolean'),
  scheduledRideController.getScheduledRides
);

// Get specific scheduled ride details
router.get('/:rideId',
  auth,
  param('rideId')
    .isAlphanumeric()
    .withMessage('Invalid ride ID format'),
  scheduledRideController.getScheduledRide
);

// Update a scheduled ride
router.put('/:rideId',
  auth,
  updateScheduledRideLimit,
  param('rideId')
    .isAlphanumeric()
    .withMessage('Invalid ride ID format'),
  updateScheduledRideValidation,
  scheduledRideController.updateScheduledRide
);

// Cancel a scheduled ride
router.delete('/:rideId',
  auth,
  param('rideId')
    .isAlphanumeric()
    .withMessage('Invalid ride ID format'),
  body('reason')
    .optional()
    .isString()
    .trim()
    .isLength({ max: 255 })
    .withMessage('Cancellation reason must be less than 255 characters'),
  scheduledRideController.cancelScheduledRide
);

// Admin/Driver routes

// Assign driver to scheduled ride
router.patch('/:rideId/assign',
  auth,
  param('rideId')
    .isAlphanumeric()
    .withMessage('Invalid ride ID format'),
  body('driverId')
    .isMongoId()
    .withMessage('Invalid driver ID'),
  scheduledRideController.assignDriver
);

// Execute a scheduled ride (convert to actual booking)
router.post('/:rideId/execute',
  auth,
  param('rideId')
    .isAlphanumeric()
    .withMessage('Invalid ride ID format'),
  scheduledRideController.executeScheduledRide
);

// Get driver's schedule
router.get('/driver/schedule',
  auth,
  query('date')
    .optional()
    .isISO8601()
    .toDate()
    .withMessage('Invalid date format'),
  query('week')
    .optional()
    .isISO8601()
    .toDate()
    .withMessage('Invalid week start date'),
  query('month')
    .optional()
    .isISO8601()
    .toDate()
    .withMessage('Invalid month start date'),
  scheduledRideController.getDriverSchedule
);

// Admin routes for managing scheduled rides
router.get('/admin/pending',
  auth,
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Page must be a positive integer'),
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Limit must be between 1 and 100'),
  query('priority')
    .optional()
    .isIn(['normal', 'high', 'urgent', 'all'])
    .withMessage('Invalid priority filter'),
  async (req, res) => {
    try {
      const { page = 1, limit = 20, priority } = req.query;
      const query = {
        status: { $in: ['scheduled', 'confirmed'] },
        scheduledDateTime: { $gte: new Date() }
      };

      if (priority && priority !== 'all') {
        query.priority = priority;
      }

      const ScheduledRide = require('../models/scheduledRideModel');
      const rides = await ScheduledRide.find(query)
        .populate('customerId', 'name phoneNumber email')
        .populate('driverId', 'name phoneNumber')
        .sort({ scheduledDateTime: 1, priority: -1 })
        .limit(limit * 1)
        .skip((page - 1) * limit);

      const total = await ScheduledRide.countDocuments(query);

      res.json({
        success: true,
        data: {
          rides,
          pagination: {
            currentPage: parseInt(page),
            totalPages: Math.ceil(total / limit),
            totalRides: total
          }
        }
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Failed to fetch pending scheduled rides'
      });
    }
  }
);

// Admin route to get scheduled ride statistics
router.get('/admin/stats',
  auth,
  query('timeframe')
    .optional()
    .isIn(['today', 'week', 'month', 'quarter'])
    .withMessage('Invalid timeframe'),
  async (req, res) => {
    try {
      const { timeframe = 'week' } = req.query;
      const now = new Date();
      let startDate;

      switch (timeframe) {
        case 'today':
          startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
          break;
        case 'week':
          startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
          break;
        case 'month':
          startDate = new Date(now.getFullYear(), now.getMonth(), 1);
          break;
        case 'quarter':
          startDate = new Date(now.getFullYear(), Math.floor(now.getMonth() / 3) * 3, 1);
          break;
      }

      const ScheduledRide = require('../models/scheduledRideModel');
      const stats = await ScheduledRide.aggregate([
        {
          $match: {
            createdAt: { $gte: startDate }
          }
        },
        {
          $group: {
            _id: null,
            total: { $sum: 1 },
            byStatus: {
              $push: '$status'
            },
            byVehicleType: {
              $push: '$vehicleType'
            },
            byPriority: {
              $push: '$priority'
            },
            totalRevenue: {
              $sum: '$fareEstimate.totalEstimate'
            },
            avgFare: {
              $avg: '$fareEstimate.totalEstimate'
            }
          }
        }
      ]);

      const statusCounts = {};
      const vehicleTypeCounts = {};
      const priorityCounts = {};

      if (stats[0]) {
        stats[0].byStatus.forEach(status => {
          statusCounts[status] = (statusCounts[status] || 0) + 1;
        });
        
        stats[0].byVehicleType.forEach(type => {
          vehicleTypeCounts[type] = (vehicleTypeCounts[type] || 0) + 1;
        });
        
        stats[0].byPriority.forEach(priority => {
          priorityCounts[priority] = (priorityCounts[priority] || 0) + 1;
        });
      }

      res.json({
        success: true,
        data: {
          total: stats[0]?.total || 0,
          totalRevenue: stats[0]?.totalRevenue || 0,
          avgFare: stats[0]?.avgFare || 0,
          byStatus: statusCounts,
          byVehicleType: vehicleTypeCounts,
          byPriority: priorityCounts,
          timeframe,
          period: { startDate, endDate: now }
        }
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Failed to fetch scheduled ride statistics'
      });
    }
  }
);

export default router;
