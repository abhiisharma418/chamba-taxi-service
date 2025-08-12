import Joi from 'joi';
import { updateDriverLocation, setDriverAvailability, findNearbyDrivers, isDriverAvailable } from '../services/driverMatchingService.js';
import { startDispatch, handleDriverResponse, getDispatchStatus } from '../services/dispatchService.js';
import { Ride } from '../models/rideModel.js';
import { notifyDriver, notifyCustomer } from '../services/notificationService.js';

export const driverHeartbeat = async (req, res) => {
  try {
    const schema = Joi.object({ lng: Joi.number().required(), lat: Joi.number().required() });
    const { error, value } = schema.validate(req.body);
    if (error) return res.status(400).json({ success: false, message: error.message });

    const success = await updateDriverLocation(req.user.id, value.lat, value.lng);

    if (success) {
      res.json({ success: true, message: 'Location updated' });
    } else {
      res.status(500).json({ success: false, message: 'Failed to update location' });
    }
  } catch (error) {
    console.error('Driver heartbeat error:', error);
    res.status(500).json({ success: false, message: 'Heartbeat failed' });
  }
};

export const driverSetAvailability = async (req, res) => {
  try {
    const schema = Joi.object({ available: Joi.boolean().required() });
    const { error, value } = schema.validate(req.body);
    if (error) return res.status(400).json({ success: false, message: error.message });

    const success = await setDriverAvailability(req.user.id, value.available);

    if (success) {
      res.json({
        success: true,
        message: `Driver ${value.available ? 'online' : 'offline'}`,
        isAvailable: value.available
      });
    } else {
      res.status(500).json({ success: false, message: 'Failed to update availability' });
    }
  } catch (error) {
    console.error('Driver availability error:', error);
    res.status(500).json({ success: false, message: 'Availability update failed' });
  }
};

async function offerToDriver(ride, driverId) {
  const driverPos = await getDriverPosition(driverId);
  let eta = null;
  if (driverPos) {
    try { const r = await getDistanceAndDuration({ coordinates: [driverPos.lng, driverPos.lat] }, ride.pickup); eta = r.durationMin; } catch {}
  }
  await setPendingOffer(ride.id, driverId, 20);
  notifyDriver(driverId, 'dispatch:offer', { rideId: ride.id, pickup: ride.pickup, destination: ride.destination, eta });
}

export const dispatchNearestDriver = async (req, res) => {
  const schema = Joi.object({ pickup: Joi.object({ coordinates: Joi.array().items(Joi.number()).length(2).required() }).required(), radiusKm: Joi.number().default(10), rideId: Joi.string().optional() });
  const { error, value } = schema.validate(req.body);
  if (error) return res.status(400).json({ success: false, message: error.message });
  const [lng, lat] = value.pickup.coordinates;
  const nearby = await getNearbyAvailableDrivers(lng, lat, value.radiusKm, 5);

  if (!value.rideId) {
    return res.json({ success: true, data: nearby });
  }

  const ride = await Ride.findById(value.rideId);
  if (!ride) return res.status(404).json({ success: false, message: 'Ride not found' });
  if (ride.status !== 'requested') return res.status(400).json({ success: false, message: 'Ride not dispatchable' });

  await addActiveDispatchRide(ride.id);
  await pushDispatchQueue(ride.id, nearby.map(d => d.driverId));
  const next = await popNextDriverFromQueue(ride.id);
  if (!next) { notifyUser(ride.customerId, 'dispatch:failed', { rideId: ride.id }); await removeActiveDispatchRide(ride.id); return res.json({ success: true, data: { assigned: false, reason: 'no-drivers' } }); }
  const locked = await lockDriverForDispatch(next);
  if (!locked || !(await isDriverAlive(next))) {
    const n2 = await popNextDriverFromQueue(ride.id);
    if (!n2) { notifyUser(ride.customerId, 'dispatch:failed', { rideId: ride.id }); await removeActiveDispatchRide(ride.id); return res.json({ success: true, data: { assigned: false, reason: 'no-drivers' } }); }
    if (!(await lockDriverForDispatch(n2))) { notifyUser(ride.customerId, 'dispatch:failed', { rideId: ride.id }); await removeActiveDispatchRide(ride.id); return res.json({ success: true, data: { assigned: false, reason: 'no-drivers' } }); }
    await offerToDriver(ride, n2);
    return res.json({ success: true, data: { assigned: false, pendingDriverId: n2 } });
  }
  await offerToDriver(ride, next);
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
    await removeActiveDispatchRide(ride.id);
    notifyUser(ride.customerId, 'ride:status', { rideId: ride.id, status: 'accepted', driverId: req.user.id });
    notifyRide(ride.id, 'ride:status', { status: 'accepted', driverId: req.user.id });
    return res.json({ success: true, data: { status: 'accepted' } });
  }
  await clearPendingOffer(ride.id);
  const next = await popNextDriverFromQueue(ride.id);
  if (!next) {
    notifyUser(ride.customerId, 'dispatch:failed', { rideId: ride.id });
    await removeActiveDispatchRide(ride.id);
    return res.json({ success: true, data: { status: 'declined', nextOffered: null } });
  }
  await offerToDriver(ride, next);
  return res.json({ success: true, data: { status: 'declined', nextOffered: next } });
};
