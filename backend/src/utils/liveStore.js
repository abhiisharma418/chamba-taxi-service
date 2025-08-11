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
  const results = await redis.geosearch(GEO_KEY, 'FROMLONLAT', lng, lat, 'BYRADIUS', radiusKm, 'km', 'WITHCOORD', 'ASC', 'COUNT', limit * 3);
  const out = [];
  for (const entry of results) {
    // ioredis returns [member, [lon, lat]] when WITHCOORD is used
    let driverId, coords;
    if (Array.isArray(entry)) {
      driverId = entry[0];
      coords = entry[1];
    } else {
      driverId = entry;
      coords = null;
    }
    const avail = await redis.sismember(AVAIL_SET, String(driverId));
    if (avail) {
      const lon = coords?.[0];
      const la = coords?.[1];
      out.push({ driverId, lng: Number(lon), lat: Number(la) });
    }
    if (out.length >= limit) break;
  }
  return out;
};