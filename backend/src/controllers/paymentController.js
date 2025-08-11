import Razorpay from 'razorpay';
import Stripe from 'stripe';
import Joi from 'joi';

const stripe = process.env.STRIPE_SECRET ? new Stripe(process.env.STRIPE_SECRET) : null;
const razorpay = (process.env.RAZORPAY_KEY_ID && process.env.RAZORPAY_KEY_SECRET) ? new Razorpay({ key_id: process.env.RAZORPAY_KEY_ID, key_secret: process.env.RAZORPAY_KEY_SECRET }) : null;

export const createPaymentIntent = async (req, res) => {
  const schema = Joi.object({ provider: Joi.string().valid('razorpay', 'stripe').required(), amount: Joi.number().integer().min(100).required(), currency: Joi.string().default('INR') });
  const { error, value } = schema.validate(req.body);
  if (error) return res.status(400).json({ success: false, message: error.message });

  if (value.provider === 'stripe' && stripe) {
    const intent = await stripe.paymentIntents.create({ amount: value.amount, currency: value.currency });
    return res.json({ success: true, data: { clientSecret: intent.client_secret } });
  }
  if (value.provider === 'razorpay' && razorpay) {
    const order = await razorpay.orders.create({ amount: value.amount, currency: value.currency });
    return res.json({ success: true, data: order });
  }
  return res.status(400).json({ success: false, message: 'Payment provider not configured' });
};

export const refundPayment = async (req, res) => {
  const schema = Joi.object({ provider: Joi.string().valid('razorpay', 'stripe').required(), paymentId: Joi.string().required(), amount: Joi.number().integer().optional() });
  const { error, value } = schema.validate(req.body);
  if (error) return res.status(400).json({ success: false, message: error.message });

  if (value.provider === 'stripe' && stripe) {
    const refund = await stripe.refunds.create({ payment_intent: value.paymentId, amount: value.amount });
    return res.json({ success: true, data: refund });
  }
  if (value.provider === 'razorpay' && razorpay) {
    const refund = await razorpay.payments.refund(value.paymentId, { amount: value.amount });
    return res.json({ success: true, data: refund });
  }
  return res.status(400).json({ success: false, message: 'Payment provider not configured' });
};