import Joi from 'joi';
import { Ride } from '../models/rideModel.js';
import { Vehicle } from '../models/vehicleModel.js';
import { notifyRide, notifyUser } from '../services/notifyService.js';
import { sendRideNotification } from '../controllers/whatsappController.js';

const createRideSchema = Joi.object({
  pickup: Joi.object({ address: Joi.string().allow(''), coordinates: Joi.array().items(Joi.number()).length(2).required() }).required(),
  destination: Joi.object({ address: Joi.string().allow(''), coordinates: Joi.array().items(Joi.number()).length(2).required() }).required(),
  vehicleType: Joi.string().valid('bike', 'car').required(),
  regionType: Joi.string().valid('hill', 'city').required(),
});

export const estimateFare = async (req, res) => {
  const { error, value } = createRideSchema.validate(req.body);
  if (error) return res.status(400).json({ success: false, message: error.message });

  const { computeEstimate } = await import('../services/pricingService.js');
  const result = await computeEstimate({ pickup: value.pickup, destination: value.destination, vehicleType: value.vehicleType });
  res.json({ success: true, data: result });
};

export const createRide = async (req, res) => {
  const { error, value } = createRideSchema.validate(req.body);
  if (error) return res.status(400).json({ success: false, message: error.message });

  const ride = await Ride.create({
    customerId: req.user.id,
    pickup: value.pickup,
    destination: value.destination,
    status: 'requested',
    pricingContext: { regionType: value.regionType, surgeMultiplier: 1 },
    fare: { estimated: 0, currency: 'INR' }
  });

  notifyUser(req.user.id, 'ride:created', { rideId: ride._id });

  // Send WhatsApp booking confirmation
  try {
    await sendRideNotification(ride._id, 'booking_confirmed');
  } catch (error) {
    console.error('WhatsApp booking confirmation failed:', error);
  }

  res.status(201).json({ success: true, data: ride });
};

export const getRide = async (req, res) => {
  const ride = await Ride.findById(req.params.id);
  if (!ride) return res.status(404).json({ success: false, message: 'Ride not found' });
  if (ride.customerId.toString() !== req.user.id && ride.driverId?.toString() !== req.user.id && req.user.role !== 'admin') {
    return res.status(403).json({ success: false, message: 'Forbidden' });
  }
  res.json({ success: true, data: ride });
};

export const updateStatus = async (req, res) => {
  const schema = Joi.object({ status: Joi.string().valid('accepted', 'arriving', 'on-trip', 'completed', 'cancelled').required() });
  const { error, value } = schema.validate(req.body);
  if (error) return res.status(400).json({ success: false, message: error.message });

  const ride = await Ride.findById(req.params.id);
  if (!ride) return res.status(404).json({ success: false, message: 'Ride not found' });

  if (req.user.role === 'driver') {
    if (!ride.driverId && value.status === 'accepted') ride.driverId = req.user.id;
  } else if (req.user.role !== 'admin' && req.user.id !== ride.customerId.toString()) {
    return res.status(403).json({ success: false, message: 'Forbidden' });
  }

  ride.status = value.status;
  if (value.status === 'on-trip') ride.startedAt = new Date();
  if (value.status === 'completed') ride.completedAt = new Date();
  await ride.save();
  notifyRide(ride._id, 'ride:status', { status: ride.status });
  notifyUser(ride.customerId, 'ride:status', { rideId: ride._id, status: ride.status });
  if (ride.driverId) notifyUser(ride.driverId, 'ride:status', { rideId: ride._id, status: ride.status });
  res.json({ success: true, data: ride });
};

export const getHistory = async (req, res) => {
  const role = req.user.role;
  let filter = {};
  if (role === 'customer') filter = { customerId: req.user.id };
  if (role === 'driver') filter = { driverId: req.user.id };
  const rides = await Ride.find(filter).sort({ createdAt: -1 });
  res.json({ success: true, data: rides });
};
