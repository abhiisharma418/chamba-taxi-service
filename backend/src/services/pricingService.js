import { haversineKm, isInHimachal } from '../utils/geo.js';
import { getDistanceAndDuration } from './distanceService.js';
import { PricingConfig } from '../models/pricingModel.js';
import { Zone } from '../models/zoneModel.js';
import booleanPointInPolygon from '@turf/boolean-point-in-polygon';
import { point, polygon } from '@turf/helpers';
import { getRedis } from '../utils/redis.js';

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

const computeSurgeMultiplier = ({ distanceKm, durationMin, regionType, demandIndex = 1 }) => {
  let surge = 1;
  if (regionType === 'hill') surge += 0.1; // base +10% in hill
  if (durationMin > 60) surge += 0.05; // long trips slight surge
  if (demandIndex > 1.2) surge += Math.min(0.5, (demandIndex - 1.2));
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

  const surge = computeSurgeMultiplier({ distanceKm, durationMin, regionType });
  const estimated = Math.round((p.baseFare + distanceKm * p.perKm + durationMin * p.perMinute) * (p.surgeMultiplier || 1) * surge);
  const result = { estimated, currency: 'INR', regionType, distanceKm, durationMin, surge };
  await redis.setex(key, 300, JSON.stringify(result));
  return result;
};