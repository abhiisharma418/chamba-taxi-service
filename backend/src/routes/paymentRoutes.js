import express from 'express';
import { authenticate } from '../middleware/auth.js';
import { createPaymentIntent, refundPayment, stripeWebhook, razorpayWebhook } from '../controllers/paymentController.js';

const router = express.Router();

router.use('/webhook/stripe', express.raw({ type: 'application/json' }));
router.post('/webhook/stripe', stripeWebhook);
router.post('/webhook/razorpay', express.json(), razorpayWebhook);

router.use(authenticate);
router.post('/intent', createPaymentIntent);
router.post('/refund', refundPayment);

export default router;