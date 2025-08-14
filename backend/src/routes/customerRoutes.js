import express from 'express';
import { getProfile } from '../controllers/customerController.js'; // ya jahan se bhi aapka getProfile aata hai
import { authenticate } from '../middleware/auth.js';

const router = express.Router();

router.get('/profile', authenticate, getProfile);

export default router;