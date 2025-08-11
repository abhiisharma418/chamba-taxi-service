import express from 'express';
import { authenticate } from '../middleware/auth.js';
import { createPaymentIntent, refundPayment } from '../controllers/paymentController.js';

const router = express.Router();

router.use(authenticate);
router.post('/intent', createPaymentIntent);
router.post('/refund', refundPayment);

export default router;