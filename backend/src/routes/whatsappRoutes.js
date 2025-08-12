import express from 'express';
import { authenticate } from '../middleware/auth.js';
import {
  sendBookingConfirmation,
  sendDriverAssigned,
  sendRideStatusUpdate,
  sendDriverNotification,
  sendCustomMessage,
  webhookVerify,
  webhookReceive
} from '../controllers/whatsappController.js';

const router = express.Router();

// Webhook endpoints (no auth required)
router.get('/webhook', webhookVerify);
router.post('/webhook', webhookReceive);

// Authenticated endpoints
router.use(authenticate);

// Notification endpoints
router.post('/booking-confirmation', sendBookingConfirmation);
router.post('/driver-assigned', sendDriverAssigned);
router.post('/status-update', sendRideStatusUpdate);
router.post('/driver-notification', sendDriverNotification);
router.post('/custom-message', sendCustomMessage);

export default router;
