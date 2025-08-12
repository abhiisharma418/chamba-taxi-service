import express from 'express';
import { authenticate, requireRoles } from '../middleware/auth.js';
import { 
  createPaymentIntent,
  verifyPayment,
  processWalletPayment,
  addMoneyToWallet,
  getWalletInfo,
  getPaymentHistory,
  processRefund
} from '../controllers/paymentController.js';

const router = express.Router();

// Payment Intent Creation
router.post('/intent', authenticate, createPaymentIntent);

// Payment Verification
router.post('/verify', authenticate, verifyPayment);

// Wallet Operations
router.post('/wallet/pay', authenticate, processWalletPayment);
router.post('/wallet/add', authenticate, addMoneyToWallet);
router.get('/wallet/info', authenticate, getWalletInfo);

// Payment History
router.get('/history', authenticate, getPaymentHistory);

// Refund Processing (Admin or user for their own payments)
router.post('/refund', authenticate, processRefund);

// Admin Routes
router.get('/admin/stats', authenticate, requireRoles('admin'), async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    const start = startDate ? new Date(startDate) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const end = endDate ? new Date(endDate) : new Date();

    const { Payment } = await import('../models/paymentModel.js');
    
    const stats = await Payment.getPaymentStats(start, end);
    const revenue = await Payment.getRevenueStats(start, end);
    
    res.json({
      success: true,
      data: {
        paymentStats: stats,
        revenueStats: revenue,
        period: { startDate: start, endDate: end }
      }
    });
  } catch (error) {
    console.error('Payment stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get payment statistics'
    });
  }
});

router.get('/admin/pending-payouts', authenticate, requireRoles('admin'), async (req, res) => {
  try {
    const { Payment } = await import('../models/paymentModel.js');
    const pendingPayouts = await Payment.getPendingPayouts();
    
    res.json({
      success: true,
      data: pendingPayouts
    });
  } catch (error) {
    console.error('Pending payouts error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get pending payouts'
    });
  }
});

// Webhook Endpoints
router.post('/webhook/razorpay', express.raw({ type: 'application/json' }), async (req, res) => {
  try {
    const signature = req.get('X-Razorpay-Signature');
    const { verifyRazorpayWebhook } = await import('../services/razorpayService.js');
    
    if (!verifyRazorpayWebhook(req.body, signature)) {
      return res.status(400).json({ success: false, message: 'Invalid signature' });
    }

    const event = JSON.parse(req.body);
    console.log('Razorpay webhook received:', event.event);

    // Process webhook event
    await processRazorpayWebhook(event);
    
    res.json({ success: true });
  } catch (error) {
    console.error('Razorpay webhook error:', error);
    res.status(500).json({ success: false, message: 'Webhook processing failed' });
  }
});

router.post('/webhook/stripe', express.raw({ type: 'application/json' }), async (req, res) => {
  try {
    const signature = req.get('stripe-signature');
    // Process Stripe webhook
    // Implementation would go here
    
    res.json({ success: true });
  } catch (error) {
    console.error('Stripe webhook error:', error);
    res.status(500).json({ success: false, message: 'Webhook processing failed' });
  }
});

// Utility Routes
router.get('/methods', authenticate, async (req, res) => {
  try {
    const { getWalletBalance } = await import('../services/walletService.js');
    const walletBalance = await getWalletBalance(req.user.id);
    
    const paymentMethods = [
      {
        id: 'cod',
        name: 'Cash on Delivery',
        icon: 'dollar-sign',
        description: 'Pay to driver after ride completion',
        available: true,
        fees: 0
      },
      {
        id: 'upi',
        name: 'UPI Payment',
        icon: 'smartphone',
        description: 'Google Pay, PhonePe, Paytm & more',
        available: true,
        fees: 0
      },
      {
        id: 'wallet',
        name: 'RideWithUs Wallet',
        icon: 'wallet',
        description: `Balance: ₹${walletBalance}`,
        available: true,
        balance: walletBalance,
        fees: 0
      },
      {
        id: 'razorpay',
        name: 'Cards & NetBanking',
        icon: 'credit-card',
        description: 'Credit/Debit cards, Net banking, Wallets',
        available: true,
        fees: 0.02 // 2% fees
      },
      {
        id: 'stripe',
        name: 'International Cards',
        icon: 'credit-card',
        description: 'Visa, Mastercard, American Express',
        available: true,
        fees: 0.029 // 2.9% fees
      }
    ];
    
    res.json({
      success: true,
      data: paymentMethods
    });
  } catch (error) {
    console.error('Payment methods error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get payment methods'
    });
  }
});

// Helper function to process Razorpay webhooks
async function processRazorpayWebhook(event) {
  const { Payment } = await import('../models/paymentModel.js');
  
  switch (event.event) {
    case 'payment.captured':
      await handlePaymentCaptured(event.payload.payment.entity);
      break;
    case 'payment.failed':
      await handlePaymentFailed(event.payload.payment.entity);
      break;
    case 'refund.processed':
      await handleRefundProcessed(event.payload.refund.entity);
      break;
    case 'payout.processed':
      await handlePayoutProcessed(event.payload.payout.entity);
      break;
    default:
      console.log('Unhandled Razorpay webhook event:', event.event);
  }
}

async function handlePaymentCaptured(paymentData) {
  const { Payment } = await import('../models/paymentModel.js');
  
  const payment = await Payment.findOne({ providerRef: paymentData.id });
  if (payment) {
    await payment.markAsCompleted(paymentData.id, paymentData);
    console.log(`Payment ${payment._id} marked as completed via webhook`);
  }
}

async function handlePaymentFailed(paymentData) {
  const { Payment } = await import('../models/paymentModel.js');
  
  const payment = await Payment.findOne({ providerRef: paymentData.id });
  if (payment) {
    await payment.markAsFailed(paymentData.error_description);
    console.log(`Payment ${payment._id} marked as failed via webhook`);
  }
}

async function handleRefundProcessed(refundData) {
  const { Payment } = await import('../models/paymentModel.js');
  
  const payment = await Payment.findOne({ providerRef: refundData.payment_id });
  if (payment) {
    await payment.processRefund(refundData.amount / 100, 'Webhook refund');
    console.log(`Refund processed for payment ${payment._id} via webhook`);
  }
}

async function handlePayoutProcessed(payoutData) {
  const { Payment } = await import('../models/paymentModel.js');
  
  // Find payment by payout reference
  const payment = await Payment.findOne({ 'driverPayout.payoutRef': payoutData.id });
  if (payment) {
    await payment.updateDriverPayout('completed', payoutData.id);
    console.log(`Driver payout completed for payment ${payment._id} via webhook`);
  }
}

export default router;
