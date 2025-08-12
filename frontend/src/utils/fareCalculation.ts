export interface FareBreakdown {
  totalFare: number;
  driverEarning: number; // 75%
  companyCommission: number; // 25%
  baseAmount: number;
  distanceAmount: number;
  timeAmount: number;
  surgeMultiplier: number;
  taxes: number;
}

export interface PricingConfig {
  baseFare: {
    car: number;
    bike: number;
  };
  perKmRate: {
    car: number;
    bike: number;
  };
  perMinuteRate: {
    car: number;
    bike: number;
  };
  minFare: {
    car: number;
    bike: number;
  };
  maxFare: {
    car: number;
    bike: number;
  };
  surgeZones: {
    [key: string]: number;
  };
  taxRate: number; // percentage
}

// Default pricing configuration
export const defaultPricing: PricingConfig = {
  baseFare: {
    car: 50,
    bike: 25
  },
  perKmRate: {
    car: 12,
    bike: 8
  },
  perMinuteRate: {
    car: 2,
    bike: 1.5
  },
  minFare: {
    car: 80,
    bike: 40
  },
  maxFare: {
    car: 2000,
    bike: 1500
  },
  surgeZones: {
    'shimla_mall_road': 1.5,
    'shimla_railway_station': 1.3,
    'kalka_station': 1.2,
    'chandigarh_airport': 1.4
  },
  taxRate: 0 // No tax for now
};

export function calculateFare(
  distanceKm: number,
  durationMinutes: number,
  vehicleType: 'car' | 'bike',
  regionType: string = 'city',
  surge: number = 1.0,
  config: PricingConfig = defaultPricing
): FareBreakdown {
  
  // Base calculation
  const baseFare = config.baseFare[vehicleType];
  const distanceAmount = distanceKm * config.perKmRate[vehicleType];
  const timeAmount = durationMinutes * config.perMinuteRate[vehicleType];
  
  // Calculate base total before surge
  let baseTotal = baseFare + distanceAmount + timeAmount;
  
  // Apply minimum fare
  if (baseTotal < config.minFare[vehicleType]) {
    baseTotal = config.minFare[vehicleType];
  }
  
  // Apply surge pricing
  const surgeMultiplier = surge;
  let totalWithSurge = baseTotal * surgeMultiplier;
  
  // Apply maximum fare limit
  if (totalWithSurge > config.maxFare[vehicleType]) {
    totalWithSurge = config.maxFare[vehicleType];
  }
  
  // Calculate taxes
  const taxes = totalWithSurge * (config.taxRate / 100);
  const totalFare = Math.round(totalWithSurge + taxes);
  
  // Calculate 75-25 split
  const driverEarning = Math.round(totalFare * 0.75);
  const companyCommission = totalFare - driverEarning;
  
  return {
    totalFare,
    driverEarning,
    companyCommission,
    baseAmount: Math.round(baseFare),
    distanceAmount: Math.round(distanceAmount),
    timeAmount: Math.round(timeAmount),
    surgeMultiplier,
    taxes: Math.round(taxes)
  };
}

export function getSurgeForLocation(address: string, config: PricingConfig = defaultPricing): number {
  const lowerAddress = address.toLowerCase();
  
  for (const [zone, multiplier] of Object.entries(config.surgeZones)) {
    const zoneName = zone.replace(/_/g, ' ');
    if (lowerAddress.includes(zoneName)) {
      return multiplier;
    }
  }
  
  // Check for high-traffic keywords
  if (lowerAddress.includes('mall') || lowerAddress.includes('station') || lowerAddress.includes('airport')) {
    return 1.2;
  }
  
  return 1.0; // No surge
}

export function formatFareBreakdown(breakdown: FareBreakdown): string {
  const parts = [];
  
  if (breakdown.baseAmount > 0) {
    parts.push(`Base: ₹${breakdown.baseAmount}`);
  }
  
  if (breakdown.distanceAmount > 0) {
    parts.push(`Distance: ₹${breakdown.distanceAmount}`);
  }
  
  if (breakdown.timeAmount > 0) {
    parts.push(`Time: ��${breakdown.timeAmount}`);
  }
  
  if (breakdown.surgeMultiplier > 1) {
    parts.push(`Surge (${breakdown.surgeMultiplier}x): Applied`);
  }
  
  if (breakdown.taxes > 0) {
    parts.push(`Taxes: ₹${breakdown.taxes}`);
  }
  
  return parts.join(' • ');
}

export function getEstimateForTrip(
  pickupAddress: string,
  destinationAddress: string,
  vehicleType: 'car' | 'bike',
  distanceKm?: number,
  durationMinutes?: number
): FareBreakdown {
  
  // If actual distance/time not provided, estimate based on addresses
  const estimatedDistance = distanceKm || estimateDistance(pickupAddress, destinationAddress);
  const estimatedDuration = durationMinutes || estimateTime(estimatedDistance);
  
  // Determine surge based on pickup location
  const surge = getSurgeForLocation(pickupAddress);
  
  return calculateFare(
    estimatedDistance,
    estimatedDuration,
    vehicleType,
    'city',
    surge
  );
}

function estimateDistance(pickup: string, destination: string): number {
  // Simple distance estimation based on address keywords
  // In real app, this would use Google Distance Matrix API
  
  const pickupLower = pickup.toLowerCase();
  const destLower = destination.toLowerCase();
  
  // Same city estimates
  if (pickupLower.includes('shimla') && destLower.includes('shimla')) {
    return Math.random() * 10 + 5; // 5-15 km within Shimla
  }
  
  if (pickupLower.includes('chandigarh') && destLower.includes('chandigarh')) {
    return Math.random() * 15 + 5; // 5-20 km within Chandigarh
  }
  
  // Inter-city estimates
  if ((pickupLower.includes('shimla') && destLower.includes('kalka')) ||
      (pickupLower.includes('kalka') && destLower.includes('shimla'))) {
    return 85; // Shimla-Kalka distance
  }
  
  if ((pickupLower.includes('kalka') && destLower.includes('chandigarh')) ||
      (pickupLower.includes('chandigarh') && destLower.includes('kalka'))) {
    return 25; // Kalka-Chandigarh distance
  }
  
  if ((pickupLower.includes('shimla') && destLower.includes('chandigarh')) ||
      (pickupLower.includes('chandigarh') && destLower.includes('shimla'))) {
    return 110; // Shimla-Chandigarh distance
  }
  
  // Default estimate
  return Math.random() * 20 + 10; // 10-30 km
}

function estimateTime(distanceKm: number): number {
  // Estimate time based on distance
  // Assuming average speed of 30 km/h in city, 50 km/h on highway
  
  if (distanceKm < 20) {
    // City driving
    return distanceKm * 2.5; // ~24 km/h average
  } else {
    // Highway driving
    return distanceKm * 1.5; // ~40 km/h average
  }
}
