import { getRedis } from './redis.js';

const GEO_KEY = 'drivers:geo';
const AVAIL_SET = 'drivers:available';

export const setDriverLocation = async (driverId, lng, lat) => {
  const redis = getRedis();
  await redis.geoadd(GEO_KEY, lng, lat, String(driverId));
  await redis.setex(`driver:hb:${driverId}`, 30, '1');
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

export const getNearbyAvailableDrivers = async (lng, lat, radiusKm = 10, limit = 10) => {
  const redis = getRedis();
  // GEOSEARCH with WHEREIN on availability is not native; filter after fetch
  const results = await redis.geosearch(GEO_KEY, 'FROMLONLAT', lng, lat, 'BYRADIUS', radiusKm, 'km', 'WITHCOORD', 'ASC', 'COUNT', limit * 3);
  const out = [];
  for (const entry of results) {
    const driverId = Array.isArray(entry) ? entry[0] : entry;
    const avail = await redis.sismember(AVAIL_SET, String(driverId));
    if (avail) out.push({ driverId });
    if (out.length >= limit) break;
  }
  return out;
};