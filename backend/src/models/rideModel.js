import mongoose from 'mongoose';

const pointSchema = new mongoose.Schema({
  address: String,
  coordinates: { type: [Number], index: '2dsphere', required: true }, // [lng, lat]
});

const rideSchema = new mongoose.Schema({
  customerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  driverId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  vehicleId: { type: mongoose.Schema.Types.ObjectId, ref: 'Vehicle' },
  pickup: { type: pointSchema, required: true },
  destination: { type: pointSchema, required: true },
  status: { type: String, enum: ['requested', 'accepted', 'arriving', 'on-trip', 'completed', 'cancelled'], default: 'requested' },
  fare: {
    estimated: Number,
    actual: Number,
    currency: { type: String, default: 'INR' }
  },
  pricingContext: {
    regionType: { type: String, enum: ['hill', 'city'], required: true },
    surgeMultiplier: { type: Number, default: 1 }
  },
  paymentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Payment' },
  paymentStatus: { type: String, enum: ['none', 'created', 'authorized', 'captured', 'refunded', 'failed'], default: 'none' },
  startedAt: Date,
  completedAt: Date,
  ratingByCustomer: Number,
  ratingByDriver: Number,
  route: [{
    timestamp: Date,
    location: { type: [Number], index: '2dsphere' } // [lng, lat]
  }]
}, { timestamps: true });

export const Ride = mongoose.model('Ride', rideSchema);
