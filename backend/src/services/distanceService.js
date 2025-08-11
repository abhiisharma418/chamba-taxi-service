import { getRedis } from '../utils/redis.js';

const OSRM_BASE = 'https://router.project-osrm.org';

export const getDistanceAndDuration = async (pickup, destination) => {
  const from = pickup.coordinates; // [lng, lat]
  const to = destination.coordinates; // [lng, lat]
  const cacheKey = `route:${from[0]},${from[1]}:${to[0]},${to[1]}`;
  const redis = getRedis();
  try {
    const cached = await redis.get(cacheKey);
    if (cached) return JSON.parse(cached);
  } catch {}

  const url = `${OSRM_BASE}/route/v1/driving/${from[0]},${from[1]};${to[0]},${to[1]}?overview=false&alternatives=false`;
  const resp = await fetch(url);
  if (!resp.ok) throw new Error(`OSRM error: ${resp.status}`);
  const data = await resp.json();
  const route = data?.routes?.[0];
  const result = route ? { distanceKm: route.distance / 1000, durationMin: Math.ceil(route.duration / 60) } : { distanceKm: 1, durationMin: 5 };

  try { await redis.setex(cacheKey, 300, JSON.stringify(result)); } catch {}
  return result;
};