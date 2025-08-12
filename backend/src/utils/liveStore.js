import { getRedis } from './redis.js';

const GEO_KEY = 'drivers:geo';
const AVAIL_SET = 'drivers:available';
const ACTIVE_SET = 'dispatch:active';

export const setDriverLocation = async (driverId, lng, lat) => {
  const redis = getRedis();
  await redis.geoadd(GEO_KEY, lng, lat, String(driverId));
  await redis.setex(`driver:hb:${driverId}`, 30, '1');
};

export const getDriverPosition = async (driverId) => {
  const redis = getRedis();
  const pos = await redis.geopos(GEO_KEY, String(driverId));
  const p = pos?.[0];
  if (!p || p[0] == null || p[1] == null) return null;
  return { lng: Number(p[0]), lat: Number(p[1]) };
};

export const setDriverAvailability = async (driverId, available) => {
  const redis = getRedis();
  if (available) await redis.sadd(AVAIL_SET, String(driverId));
  else await redis.srem(AVAIL_SET, String(driverId));
};

export const isDriverAvailable = async (driverId) => {
  const redis = getRedis();
  return (await redis.sismember(AVAIL_SET, String(driverId))) === 1;
};

export const isDriverAlive = async (driverId) => {
  const redis = getRedis();
  const ttl = await redis.ttl(`driver:hb:${driverId}`);
  return ttl > 0;
};

export const getNearbyAvailableDrivers = async (lng, lat, radiusKm = 10, limit = 10) => {
  const redis = getRedis();
  const results = await redis.geosearch(GEO_KEY, 'FROMLONLAT', lng, lat, 'BYRADIUS', radiusKm, 'km', 'WITHCOORD', 'ASC', 'COUNT', limit * 3);
  const out = [];
  for (const entry of results) {
    let driverId, coords;
    if (Array.isArray(entry)) {
      driverId = entry[0];
      coords = entry[1];
    } else {
      driverId = entry;
      coords = null;
    }
    const avail = await redis.sismember(AVAIL_SET, String(driverId));
    if (!avail) continue;
    const ttl = await redis.ttl(`driver:hb:${driverId}`);
    if (ttl <= 0) {
      await redis.srem(AVAIL_SET, String(driverId));
      continue;
    }
    const lon = coords?.[0];
    const la = coords?.[1];
    out.push({ driverId: String(driverId), lng: Number(lon), lat: Number(la) });
    if (out.length >= limit) break;
  }
  return out;
};

// Dispatch helpers
export const pushDispatchQueue = async (rideId, driverIds) => {
  const redis = getRedis();
  const key = `dispatch:queue:${rideId}`;
  if (driverIds.length > 0) await redis.rpush(key, ...driverIds.map(String));
  await redis.expire(key, 60);
};

export const popNextDriverFromQueue = async (rideId) => {
  const redis = getRedis();
  const key = `dispatch:queue:${rideId}`;
  const driverId = await redis.lpop(key);
  return driverId ? String(driverId) : null;
};

export const setPendingOffer = async (rideId, driverId, ttlSec = 20) => {
  const redis = getRedis();
  const key = `dispatch:pending:${rideId}`;
  const ok = await redis.set(key, String(driverId), 'NX', 'EX', ttlSec);
  return ok === 'OK';
};

export const getPendingOffer = async (rideId) => {
  const redis = getRedis();
  const key = `dispatch:pending:${rideId}`;
  const val = await redis.get(key);
  return val ? String(val) : null;
};

export const clearPendingOffer = async (rideId) => {
  const redis = getRedis();
  const key = `dispatch:pending:${rideId}`;
  await redis.del(key);
};

export const lockDriverForDispatch = async (driverId, ttlSec = 25) => {
  const redis = getRedis();
  const key = `driver:lock:${driverId}`;
  const ok = await redis.set(key, '1', 'NX', 'EX', ttlSec);
  return ok === 'OK';
};

export const isDriverLocked = async (driverId) => {
  const redis = getRedis();
  const key = `driver:lock:${driverId}`;
  const exists = await redis.exists(key);
  return exists === 1;
};

export const unlockDriver = async (driverId) => {
  const redis = getRedis();
  const key = `driver:lock:${driverId}`;
  await redis.del(key);
};

export const addActiveDispatchRide = async (rideId) => {
  const redis = getRedis();
  await redis.sadd(ACTIVE_SET, String(rideId));
};

export const removeActiveDispatchRide = async (rideId) => {
  const redis = getRedis();
  await redis.srem(ACTIVE_SET, String(rideId));
};

export const getActiveDispatchRides = async () => {
  const redis = getRedis();
  const ids = await redis.smembers(ACTIVE_SET);
  return ids.map(String);
};