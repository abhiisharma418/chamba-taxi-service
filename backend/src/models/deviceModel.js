import mongoose from 'mongoose';

const deviceSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  platform: { type: String, enum: ['web', 'android', 'ios'], required: true },
  token: { type: String, required: true },
}, { timestamps: true, indexes: [{ userId: 1, token: 1, unique: true }] });

export const Device = mongoose.model('Device', deviceSchema);