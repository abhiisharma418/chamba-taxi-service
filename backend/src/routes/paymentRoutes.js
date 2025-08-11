import express from 'express';
import { authenticate } from '../middleware/auth.js';
import { createPaymentIntent, refundPayment, stripeWebhook, razorpayWebhook, getReceipt, authorizePayment, capturePayment } from '../controllers/paymentController.js';
import { idempotency } from '../middleware/idempotency.js';

const router = express.Router();

router.use('/webhook/stripe', express.raw({ type: 'application/json' }));
router.post('/webhook/stripe', stripeWebhook);
router.post('/webhook/razorpay', express.json(), razorpayWebhook);

router.use(authenticate);
router.get('/receipt/:id', getReceipt);
router.post('/intent', idempotency(), createPaymentIntent);
router.post('/authorize', idempotency(), authorizePayment);
router.post('/capture', idempotency(), capturePayment);
router.post('/refund', idempotency(), refundPayment);

export default router;