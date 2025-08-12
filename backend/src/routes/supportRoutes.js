import express from 'express';
import {
  getFAQs,
  recordFAQFeedback,
  getTickets,
  getTicket,
  createTicket,
  addMessage,
  closeTicket,
  getTicketStats,
  getFAQCategories,
  search
} from '../controllers/supportController.js';
import { authenticate } from '../middleware/auth.js';

const router = express.Router();

// All routes require authentication
router.use(authenticate);

// FAQ routes
router.get('/faqs', getFAQs);
router.get('/faqs/categories', getFAQCategories);
router.post('/faqs/:faqId/feedback', recordFAQFeedback);

// Ticket routes
router.get('/tickets', getTickets);
router.post('/tickets', createTicket);
router.get('/tickets/stats', getTicketStats);
router.get('/tickets/:ticketId', getTicket);
router.post('/tickets/:ticketId/messages', addMessage);
router.patch('/tickets/:ticketId/close', closeTicket);

// Search route
router.get('/search', search);

export default router;