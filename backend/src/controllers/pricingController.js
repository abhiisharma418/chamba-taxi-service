import Joi from 'joi';
import { PricingConfig } from '../models/pricingModel.js';

const schema = Joi.object({ region: Joi.string().valid('hill', 'city').required(), vehicleType: Joi.string().valid('bike', 'car').required(), baseFare: Joi.number().required(), perKm: Joi.number().required(), perMinute: Joi.number().required(), surgeMultiplier: Joi.number().default(1), active: Joi.boolean().default(true) });

export const createPricing = async (req, res) => {
  const { error, value } = schema.validate(req.body);
  if (error) return res.status(400).json({ success: false, message: error.message });
  const created = await PricingConfig.create(value);
  res.status(201).json({ success: true, data: created });
};

export const listPricing = async (req, res) => {
  const list = await PricingConfig.find().sort({ createdAt: -1 });
  res.json({ success: true, data: list });
};

export const updatePricing = async (req, res) => {
  const { error, value } = schema.validate(req.body);
  if (error) return res.status(400).json({ success: false, message: error.message });
  const updated = await PricingConfig.findByIdAndUpdate(req.params.id, value, { new: true });
  if (!updated) return res.status(404).json({ success: false, message: 'Pricing not found' });
  res.json({ success: true, data: updated });
};

export const deletePricing = async (req, res) => {
  const deleted = await PricingConfig.findByIdAndDelete(req.params.id);
  if (!deleted) return res.status(404).json({ success: false, message: 'Pricing not found' });
  res.json({ success: true });
};