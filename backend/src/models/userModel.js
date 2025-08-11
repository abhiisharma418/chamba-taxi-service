import mongoose from 'mongoose';
import bcrypt from 'bcrypt';

const userSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  email: { type: String, required: true, unique: true, lowercase: true, index: true },
  phone: { type: String, required: true },
  role: { type: String, enum: ['customer', 'driver', 'admin'], required: true },
  passwordHash: { type: String, required: true },
  isActive: { type: Boolean, default: true },
  locale: { type: String, default: 'en' },
  // Driver specific
  driver: {
    licenseNumber: String,
    vehicleId: { type: mongoose.Schema.Types.ObjectId, ref: 'Vehicle' },
    verificationStatus: { type: String, enum: ['pending', 'approved', 'rejected'], default: 'pending' },
    documents: [{ filename: String, url: String, uploadedAt: Date }]
  }
}, { timestamps: true });

userSchema.methods.comparePassword = async function(password) {
  return bcrypt.compare(password, this.passwordHash);
};

userSchema.statics.hashPassword = async function(password) {
  const saltRounds = 10;
  return bcrypt.hash(password, saltRounds);
};

export const User = mongoose.model('User', userSchema);