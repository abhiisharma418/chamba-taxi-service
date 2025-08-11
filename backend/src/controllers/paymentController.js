import Razorpay from 'razorpay';
import Stripe from 'stripe';
import Joi from 'joi';
import crypto from 'crypto';
import PDFDocument from 'pdfkit';
import { Payment } from '../models/paymentModel.js';
import { Ride } from '../models/rideModel.js';

const stripe = process.env.STRIPE_SECRET ? new Stripe(process.env.STRIPE_SECRET) : null;
const razorpay = (process.env.RAZORPAY_KEY_ID && process.env.RAZORPAY_KEY_SECRET) ? new Razorpay({ key_id: process.env.RAZORPAY_KEY_ID, key_secret: process.env.RAZORPAY_KEY_SECRET }) : null;

const setRideCompletedOnCapture = async (payment) => {
  if (!payment?.rideId) return;
  const ride = await Ride.findById(payment.rideId);
  if (!ride) return;
  ride.paymentStatus = 'captured';
  if (ride.status === 'on-trip') {
    ride.status = 'completed';
    ride.completedAt = new Date();
  }
  await ride.save();
};

export const createPaymentIntent = async (req, res) => {
  const schema = Joi.object({ provider: Joi.string().valid('razorpay', 'stripe').required(), amount: Joi.number().integer().min(100).required(), currency: Joi.string().default('INR'), rideId: Joi.string().optional(), captureMethod: Joi.string().valid('automatic','manual').default('automatic') });
  const { error, value } = schema.validate(req.body);
  if (error) return res.status(400).json({ success: false, message: error.message });

  if (value.provider === 'stripe' && stripe) {
    const params = { amount: value.amount, currency: value.currency, metadata: { rideId: value.rideId || '' } };
    if (value.captureMethod === 'manual') Object.assign(params, { capture_method: 'manual' } as any);
    const intent = await stripe.paymentIntents.create(params as any);
    const payment = await Payment.create({ provider: 'stripe', amount: value.amount, currency: value.currency, rideId: value.rideId, providerRef: intent.id, status: 'created' });
    if (value.rideId) await Ride.findByIdAndUpdate(value.rideId, { paymentId: payment._id, paymentStatus: 'created' });
    return res.json({ success: true, data: { clientSecret: intent.client_secret, paymentId: payment._id } });
  }
  if (value.provider === 'razorpay' && razorpay) {
    const order = await razorpay.orders.create({ amount: value.amount, currency: value.currency, notes: { rideId: value.rideId || '' } });
    const payment = await Payment.create({ provider: 'razorpay', amount: value.amount, currency: value.currency, rideId: value.rideId, providerRef: order.id, status: 'created', meta: order });
    if (value.rideId) await Ride.findByIdAndUpdate(value.rideId, { paymentId: payment._id, paymentStatus: 'created' });
    return res.json({ success: true, data: { order, paymentId: payment._id } });
  }
  return res.status(400).json({ success: false, message: 'Payment provider not configured' });
};

export const authorizePayment = async (req, res) => {
  const schema = Joi.object({ provider: Joi.string().valid('razorpay','stripe').required(), providerRef: Joi.string().required() });
  const { error, value } = schema.validate(req.body);
  if (error) return res.status(400).json({ success: false, message: error.message });
  const payment = await Payment.findOne({ provider: value.provider, providerRef: value.providerRef });
  if (!payment) return res.status(404).json({ success: false, message: 'Payment not found' });
  if (payment.status === 'authorized' || payment.status === 'captured') return res.json({ success: true, data: payment });
  payment.status = 'authorized';
  await payment.save();
  if (payment.rideId) await Ride.findByIdAndUpdate(payment.rideId, { paymentStatus: 'authorized' });
  res.json({ success: true, data: payment });
};

export const capturePayment = async (req, res) => {
  const schema = Joi.object({ provider: Joi.string().valid('razorpay','stripe').required(), providerRef: Joi.string().required(), amount: Joi.number().integer().optional(), currency: Joi.string().default('INR') });
  const { error, value } = schema.validate(req.body);
  if (error) return res.status(400).json({ success: false, message: error.message });
  const payment = await Payment.findOne({ provider: value.provider, providerRef: value.providerRef });
  if (!payment) return res.status(404).json({ success: false, message: 'Payment not found' });
  if (payment.status === 'captured') return res.json({ success: true, data: payment });

  if (value.provider === 'stripe' && stripe) {
    const intent = await stripe.paymentIntents.capture(value.providerRef as any);
    payment.status = 'captured';
    await payment.save();
    await setRideCompletedOnCapture(payment);
    return res.json({ success: true, data: intent });
  }
  if (value.provider === 'razorpay' && razorpay) {
    const amt = value.amount || payment.amount;
    const resp = await razorpay.payments.capture(value.providerRef, amt, value.currency);
    payment.status = 'captured';
    await payment.save();
    await setRideCompletedOnCapture(payment);
    return res.json({ success: true, data: resp });
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
    if (payment.rideId) await Ride.findByIdAndUpdate(payment.rideId, { paymentStatus: 'refunded' });
    return res.json({ success: true, data: refund });
  }
  if (value.provider === 'razorpay' && razorpay) {
    const refund = await razorpay.payments.refund(value.providerRef, { amount: value.amount });
    payment.status = 'refunded';
    await payment.save();
    if (payment.rideId) await Ride.findByIdAndUpdate(payment.rideId, { paymentStatus: 'refunded' });
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
      await setRideCompletedOnCapture(payment);
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
      await setRideCompletedOnCapture(payment);
    }
  }
  res.json({ received: true });
};

export const getReceipt = async (req, res) => {
  const payment = await Payment.findById(req.params.id);
  if (!payment) return res.status(404).json({ success: false, message: 'Not found' });
  const acceptsPdf = (req.headers['accept'] || '').includes('application/pdf') || req.path.endsWith('.pdf');
  if (!acceptsPdf) {
    return res.json({ success: true, data: {
      provider: payment.provider,
      amount: payment.amount,
      currency: payment.currency,
      status: payment.status,
      rideId: payment.rideId,
      providerRef: payment.providerRef,
      createdAt: payment.createdAt,
    }});
  }
  // Stream PDF
  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', `inline; filename=receipt-${payment._id}.pdf`);
  const doc = new PDFDocument({ size: 'A4', margin: 50 });
  doc.pipe(res);
  doc.fontSize(18).text('Payment Receipt', { align: 'center' }).moveDown();
  doc.fontSize(12).text(`Payment ID: ${payment._id}`);
  doc.text(`Provider: ${payment.provider}`);
  doc.text(`Provider Ref: ${payment.providerRef}`);
  doc.text(`Amount: ₹${(payment.amount/100).toFixed(2)} ${payment.currency}`);
  doc.text(`Status: ${payment.status}`);
  if (payment.rideId) doc.text(`Ride ID: ${payment.rideId}`);
  doc.text(`Date: ${new Date(payment.createdAt).toLocaleString()}`);
  doc.end();
};