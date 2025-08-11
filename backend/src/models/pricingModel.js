import mongoose from 'mongoose';

const pricingConfigSchema = new mongoose.Schema({
  region: { type: String, enum: ['hill', 'city'], required: true },
  vehicleType: { type: String, enum: ['bike', 'car'], required: true },
  baseFare: Number,
  perKm: Number,
  perMinute: Number,
  surgeMultiplier: { type: Number, default: 1 },
  active: { type: Boolean, default: true }
}, { timestamps: true, indexes: [{ region: 1, vehicleType: 1 }] });

export const PricingConfig = mongoose.model('PricingConfig', pricingConfigSchema);