import mongoose from 'mongoose';

const paymentSchema = new mongoose.Schema({
  provider: { type: String, enum: ['stripe', 'razorpay'], required: true },
  amount: { type: Number, required: true }, // in smallest currency unit (paise)
  currency: { type: String, default: 'INR' },
  status: { type: String, enum: ['created', 'authorized', 'captured', 'refunded', 'failed'], default: 'created' },
  rideId: { type: mongoose.Schema.Types.ObjectId, ref: 'Ride' },
  providerRef: { type: String }, // paymentIntent id (stripe) or order/payment id (razorpay)
  meta: { type: Object },
}, { timestamps: true });

export const Payment = mongoose.model('Payment', paymentSchema);