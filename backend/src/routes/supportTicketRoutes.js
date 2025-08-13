import express from 'express';
import { SupportTicketController } from '../controllers/supportTicketController.js';
import { authenticateToken } from '../middleware/auth.js';
import rateLimit from 'express-rate-limit';

const router = express.Router();

// Rate limiting for ticket creation
const createTicketLimit = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // 5 tickets per 15 minutes
  message: {
    success: false,
    message: 'Too many tickets created. Please wait before creating another ticket.'
  },
  standardHeaders: true,
  legacyHeaders: false
});

// Rate limiting for messages
const messageLimit = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 10, // 10 messages per minute
  message: {
    success: false,
    message: 'Too many messages sent. Please wait before sending another message.'
  },
  standardHeaders: true,
  legacyHeaders: false
});

// All support ticket routes require authentication
router.use(authenticateToken);

// User routes
router.post('/create', createTicketLimit, SupportTicketController.createTicket);
router.get('/my-tickets', SupportTicketController.getUserTickets);
router.get('/ticket/:ticketId', SupportTicketController.getTicketById);
router.post('/ticket/:ticketId/message', messageLimit, SupportTicketController.addMessage);
router.post('/ticket/:ticketId/feedback', SupportTicketController.submitFeedback);

// Admin routes (require admin role)
const requireAdmin = (req, res, next) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({
      success: false,
      message: 'Admin access required'
    });
  }
  next();
};

router.get('/admin/all', requireAdmin, SupportTicketController.getAllTickets);
router.put('/admin/ticket/:ticketId/status', requireAdmin, SupportTicketController.updateTicketStatus);
router.get('/admin/stats', requireAdmin, SupportTicketController.getSupportStats);

export default router;
