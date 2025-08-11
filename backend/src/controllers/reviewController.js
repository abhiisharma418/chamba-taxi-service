import Joi from 'joi';
import { Review } from '../models/reviewModel.js';

export const addReview = async (req, res) => {
  const schema = Joi.object({ rideId: Joi.string().required(), revieweeId: Joi.string().required(), rating: Joi.number().min(1).max(5).required(), comment: Joi.string().allow('') });
  const { error, value } = schema.validate(req.body);
  if (error) return res.status(400).json({ success: false, message: error.message });

  const existing = await Review.findOne({ rideId: value.rideId, reviewerId: req.user.id });
  if (existing) return res.status(409).json({ success: false, message: 'Already reviewed' });

  const review = await Review.create({ ...value, reviewerId: req.user.id });
  res.status(201).json({ success: true, data: review });
};

export const listReviewsForUser = async (req, res) => {
  const reviews = await Review.find({ revieweeId: req.params.userId }).sort({ createdAt: -1 });
  res.json({ success: true, data: reviews });
};