import Razorpay from 'razorpay';
import Stripe from 'stripe';
import Joi from 'joi';
import crypto from 'crypto';
import { Payment } from '../models/paymentModel.js';

const stripe = process.env.STRIPE_SECRET ? new Stripe(process.env.STRIPE_SECRET) : null;
const razorpay = (process.env.RAZORPAY_KEY_ID && process.env.RAZORPAY_KEY_SECRET) ? new Razorpay({ key_id: process.env.RAZORPAY_KEY_ID, key_secret: process.env.RAZORPAY_KEY_SECRET }) : null;

export const createPaymentIntent = async (req, res) => {
  const schema = Joi.object({ provider: Joi.string().valid('razorpay', 'stripe').required(), amount: Joi.number().integer().min(100).required(), currency: Joi.string().default('INR'), rideId: Joi.string().optional() });
  const { error, value } = schema.validate(req.body);
  if (error) return res.status(400).json({ success: false, message: error.message });

  if (value.provider === 'stripe' && stripe) {
    const intent = await stripe.paymentIntents.create({ amount: value.amount, currency: value.currency, metadata: { rideId: value.rideId || '' } });
    const payment = await Payment.create({ provider: 'stripe', amount: value.amount, currency: value.currency, rideId: value.rideId, providerRef: intent.id, status: 'created' });
    return res.json({ success: true, data: { clientSecret: intent.client_secret, paymentId: payment._id } });
  }
  if (value.provider === 'razorpay' && razorpay) {
    const order = await razorpay.orders.create({ amount: value.amount, currency: value.currency, notes: { rideId: value.rideId || '' } });
    const payment = await Payment.create({ provider: 'razorpay', amount: value.amount, currency: value.currency, rideId: value.rideId, providerRef: order.id, status: 'created', meta: order });
    return res.json({ success: true, data: { order, paymentId: payment._id } });
  }
  return res.status(400).json({ success: false, message: 'Payment provider not configured' });
};

export const refundPayment = async (req, res) => {
  const schema = Joi.object({ provider: Joi.string().valid('razorpay', 'stripe').required(), providerRef: Joi.string().required(), amount: Joi.number().integer().optional() });
  const { error, value } = schema.validate(req.body);
  if (error) return res.status(400).json({ success: false, message: error.message });

  const payment = await Payment.findOne({ provider: value.provider, providerRef: value.providerRef });
  if (!payment) return res.status(404).json({ success: false, message: 'Payment not found' });

  if (value.provider === 'stripe' && stripe) {
    const refund = await stripe.refunds.create({ payment_intent: value.providerRef, amount: value.amount });
    payment.status = 'refunded';
    await payment.save();
    return res.json({ success: true, data: refund });
  }
  if (value.provider === 'razorpay' && razorpay) {
    const refund = await razorpay.payments.refund(value.providerRef, { amount: value.amount });
    payment.status = 'refunded';
    await payment.save();
    return res.json({ success: true, data: refund });
  }
  return res.status(400).json({ success: false, message: 'Payment provider not configured' });
};

export const stripeWebhook = async (req, res) => {
  if (!stripe) return res.status(400).end();
  const sig = req.headers['stripe-signature'];
  let event;
  try {
    event = stripe.webhooks.constructEvent(req.rawBody, sig, process.env.STRIPE_WEBHOOK_SECRET);
  } catch (err) {
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }
  if (event.type === 'payment_intent.succeeded') {
    const intent = event.data.object;
    const payment = await Payment.findOne({ provider: 'stripe', providerRef: intent.id });
    if (payment && payment.status !== 'captured') {
      payment.status = 'captured';
      await payment.save();
    }
  }
  res.json({ received: true });
};

export const razorpayWebhook = async (req, res) => {
  const signature = req.headers['x-razorpay-signature'];
  const body = JSON.stringify(req.body);
  const expected = crypto.createHmac('sha256', process.env.RAZORPAY_KEY_SECRET || '').update(body).digest('hex');
  if (signature !== expected) return res.status(400).send('Invalid signature');

  if (req.body.event === 'payment.captured') {
    const payId = req.body.payload.payment.entity.id;
    const payment = await Payment.findOne({ provider: 'razorpay', providerRef: payId });
    if (payment && payment.status !== 'captured') {
      payment.status = 'captured';
      await payment.save();
    }
  }
  res.json({ received: true });
};