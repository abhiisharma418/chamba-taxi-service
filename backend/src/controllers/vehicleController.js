import Joi from 'joi';
import { Vehicle } from '../models/vehicleModel.js';

const vehicleSchema = Joi.object({
  type: Joi.string().valid('bike', 'car').required(),
  model: Joi.string().required(),
  plateNumber: Joi.string().required(),
  pricing: Joi.object({
    baseFare: Joi.number().required(),
    perKmHill: Joi.number().required(),
    perKmCity: Joi.number().required(),
    perMinute: Joi.number().required(),
  }).required(),
});

export const createVehicle = async (req, res) => {
  const { error, value } = vehicleSchema.validate(req.body);
  if (error) return res.status(400).json({ success: false, message: error.message });
  const vehicle = await Vehicle.create({ ...value, ownerId: req.user.id });
  res.status(201).json({ success: true, data: vehicle });
};

export const listVehicles = async (req, res) => {
  const filter = req.user.role === 'driver' ? { ownerId: req.user.id } : {};
  const vehicles = await Vehicle.find(filter).sort({ createdAt: -1 });
  res.json({ success: true, data: vehicles });
};

export const updateVehicle = async (req, res) => {
  const { error, value } = vehicleSchema.fork(['plateNumber'], (s) => s.optional()).validate(req.body);
  if (error) return res.status(400).json({ success: false, message: error.message });
  const vehicle = await Vehicle.findOneAndUpdate({ _id: req.params.id, ownerId: req.user.id }, value, { new: true });
  if (!vehicle) return res.status(404).json({ success: false, message: 'Vehicle not found' });
  res.json({ success: true, data: vehicle });
};

export const setAvailability = async (req, res) => {
  const schema = Joi.object({ isAvailable: Joi.boolean().required() });
  const { error, value } = schema.validate(req.body);
  if (error) return res.status(400).json({ success: false, message: error.message });
  const vehicle = await Vehicle.findOneAndUpdate({ _id: req.params.id, ownerId: req.user.id }, { isAvailable: value.isAvailable }, { new: true });
  if (!vehicle) return res.status(404).json({ success: false, message: 'Vehicle not found' });
  res.json({ success: true, data: vehicle });
};