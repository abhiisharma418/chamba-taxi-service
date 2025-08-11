import mongoose from 'mongoose';

const reviewSchema = new mongoose.Schema({
  rideId: { type: mongoose.Schema.Types.ObjectId, ref: 'Ride', required: true },
  reviewerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  revieweeId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  rating: { type: Number, min: 1, max: 5, required: true },
  comment: { type: String, maxlength: 1000 },
}, { timestamps: true });

export const Review = mongoose.model('Review', reviewSchema);