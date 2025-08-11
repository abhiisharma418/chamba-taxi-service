import { haversineKm, isInHimachal } from '../utils/geo.js';
import { getDistanceAndDuration } from './distanceService.js';
import { PricingConfig } from '../models/pricingModel.js';
import { Zone } from '../models/zoneModel.js';
import booleanPointInPolygon from '@turf/boolean-point-in-polygon';
import { point, polygon } from '@turf/helpers';
import { getRedis } from '../utils/redis.js';
import { Ride } from '../models/rideModel.js';

const cacheKey = (pickup, destination, vehicleType) => `price:${vehicleType}:${pickup.coordinates.join(',')}:${destination.coordinates.join(',')}`;

const detectRegion = async (pickup, destination) => {
  const zones = await Zone.find({ active: true });
  const pickPt = point([pickup.coordinates[0], pickup.coordinates[1]]);
  const destPt = point([destination.coordinates[0], destination.coordinates[1]]);
  for (const z of zones) {
    const poly = polygon(z.polygon.coordinates);
    if (booleanPointInPolygon(pickPt, poly) || booleanPointInPolygon(destPt, poly)) {
      return z.region;
    }
  }
  // fallback to bbox
  return isInHimachal(pickup.coordinates) || isInHimachal(destination.coordinates) ? 'hill' : 'city';
};

const getDemandIndex = async (regionType) => {
  const redis = getRedis();
  const key = `demand:${regionType}`;
  const cached = await redis.get(key);
  if (cached) return Number(cached);
  const since = new Date(Date.now() - 15 * 60 * 1000);
  const activeStatuses = ['requested', 'accepted', 'on-trip'];
  const count = await Ride.countDocuments({ 'pricingContext.regionType': regionType, status: { $in: activeStatuses }, createdAt: { $gte: since } });
  // baseline 20 rides per 15m window ~ index 1.0
  const index = Math.max(1, Number((count / 20).toFixed(2)));
  await redis.setex(key, 60, String(index));
  return index;
};

const computeSurgeMultiplier = ({ distanceKm, durationMin, regionType, demandIndex = 1 }) => {
  let surge = 1;
  if (regionType === 'hill') surge += 0.1; // base +10% in hill
  if (durationMin > 60) surge += 0.05; // long trips slight surge
  if (demandIndex > 1.0) surge += Math.min(0.7, (demandIndex - 1.0) * 0.5);
  return Number(surge.toFixed(2));
};

export const computeEstimate = async ({ pickup, destination, vehicleType }) => {
  const redis = getRedis();
  const key = cacheKey(pickup, destination, vehicleType);
  const cached = await redis.get(key);
  if (cached) return JSON.parse(cached);

  let { distanceKm, durationMin } = await getDistanceAndDuration(pickup, destination);
  if (!distanceKm || !durationMin) {
    distanceKm = Math.max(1, haversineKm(pickup.coordinates, destination.coordinates));
    durationMin = Math.ceil(distanceKm * 3);
  }

  const regionType = await detectRegion(pickup, destination);
  const cfg = await PricingConfig.findOne({ region: regionType, vehicleType, active: true }).sort({ updatedAt: -1 });
  const defaultCfg = vehicleType === 'bike'
    ? { baseFare: 30, perKm: regionType === 'hill' ? 18 : 10, perMinute: 1, surgeMultiplier: 1 }
    : { baseFare: 50, perKm: regionType === 'hill' ? 25 : 14, perMinute: 2, surgeMultiplier: 1 };
  const p = cfg || defaultCfg;

  const demandIndex = await getDemandIndex(regionType);
  const surge = computeSurgeMultiplier({ distanceKm, durationMin, regionType, demandIndex });
  const estimated = Math.round((p.baseFare + distanceKm * p.perKm + durationMin * p.perMinute) * (p.surgeMultiplier || 1) * surge);
  const result = { estimated, currency: 'INR', regionType, distanceKm, durationMin, surge, demandIndex };
  await redis.setex(key, 120, JSON.stringify(result));
  return result;
};