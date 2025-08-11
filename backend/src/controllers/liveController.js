import Joi from 'joi';
import { authenticate, requireRoles } from '../middleware/auth.js';
import { setDriverLocation, setDriverAvailability, getNearbyAvailableDrivers } from '../utils/liveStore.js';

export const driverHeartbeat = async (req, res) => {
  const schema = Joi.object({ lng: Joi.number().required(), lat: Joi.number().required() });
  const { error, value } = schema.validate(req.body);
  if (error) return res.status(400).json({ success: false, message: error.message });
  await setDriverLocation(req.user.id, value.lng, value.lat);
  res.json({ success: true });
};

export const driverSetAvailability = async (req, res) => {
  const schema = Joi.object({ available: Joi.boolean().required() });
  const { error, value } = schema.validate(req.body);
  if (error) return res.status(400).json({ success: false, message: error.message });
  await setDriverAvailability(req.user.id, value.available);
  res.json({ success: true });
};

export const dispatchNearestDriver = async (req, res) => {
  const schema = Joi.object({ pickup: Joi.object({ coordinates: Joi.array().items(Joi.number()).length(2).required() }).required(), radiusKm: Joi.number().default(10) });
  const { error, value } = schema.validate(req.body);
  if (error) return res.status(400).json({ success: false, message: error.message });
  const [lng, lat] = value.pickup.coordinates;
  const nearby = await getNearbyAvailableDrivers(lng, lat, value.radiusKm, 5);
  res.json({ success: true, data: nearby });
};