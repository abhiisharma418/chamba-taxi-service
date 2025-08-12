// Haversine formula to calculate distance between two coordinates
export function calculateDistance(lat1, lon1, lat2, lon2) {
  const R = 6371; // Earth's radius in kilometers
  const dLat = toRadians(lat2 - lat1);
  const dLon = toRadians(lon2 - lon1);
  
  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRadians(lat1)) * Math.cos(toRadians(lat2)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c; // Distance in kilometers
}

function toRadians(degrees) {
  return degrees * (Math.PI / 180);
}

// Fare calculation based on RideWithUs pricing structure
export function calculateFare(distanceKm, durationMinutes, vehicleType, surgeMultiplier = 1.0) {
  const pricingConfig = {
    car: {
      baseFare: 50,
      perKmRate: 12,
      perMinuteRate: 2,
      minFare: 80,
      maxFare: 2000
    },
    bike: {
      baseFare: 25,
      perKmRate: 8,
      perMinuteRate: 1.5,
      minFare: 40,
      maxFare: 1500
    }
  };

  const config = pricingConfig[vehicleType];
  
  // Base calculation
  const baseFare = config.baseFare;
  const distanceCharge = distanceKm * config.perKmRate;
  const timeCharge = durationMinutes * config.perMinuteRate;
  
  // Calculate subtotal
  let subtotal = baseFare + distanceCharge + timeCharge;
  
  // Apply minimum fare
  if (subtotal < config.minFare) {
    subtotal = config.minFare;
  }
  
  // Apply surge pricing
  let totalWithSurge = subtotal * surgeMultiplier;
  
  // Apply maximum fare limit
  if (totalWithSurge > config.maxFare) {
    totalWithSurge = config.maxFare;
  }
  
  // Round to nearest rupee
  const totalFare = Math.round(totalWithSurge);
  
  return {
    baseFare: Math.round(baseFare),
    distanceCharge: Math.round(distanceCharge),
    timeCharge: Math.round(timeCharge),
    subtotal: Math.round(subtotal),
    surgeMultiplier,
    totalFare
  };
}

// Calculate 75-25 split breakdown
export function getFareBreakdown(totalFare) {
  const driverEarning = Math.round(totalFare * 0.75); // 75% to driver
  const companyCommission = totalFare - driverEarning; // 25% to company
  
  return {
    totalFare,
    driverEarning,
    companyCommission,
    driverPercentage: 75,
    companyPercentage: 25
  };
}

// Get surge pricing for specific conditions
export function getSurgeForConditions(pickupAddress, vehicleType, datetime = new Date()) {
  const hour = datetime.getHours();
  const day = datetime.getDay(); // 0 = Sunday, 6 = Saturday
  let surge = 1.0;
  
  // Time-based surge
  // Peak morning hours (8-10 AM) on weekdays
  if (hour >= 8 && hour <= 10 && day >= 1 && day <= 5) {
    surge = Math.max(surge, 1.5);
  }
  
  // Peak evening hours (5-8 PM) on weekdays  
  if (hour >= 17 && hour <= 20 && day >= 1 && day <= 5) {
    surge = Math.max(surge, 1.5);
  }
  
  // Weekend surge
  if (day === 0 || day === 6) {
    surge = Math.max(surge, 1.2);
  }
  
  // Late night surge (11 PM - 5 AM)
  if (hour >= 23 || hour <= 5) {
    surge = Math.max(surge, 1.3);
  }
  
  // Location-based surge
  const lowerAddress = pickupAddress.toLowerCase();
  
  // High-demand locations
  if (lowerAddress.includes('mall road') || lowerAddress.includes('the mall')) {
    surge = Math.max(surge, 1.4);
  }
  
  if (lowerAddress.includes('railway station') || lowerAddress.includes('bus stand')) {
    surge = Math.max(surge, 1.3);
  }
  
  if (lowerAddress.includes('airport')) {
    surge = Math.max(surge, 1.5);
  }
  
  if (lowerAddress.includes('hospital') || lowerAddress.includes('emergency')) {
    surge = Math.max(surge, 1.2);
  }
  
  // Event-based surge (you can add specific events here)
  // Example: During festivals or special events
  
  return surge;
}

// Estimate fare for a trip
export function estimateTripFare(pickupCoords, destinationCoords, vehicleType, pickupAddress = '') {
  // Calculate distance
  const distance = calculateDistance(
    pickupCoords[1], pickupCoords[0],
    destinationCoords[1], destinationCoords[0]
  );
  
  // Estimate duration based on distance and region
  let duration;
  if (distance < 5) {
    duration = distance * 3; // 20 km/h in city traffic
  } else if (distance < 20) {
    duration = distance * 2.5; // 24 km/h mixed traffic
  } else {
    duration = distance * 1.5; // 40 km/h highway
  }
  
  // Get surge multiplier
  const surge = getSurgeForConditions(pickupAddress, vehicleType);
  
  // Calculate fare
  const fareData = calculateFare(distance, duration, vehicleType, surge);
  const breakdown = getFareBreakdown(fareData.totalFare);
  
  return {
    distance: parseFloat(distance.toFixed(2)),
    duration: Math.round(duration),
    fare: fareData,
    breakdown,
    surge
  };
}

// Validate fare amount (to prevent frontend manipulation)
export function validateFareAmount(providedAmount, pickupCoords, destinationCoords, vehicleType, pickupAddress = '') {
  const calculated = estimateTripFare(pickupCoords, destinationCoords, vehicleType, pickupAddress);
  const tolerance = 0.1; // 10% tolerance for calculation differences
  
  const difference = Math.abs(providedAmount - calculated.fare.totalFare);
  const allowedDifference = calculated.fare.totalFare * tolerance;
  
  return {
    isValid: difference <= allowedDifference,
    providedAmount,
    calculatedAmount: calculated.fare.totalFare,
    difference,
    tolerance: tolerance * 100
  };
}
