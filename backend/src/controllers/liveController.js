import Joi from 'joi';
import { setDriverLocation, setDriverAvailability, getNearbyAvailableDrivers, pushDispatchQueue, popNextDriverFromQueue, setPendingOffer, getPendingOffer, clearPendingOffer, lockDriverForDispatch, unlockDriver, isDriverAlive } from '../utils/liveStore.js';
import { Ride } from '../models/rideModel.js';
import { notifyDriver, notifyUser, notifyRide } from '../services/notifyService.js';

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
  const schema = Joi.object({ pickup: Joi.object({ coordinates: Joi.array().items(Joi.number()).length(2).required() }).required(), radiusKm: Joi.number().default(10), rideId: Joi.string().optional() });
  const { error, value } = schema.validate(req.body);
  if (error) return res.status(400).json({ success: false, message: error.message });
  const [lng, lat] = value.pickup.coordinates;
  const nearby = await getNearbyAvailableDrivers(lng, lat, value.radiusKm, 5);

  // If rideId provided, start auto-assign flow; else return list
  if (!value.rideId) {
    return res.json({ success: true, data: nearby });
  }

  const ride = await Ride.findById(value.rideId);
  if (!ride) return res.status(404).json({ success: false, message: 'Ride not found' });
  if (ride.status !== 'requested') return res.status(400).json({ success: false, message: 'Ride not dispatchable' });

  await pushDispatchQueue(ride.id, nearby.map(d => d.driverId));
  const next = await popNextDriverFromQueue(ride.id);
  if (!next) return res.json({ success: true, data: { assigned: false, reason: 'no-drivers' } });
  const locked = await lockDriverForDispatch(next);
  if (!locked || !(await isDriverAlive(next))) {
    const n2 = await popNextDriverFromQueue(ride.id);
    if (!n2) return res.json({ success: true, data: { assigned: false, reason: 'no-drivers' } });
    if (!(await lockDriverForDispatch(n2))) return res.json({ success: true, data: { assigned: false, reason: 'no-drivers' } });
    await setPendingOffer(ride.id, n2, 20);
    notifyDriver(n2, 'dispatch:offer', { rideId: ride.id, pickup: ride.pickup, destination: ride.destination, eta: null });
    return res.json({ success: true, data: { assigned: false, pendingDriverId: n2 } });
  }
  await setPendingOffer(ride.id, next, 20);
  notifyDriver(next, 'dispatch:offer', { rideId: ride.id, pickup: ride.pickup, destination: ride.destination, eta: null });
  return res.json({ success: true, data: { assigned: false, pendingDriverId: next } });
};

export const driverRespondToOffer = async (req, res) => {
  const schema = Joi.object({ rideId: Joi.string().required(), accept: Joi.boolean().required() });
  const { error, value } = schema.validate(req.body);
  if (error) return res.status(400).json({ success: false, message: error.message });
  const pending = await getPendingOffer(value.rideId);
  if (!pending || pending !== String(req.user.id)) {
    return res.status(400).json({ success: false, message: 'No pending offer' });
  }
  const ride = await Ride.findById(value.rideId);
  if (!ride) return res.status(404).json({ success: false, message: 'Ride not found' });
  if (value.accept) {
    ride.driverId = req.user.id;
    ride.status = 'accepted';
    await ride.save();
    await clearPendingOffer(ride.id);
    notifyUser(ride.customerId, 'ride:status', { rideId: ride.id, status: 'accepted', driverId: req.user.id });
    notifyRide(ride.id, 'ride:status', { status: 'accepted', driverId: req.user.id });
    return res.json({ success: true, data: { status: 'accepted' } });
  }
  // decline: clear and try next
  await clearPendingOffer(ride.id);
  // Try next driver in queue
  const next = await popNextDriverFromQueue(ride.id);
  if (!next) {
    notifyUser(ride.customerId, 'dispatch:failed', { rideId: ride.id });
    return res.json({ success: true, data: { status: 'declined', nextOffered: null } });
  }
  await setPendingOffer(ride.id, next, 20);
  notifyDriver(next, 'dispatch:offer', { rideId: ride.id, pickup: ride.pickup, destination: ride.destination, eta: null });
  return res.json({ success: true, data: { status: 'declined', nextOffered: next } });
};