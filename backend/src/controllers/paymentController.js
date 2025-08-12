import Joi from 'joi';
import { Payment } from '../models/paymentModel.js';
import { User } from '../models/userModel.js';
import { Ride } from '../models/rideModel.js';
import { createRazorpayOrder, verifyRazorpayPayment } from '../services/razorpayService.js';
import { createStripePaymentIntent, confirmStripePayment } from '../services/stripeService.js';
import { processUPIPayment, verifyUPIPayment } from '../services/upiService.js';
import { deductFromWallet, addToWallet, getWalletBalance } from '../services/walletService.js';
import { transferToDriver } from '../services/payoutService.js';

const createIntentSchema = Joi.object({
  provider: Joi.string().valid('razorpay', 'stripe', 'upi', 'cod').required(),
  amount: Joi.number().positive().required(),
  currency: Joi.string().default('INR'),
  rideId: Joi.string().optional(),
  paymentMethod: Joi.string().optional(),
  upiId: Joi.string().when('provider', { is: 'upi', then: Joi.required() })
});

const verifyPaymentSchema = Joi.object({
  paymentId: Joi.string().required(),
  providerRef: Joi.string().required(),
  signature: Joi.string().optional()
});

export const createPaymentIntent = async (req, res) => {
  try {
    const { error, value } = createIntentSchema.validate(req.body);
    if (error) {
      return res.status(400).json({ 
        success: false, 
        message: error.details[0].message 
      });
    }

    const { provider, amount, currency, rideId, paymentMethod, upiId } = value;
    const userId = req.user.id;

    // Create payment record
    const payment = new Payment({
      userId,
      rideId,
      provider,
      amount,
      currency,
      status: 'pending',
      paymentMethod: paymentMethod || provider,
      metadata: {
        upiId: upiId || null,
        createdBy: userId,
        userAgent: req.get('User-Agent'),
        ip: req.ip
      }
    });

    await payment.save();

    let response = {};

    switch (provider) {
      case 'razorpay':
        response = await handleRazorpayIntent(payment, amount, currency);
        break;
      case 'stripe':
        response = await handleStripeIntent(payment, amount, currency);
        break;
      case 'upi':
        response = await handleUPIIntent(payment, amount, upiId);
        break;
      case 'cod':
        response = await handleCODIntent(payment);
        break;
      default:
        throw new Error('Unsupported payment provider');
    }

    // Update payment with provider data
    payment.providerData = response.providerData;
    await payment.save();

    res.json({
      success: true,
      data: {
        paymentId: payment._id,
        ...response
      }
    });

  } catch (error) {
    console.error('Payment intent creation error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create payment intent'
    });
  }
};

export const verifyPayment = async (req, res) => {
  try {
    const { error, value } = verifyPaymentSchema.validate(req.body);
    if (error) {
      return res.status(400).json({
        success: false,
        message: error.details[0].message
      });
    }

    const { paymentId, providerRef, signature } = value;

    const payment = await Payment.findById(paymentId);
    if (!payment) {
      return res.status(404).json({
        success: false,
        message: 'Payment not found'
      });
    }

    let isValid = false;
    let providerData = {};

    switch (payment.provider) {
      case 'razorpay':
        const razorpayResult = await verifyRazorpayPayment(providerRef, signature, payment.providerData.orderId);
        isValid = razorpayResult.isValid;
        providerData = razorpayResult.data;
        break;
      case 'stripe':
        const stripeResult = await confirmStripePayment(providerRef);
        isValid = stripeResult.isValid;
        providerData = stripeResult.data;
        break;
      case 'upi':
        const upiResult = await verifyUPIPayment(providerRef);
        isValid = upiResult.isValid;
        providerData = upiResult.data;
        break;
      default:
        throw new Error('Unsupported payment provider for verification');
    }

    if (isValid) {
      // Update payment status
      payment.status = 'completed';
      payment.providerRef = providerRef;
      payment.completedAt = new Date();
      payment.providerData = { ...payment.providerData, ...providerData };
      await payment.save();

      // Process driver payout (75% of amount)
      if (payment.rideId) {
        await processDriverPayout(payment);
      }

      res.json({
        success: true,
        data: {
          paymentId: payment._id,
          status: 'completed',
          amount: payment.amount,
          transactionId: providerRef
        }
      });
    } else {
      payment.status = 'failed';
      payment.failedAt = new Date();
      await payment.save();

      res.status(400).json({
        success: false,
        message: 'Payment verification failed'
      });
    }

  } catch (error) {
    console.error('Payment verification error:', error);
    res.status(500).json({
      success: false,
      message: 'Payment verification failed'
    });
  }
};

export const processWalletPayment = async (req, res) => {
  try {
    const schema = Joi.object({
      amount: Joi.number().positive().required(),
      rideId: Joi.string().optional(),
      description: Joi.string().default('Ride payment')
    });

    const { error, value } = schema.validate(req.body);
    if (error) {
      return res.status(400).json({
        success: false,
        message: error.details[0].message
      });
    }

    const { amount, rideId, description } = value;
    const userId = req.user.id;

    // Check wallet balance
    const balance = await getWalletBalance(userId);
    if (balance < amount) {
      return res.status(400).json({
        success: false,
        message: 'Insufficient wallet balance'
      });
    }

    // Deduct from wallet
    const walletResult = await deductFromWallet(userId, amount, description, rideId);
    
    if (walletResult.success) {
      // Create payment record
      const payment = new Payment({
        userId,
        rideId,
        provider: 'wallet',
        amount,
        currency: 'INR',
        status: 'completed',
        paymentMethod: 'wallet',
        providerRef: walletResult.transactionId,
        completedAt: new Date(),
        metadata: {
          walletBalanceBefore: balance,
          walletBalanceAfter: balance - amount
        }
      });

      await payment.save();

      // Process driver payout
      if (rideId) {
        await processDriverPayout(payment);
      }

      res.json({
        success: true,
        data: {
          paymentId: payment._id,
          transactionId: walletResult.transactionId,
          balanceAfter: balance - amount
        }
      });
    } else {
      res.status(400).json({
        success: false,
        message: 'Wallet payment failed'
      });
    }

  } catch (error) {
    console.error('Wallet payment error:', error);
    res.status(500).json({
      success: false,
      message: 'Wallet payment failed'
    });
  }
};

export const addMoneyToWallet = async (req, res) => {
  try {
    const schema = Joi.object({
      amount: Joi.number().positive().required(),
      paymentMethod: Joi.string().valid('razorpay', 'stripe', 'upi').required(),
      providerRef: Joi.string().required()
    });

    const { error, value } = schema.validate(req.body);
    if (error) {
      return res.status(400).json({
        success: false,
        message: error.details[0].message
      });
    }

    const { amount, paymentMethod, providerRef } = value;
    const userId = req.user.id;

    // Verify the payment with provider
    let isValid = false;
    switch (paymentMethod) {
      case 'razorpay':
        const razorpayResult = await verifyRazorpayPayment(providerRef);
        isValid = razorpayResult.isValid;
        break;
      case 'stripe':
        const stripeResult = await confirmStripePayment(providerRef);
        isValid = stripeResult.isValid;
        break;
      case 'upi':
        const upiResult = await verifyUPIPayment(providerRef);
        isValid = upiResult.isValid;
        break;
    }

    if (isValid) {
      const walletResult = await addToWallet(userId, amount, 'Money added to wallet', providerRef);
      
      if (walletResult.success) {
        res.json({
          success: true,
          data: {
            transactionId: walletResult.transactionId,
            newBalance: walletResult.newBalance
          }
        });
      } else {
        res.status(400).json({
          success: false,
          message: 'Failed to add money to wallet'
        });
      }
    } else {
      res.status(400).json({
        success: false,
        message: 'Payment verification failed'
      });
    }

  } catch (error) {
    console.error('Add money to wallet error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to add money to wallet'
    });
  }
};

export const getWalletInfo = async (req, res) => {
  try {
    const userId = req.user.id;
    const balance = await getWalletBalance(userId);
    
    res.json({
      success: true,
      data: {
        balance,
        currency: 'INR'
      }
    });

  } catch (error) {
    console.error('Get wallet info error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get wallet information'
    });
  }
};

export const getPaymentHistory = async (req, res) => {
  try {
    const userId = req.user.id;
    const { page = 1, limit = 20, status } = req.query;

    let query = { userId };
    if (status) {
      query.status = status;
    }

    const payments = await Payment.find(query)
      .populate('rideId', 'pickup.address destination.address status')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Payment.countDocuments(query);

    res.json({
      success: true,
      data: payments,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });

  } catch (error) {
    console.error('Get payment history error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get payment history'
    });
  }
};

export const processRefund = async (req, res) => {
  try {
    const schema = Joi.object({
      paymentId: Joi.string().required(),
      amount: Joi.number().positive().optional(),
      reason: Joi.string().required()
    });

    const { error, value } = schema.validate(req.body);
    if (error) {
      return res.status(400).json({
        success: false,
        message: error.details[0].message
      });
    }

    const { paymentId, amount, reason } = value;

    const payment = await Payment.findById(paymentId);
    if (!payment) {
      return res.status(404).json({
        success: false,
        message: 'Payment not found'
      });
    }

    // Authorization check
    if (payment.userId.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Not authorized'
      });
    }

    const refundAmount = amount || payment.amount;

    let refundResult = {};
    switch (payment.provider) {
      case 'wallet':
        // Refund to wallet
        refundResult = await addToWallet(payment.userId, refundAmount, `Refund: ${reason}`, paymentId);
        break;
      case 'razorpay':
        // Process Razorpay refund
        refundResult = await processRazorpayRefund(payment.providerRef, refundAmount);
        break;
      case 'stripe':
        // Process Stripe refund
        refundResult = await processStripeRefund(payment.providerRef, refundAmount);
        break;
      default:
        throw new Error('Refunds not supported for this payment method');
    }

    if (refundResult.success) {
      // Update payment record
      payment.status = 'refunded';
      payment.refundAmount = refundAmount;
      payment.refundReason = reason;
      payment.refundedAt = new Date();
      payment.refundRef = refundResult.refundId;
      await payment.save();

      res.json({
        success: true,
        data: {
          refundId: refundResult.refundId,
          amount: refundAmount,
          status: 'refunded'
        }
      });
    } else {
      res.status(400).json({
        success: false,
        message: 'Refund processing failed'
      });
    }

  } catch (error) {
    console.error('Refund processing error:', error);
    res.status(500).json({
      success: false,
      message: 'Refund processing failed'
    });
  }
};

// Helper functions
async function handleRazorpayIntent(payment, amount, currency) {
  const order = await createRazorpayOrder(amount, currency);
  return {
    orderId: order.id,
    keyId: process.env.RAZORPAY_KEY_ID,
    amount: order.amount,
    currency: order.currency,
    providerData: { orderId: order.id }
  };
}

async function handleStripeIntent(payment, amount, currency) {
  const paymentIntent = await createStripePaymentIntent(amount, currency);
  return {
    clientSecret: paymentIntent.client_secret,
    paymentIntentId: paymentIntent.id,
    providerData: { paymentIntentId: paymentIntent.id }
  };
}

async function handleUPIIntent(payment, amount, upiId) {
  const upiPayment = await processUPIPayment(amount, upiId);
  return {
    merchantUPI: process.env.MERCHANT_UPI_ID || 'merchant@paytm',
    amount,
    paymentId: payment._id,
    providerData: { upiTransactionId: upiPayment.transactionId }
  };
}

async function handleCODIntent(payment) {
  payment.status = 'pending';
  await payment.save();
  return {
    status: 'pending',
    message: 'Cash on delivery selected'
  };
}

async function processDriverPayout(payment) {
  try {
    const ride = await Ride.findById(payment.rideId).populate('driverId');
    if (ride && ride.driverId) {
      // Calculate driver earning (75% of total fare)
      const driverEarning = Math.round(payment.amount * 0.75);
      
      // Transfer to driver's wallet or bank account
      await transferToDriver(ride.driverId._id, driverEarning, {
        rideId: payment.rideId,
        paymentId: payment._id,
        totalFare: payment.amount,
        commissionRate: 0.25
      });
    }
  } catch (error) {
    console.error('Driver payout error:', error);
  }
}
