import { haversineKm, isInHimachal } from '../utils/geo.js';
import { getDistanceAndDuration } from './distanceService.js';
import { PricingConfig } from '../models/pricingModel.js';

export const computeEstimate = async ({ pickup, destination, vehicleType }) => {
  let { distanceKm, durationMin } = await getDistanceAndDuration(pickup, destination);
  if (!distanceKm || !durationMin) {
    distanceKm = Math.max(1, haversineKm(pickup.coordinates, destination.coordinates));
    durationMin = Math.ceil(distanceKm * (regionType === 'hill' ? 4 : 2.5));
  }
  const inHill = isInHimachal(pickup.coordinates) || isInHimachal(destination.coordinates);
  const regionType = inHill ? 'hill' : 'city';

  const cfg = await PricingConfig.findOne({ region: regionType, vehicleType, active: true }).sort({ updatedAt: -1 });
  const defaultCfg = vehicleType === 'bike'
    ? { baseFare: 30, perKm: regionType === 'hill' ? 18 : 10, perMinute: 1, surgeMultiplier: 1 }
    : { baseFare: 50, perKm: regionType === 'hill' ? 25 : 14, perMinute: 2, surgeMultiplier: 1 };
  const p = cfg || defaultCfg;


  const estimated = Math.round((p.baseFare + distanceKm * p.perKm + durationMin * p.perMinute) * (p.surgeMultiplier || 1));
  return { estimated, currency: 'INR', regionType, distanceKm, durationMin };
};