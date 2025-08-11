import Joi from 'joi';
import { Device } from '../models/deviceModel.js';

export const registerDevice = async (req, res) => {
  const schema = Joi.object({ platform: Joi.string().valid('web', 'android', 'ios').required(), token: Joi.string().required() });
  const { error, value } = schema.validate(req.body);
  if (error) return res.status(400).json({ success: false, message: error.message });
  const dev = await Device.findOneAndUpdate({ userId: req.user.id, token: value.token }, { platform: value.platform }, { upsert: true, new: true });
  res.status(201).json({ success: true, data: dev });
};

export const unregisterDevice = async (req, res) => {
  const schema = Joi.object({ token: Joi.string().required() });
  const { error, value } = schema.validate(req.body);
  if (error) return res.status(400).json({ success: false, message: error.message });
  await Device.findOneAndDelete({ userId: req.user.id, token: value.token });
  res.json({ success: true });
};