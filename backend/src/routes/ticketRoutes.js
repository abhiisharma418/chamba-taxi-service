import express from 'express';
import { authenticate, requireRoles } from '../middleware/auth.js';
import { createTicket, listMyTickets, addMessage, adminListTickets, adminUpdateStatus } from '../controllers/ticketController.js';

const router = express.Router();

router.use(authenticate);
router.post('/', createTicket);
router.get('/mine', listMyTickets);
router.post('/:id/messages', addMessage);

router.get('/', requireRoles('admin'), adminListTickets);
router.patch('/:id/status', requireRoles('admin'), adminUpdateStatus);

export default router;