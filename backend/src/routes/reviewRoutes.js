import express from 'express';
import { authenticate } from '../middleware/auth.js';
import { addReview, listReviewsForUser } from '../controllers/reviewController.js';

const router = express.Router();

router.use(authenticate);
router.post('/', addReview);
router.get('/user/:userId', listReviewsForUser);

export default router;