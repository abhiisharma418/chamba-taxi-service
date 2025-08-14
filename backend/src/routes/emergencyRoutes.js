import express from 'express';
const router = express.Router();
import { body, param, query } from 'express-validator';
// import rateLimit from '../middleware/rateLimit.js';
import emergencyController from '../controllers/emergencyController.js';
// import adminEmergencyController from '../controllers/adminEmergencyController.js';

// const sosRateLimit = rateLimit({
//   windowMs: 1 * 60 * 1000, // 1 minute
//   max: 5, // Allow 5 SOS triggers per minute per user
//   message: {
//     success: false,
//     message: 'Too many SOS requests. Please wait before triggering again.'
//   },
//   standardHeaders: true,
//   legacyHeaders: false
// });

const emergencyValidation = [
  body('incidentType')
    .isIn(['medical', 'accident', 'harassment', 'theft', 'other', 'panic', 'vehicle_breakdown'])
    .withMessage('Invalid incident type'),
  body('severity')
    .optional()
    .isIn(['low', 'medium', 'high', 'critical'])
    .withMessage('Invalid severity level'),
  body('location.latitude')
    .isFloat({ min: -90, max: 90 })
    .withMessage('Invalid latitude'),
  body('location.longitude')
    .isFloat({ min: -180, max: 180 })
    .withMessage('Invalid longitude'),
  body('location.address')
    .optional()
    .isString()
    .trim()
    .isLength({ max: 255 })
    .withMessage('Address must be less than 255 characters'),
  body('description')
    .optional()
    .isString()
    .trim()
    .isLength({ max: 1000 })
    .withMessage('Description must be less than 1000 characters'),
  body('rideId')
    .optional()
    .isMongoId()
    .withMessage('Invalid ride ID')
];

const contactValidation = [
  body('name')
    .isString()
    .trim()
    .isLength({ min: 1, max: 100 })
    .withMessage('Name is required and must be less than 100 characters'),
  body('phoneNumber')
    .matches(/^\+?[\d\s\-\(\)]+$/)
    .withMessage('Please enter a valid phone number'),
  body('relationship')
    .isIn(['family', 'friend', 'colleague', 'other'])
    .withMessage('Invalid relationship type'),
  body('isPrimary')
    .optional()
    .isBoolean()
    .withMessage('isPrimary must be a boolean')
];

router.post('/sos', 
  // auth, 
  // sosRateLimit, 
  emergencyValidation, 
  emergencyController.triggerSOS
);

router.get('/incident/:incidentId', 
  // auth,
  param('incidentId').isAlphanumeric().withMessage('Invalid incident ID'),
  emergencyController.getIncident
);

router.get('/incidents', 
  // auth,
  query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer'),
  query('limit').optional().isInt({ min: 1, max: 50 }).withMessage('Limit must be between 1 and 50'),
  query('status').optional().isIn(['active', 'resolved', 'false_alarm', 'escalated', 'all']).withMessage('Invalid status'),
  emergencyController.getUserIncidents
);

router.patch('/incident/:incidentId/status', 
  // auth,
  param('incidentId').isAlphanumeric().withMessage('Invalid incident ID'),
  body('status').isIn(['active', 'resolved', 'false_alarm', 'escalated']).withMessage('Invalid status'),
  body('resolution').optional().isString().trim().isLength({ max: 2000 }).withMessage('Resolution must be less than 2000 characters'),
  body('notes').optional().isString().trim().isLength({ max: 2000 }).withMessage('Notes must be less than 2000 characters'),
  emergencyController.updateIncidentStatus
);

router.get('/settings', 
  // auth, /
  emergencyController.getEmergencySettings
);

// router.put('/settings', 
//   // auth,
//   rateLimit({ windowMs: 15 * 60 * 1000, max: 10 }),
//   emergencyController.updateEmergencySettings
// );

// router.post('/contacts', 
//   // auth,
//   rateLimit({ windowMs: 15 * 60 * 1000, max: 20 }),
//   contactValidation,
//   emergencyController.addEmergencyContact
// );

router.delete('/contacts/:contactId', 
  // auth,
  param('contactId').isMongoId().withMessage('Invalid contact ID'),
  emergencyController.removeEmergencyContact
);

// router.post('/fake-call', 
//   // auth,
//   rateLimit({ windowMs: 5 * 60 * 1000, max: 3 }),
//   body('contactName').optional().isString().trim().isLength({ max: 50 }).withMessage('Contact name must be less than 50 characters'),
//   body('duration').optional().isInt({ min: 30, max: 300 }).withMessage('Duration must be between 30 and 300 seconds'),
//   emergencyController.triggerFakeCall
// );

router.get('/stats',
  // auth,
  query('timeframe').optional().isIn(['7d', '30d', '90d']).withMessage('Invalid timeframe'),
  emergencyController.getEmergencyStats
);

// Admin routes
router.get('/admin/incidents',
  // auth,
  query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer'),
  query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100'),
  query('status').optional().isIn(['active', 'resolved', 'false_alarm', 'escalated', 'all']).withMessage('Invalid status'),
  query('severity').optional().isIn(['low', 'medium', 'high', 'critical', 'all']).withMessage('Invalid severity'),
  query('userType').optional().isIn(['customer', 'driver', 'all']).withMessage('Invalid user type'),
  query('timeframe').optional().isIn(['7d', '30d', '90d', '365d']).withMessage('Invalid timeframe'),
  // adminEmergencyController.getAllIncidents
);

router.get('/admin/incident/:incidentId',
  // auth,
  param('incidentId').isAlphanumeric().withMessage('Invalid incident ID'),
  // adminEmergencyController.getIncidentDetails
);

router.patch('/admin/incident/:incidentId/assign',
  // auth,
  param('incidentId').isAlphanumeric().withMessage('Invalid incident ID'),
  body('operatorId').isMongoId().withMessage('Invalid operator ID'),
  body('notes').optional().isString().trim().isLength({ max: 2000 }).withMessage('Notes must be less than 2000 characters'),
  // adminEmergencyController.assignOperator
);

router.patch('/admin/incident/:incidentId',
  // auth,
  param('incidentId').isAlphanumeric().withMessage('Invalid incident ID'),
  body('status').optional().isIn(['active', 'resolved', 'false_alarm', 'escalated']).withMessage('Invalid status'),
  body('severity').optional().isIn(['low', 'medium', 'high', 'critical']).withMessage('Invalid severity'),
  body('resolution').optional().isString().trim().isLength({ max: 2000 }).withMessage('Resolution must be less than 2000 characters'),
  body('notes').optional().isString().trim().isLength({ max: 2000 }).withMessage('Notes must be less than 2000 characters'),
  // adminEmergencyController.updateIncident
);

router.get('/admin/statistics',
  // auth,
  query('timeframe').optional().isIn(['7d', '30d', '90d', '365d']).withMessage('Invalid timeframe'),
  // adminEmergencyController.getEmergencyStatistics
);

router.get('/admin/user/:userId/settings',
  // auth,
  param('userId').isMongoId().withMessage('Invalid user ID'),
  // adminEmergencyController.getUserEmergencySettings
);

router.get('/admin/recent-alerts',
  // auth,
  query('limit').optional().isInt({ min: 1, max: 50 }).withMessage('Limit must be between 1 and 50'),
  // adminEmergencyController.getRecentAlerts
);

router.get('/admin/export',
  // auth,
  query('format').optional().isIn(['csv', 'json']).withMessage('Invalid export format'),
  query('timeframe').optional().isIn(['7d', '30d', '90d']).withMessage('Invalid timeframe'),
  // adminEmergencyController.exportIncidents
);

export default router;
