import express from 'express';
import { ChatController } from '../controllers/chatController.js';
import { authenticateToken } from '../middleware/auth.js';
import rateLimit from 'express-rate-limit';

const router = express.Router();

// Rate limiting for chat endpoints
const chatRateLimit = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 30, // 30 messages per minute
  message: {
    success: false,
    message: 'Too many messages sent. Please wait before sending another message.'
  },
  standardHeaders: true,
  legacyHeaders: false
});

// All chat routes require authentication
router.use(authenticateToken);

// Chat message routes
router.post('/send', chatRateLimit, ChatController.sendMessage);
router.get('/ride/:rideId', ChatController.getChatMessages);
router.post('/quick-reply', chatRateLimit, ChatController.sendQuickReply);
router.put('/ride/:rideId/read', ChatController.markAsRead);
router.get('/ride/:rideId/unread-count', ChatController.getUnreadCount);
router.post('/send-location', chatRateLimit, ChatController.sendLocation);

// Admin statistics (requires admin role)
router.get('/stats', (req, res, next) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({
      success: false,
      message: 'Admin access required'
    });
  }
  next();
}, ChatController.getChatStats);

export default router;
