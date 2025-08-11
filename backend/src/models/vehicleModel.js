import mongoose from 'mongoose';

const vehicleSchema = new mongoose.Schema({
  ownerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  type: { type: String, enum: ['bike', 'car'], required: true },
  model: { type: String, required: true },
  plateNumber: { type: String, required: true },
  isAvailable: { type: Boolean, default: true },
  pricing: {
    baseFare: { type: Number, required: true },
    perKmHill: { type: Number, required: true },
    perKmCity: { type: Number, required: true },
    perMinute: { type: Number, required: true }
  }
}, { timestamps: true });

export const Vehicle = mongoose.model('Vehicle', vehicleSchema);