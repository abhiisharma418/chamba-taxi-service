import mongoose from 'mongoose';

const zoneSchema = new mongoose.Schema({
  name: { type: String, required: true },
  region: { type: String, enum: ['hill', 'city'], required: true },
  polygon: { type: Object, required: true }, // GeoJSON Polygon
  active: { type: Boolean, default: true },
}, { timestamps: true });

export const Zone = mongoose.model('Zone', zoneSchema);