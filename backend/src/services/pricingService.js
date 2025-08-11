import { haversineKm, isInHimachal } from '../utils/geo.js';

export const computeEstimate = ({ pickup, destination, vehicleType }) => {
  const distanceKm = Math.max(1, haversineKm(pickup.coordinates, destination.coordinates));
  const inHill = isInHimachal(pickup.coordinates) || isInHimachal(destination.coordinates);
  const regionType = inHill ? 'hill' : 'city';

  const baseFare = vehicleType === 'bike' ? 30 : 50;
  const perKmHill = vehicleType === 'bike' ? 18 : 25;
  const perKmCity = vehicleType === 'bike' ? 10 : 14;
  const perMinute = vehicleType === 'bike' ? 1 : 2;
  const perKm = regionType === 'hill' ? perKmHill : perKmCity;

  const durationMin = Math.ceil(distanceKm * (regionType === 'hill' ? 4 : 2.5));
  const estimated = Math.round(baseFare + distanceKm * perKm + durationMin * perMinute);
  return { estimated, currency: 'INR', regionType, distanceKm, durationMin };
};