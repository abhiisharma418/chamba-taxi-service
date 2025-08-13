import express from 'express';
import { authenticate, requireRoles } from '../middleware/auth.js';
import {
  sendTestNotification,
  sendBulkNotification,
  sendNotificationByUserType,
  sendSystemNotification,
  sendPromotionalNotification,
  getNotificationStats,
  sendRideNotification,
  sendEmergencyAlert
} from '../controllers/notificationController.js';

const router = express.Router();

// Apply authentication to all routes
router.use(authenticate);

// Test notification (admin only)
router.post('/test', requireRoles('admin'), sendTestNotification);

// Bulk notifications (admin only)
router.post('/bulk', requireRoles('admin'), sendBulkNotification);

// Send to specific user type (admin only)
router.post('/user-type', requireRoles('admin'), sendNotificationByUserType);

// System-wide notifications (admin only)
router.post('/system', requireRoles('admin'), sendSystemNotification);

// Promotional notifications (admin only)
router.post('/promotional', requireRoles('admin'), sendPromotionalNotification);

// Get notification statistics (admin only)
router.get('/stats', requireRoles('admin'), getNotificationStats);

// Ride-specific notifications (admin and system)
router.post('/ride', requireRoles('admin'), sendRideNotification);

// Emergency alerts (admin and system)
router.post('/emergency', requireRoles('admin'), sendEmergencyAlert);

export default router;
