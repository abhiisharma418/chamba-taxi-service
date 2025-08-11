import express from 'express';
import { authenticate } from '../middleware/auth.js';
import { estimateFare, createRide, getRide, updateStatus, getHistory } from '../controllers/rideController.js';

const router = express.Router();

router.post('/estimate', authenticate, estimateFare);
router.post('/', authenticate, createRide);
router.get('/history', authenticate, getHistory);
router.get('/:id', authenticate, getRide);
router.patch('/:id/status', authenticate, updateStatus);

export default router;