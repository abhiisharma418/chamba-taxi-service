export const toRadians = (degrees) => (degrees * Math.PI) / 180;

export const haversineKm = ([lng1, lat1], [lng2, lat2]) => {
  const R = 6371; // km
  const dLat = toRadians(lat2 - lat1);
  const dLng = toRadians(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRadians(lat1)) * Math.cos(toRadians(lat2)) *
    Math.sin(dLng / 2) * Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
};

// Rough bounding box for Himachal Pradesh (approx)
const HIMACHAL_BBOX = {
  minLat: 30.37,
  maxLat: 33.13,
  minLng: 75.57,
  maxLng: 79.06,
};

export const isInHimachal = ([lng, lat]) => {
  return (
    lat >= HIMACHAL_BBOX.minLat &&
    lat <= HIMACHAL_BBOX.maxLat &&
    lng >= HIMACHAL_BBOX.minLng &&
    lng <= HIMACHAL_BBOX.maxLng
  );
};