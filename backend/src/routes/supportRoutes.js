const express = require('express');
const router = express.Router();
const {
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
} = require('../controllers/supportController');
const { authenticateToken } = require('../middleware/auth');

// All routes require authentication
router.use(authenticateToken);

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

module.exports = router;
