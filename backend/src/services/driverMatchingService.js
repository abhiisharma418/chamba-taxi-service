import { User } from '../models/userModel.js';
import { calculateDistance } from './fareService.js';
import { getRedis } from '../utils/redis.js';

// Find nearby available drivers
export async function findNearbyDrivers(lat, lng, vehicleType, radiusKm = 10) {
  try {
    // Find drivers with matching vehicle type and approved status
    const drivers = await User.find({
      role: 'driver',
      'driver.verificationStatus': 'approved',
      'driver.vehicleType': vehicleType,
      'driver.isActive': true
    }).select('_id name phone driver location');

    if (!drivers.length) {
      return [];
    }

    const nearbyDrivers = [];
    const redis = getRedis();

    // Check each driver's location and availability
    for (const driver of drivers) {
      try {
        // Get driver's real-time location from Redis
        const locationKey = `driver:location:${driver._id}`;
        const location = await redis.get(locationKey);
        
        let driverLat, driverLng;
        
        if (location) {
          const coords = JSON.parse(location);
          driverLat = coords.lat;
          driverLng = coords.lng;
        } else if (driver.location && driver.location.coordinates) {
          // Fallback to stored location
          driverLng = driver.location.coordinates[0];
          driverLat = driver.location.coordinates[1];
        } else {
          continue; // Skip driver if no location available
        }

        // Calculate distance
        const distance = calculateDistance(lat, lng, driverLat, driverLng);
        
        if (distance <= radiusKm) {
          // Check if driver is currently available (not on another trip)
          const availabilityKey = `driver:available:${driver._id}`;
          const isAvailable = await redis.get(availabilityKey);
          
          if (isAvailable === 'true') {
            nearbyDrivers.push({
              driverId: driver._id,
              name: driver.name,
              phone: driver.phone,
              vehicleType: driver.driver.vehicleType,
              vehicleModel: driver.driver.vehicleModel,
              vehicleNumber: driver.driver.vehicleNumber,
              rating: driver.driver.rating || 4.5,
              distance: parseFloat(distance.toFixed(2)),
              location: {
                lat: driverLat,
                lng: driverLng
              },
              estimatedArrival: calculateArrivalTime(distance)
            });
          }
        }
      } catch (error) {
        console.error(`Error processing driver ${driver._id}:`, error);
        continue;
      }
    }

    // Sort by distance (closest first)
    nearbyDrivers.sort((a, b) => a.distance - b.distance);
    
    return nearbyDrivers;
  } catch (error) {
    console.error('Error finding nearby drivers:', error);
    return [];
  }
}

// Assign driver to ride
export async function assignDriverToRide(rideId, driverId) {
  try {
    const redis = getRedis();
    
    // Set driver as busy
    await redis.set(`driver:available:${driverId}`, 'false');
    await redis.set(`driver:current_ride:${driverId}`, rideId.toString());
    
    // Update driver's last assignment time
    await redis.set(`driver:last_assignment:${driverId}`, Date.now().toString());
    
    return true;
  } catch (error) {
    console.error('Error assigning driver to ride:', error);
    return false;
  }
}

// Release driver after ride completion
export async function releaseDriver(driverId) {
  try {
    const redis = getRedis();
    
    // Set driver as available
    await redis.set(`driver:available:${driverId}`, 'true');
    await redis.del(`driver:current_ride:${driverId}`);
    
    return true;
  } catch (error) {
    console.error('Error releasing driver:', error);
    return false;
  }
}

// Update driver location (called from heartbeat)
export async function updateDriverLocation(driverId, lat, lng) {
  try {
    const redis = getRedis();
    
    const locationData = {
      lat: parseFloat(lat),
      lng: parseFloat(lng),
      timestamp: Date.now()
    };
    
    // Store in Redis with 5-minute expiry
    await redis.setex(`driver:location:${driverId}`, 300, JSON.stringify(locationData));
    
    // Also update in database for persistence
    await User.findByIdAndUpdate(driverId, {
      'location.coordinates': [lng, lat],
      'location.lastUpdated': new Date()
    });
    
    return true;
  } catch (error) {
    console.error('Error updating driver location:', error);
    return false;
  }
}

// Set driver availability status
export async function setDriverAvailability(driverId, isAvailable) {
  try {
    const redis = getRedis();
    
    await redis.set(`driver:available:${driverId}`, isAvailable.toString());
    
    // If going offline, also clear current ride
    if (!isAvailable) {
      await redis.del(`driver:current_ride:${driverId}`);
    }
    
    // Update in database
    await User.findByIdAndUpdate(driverId, {
      'driver.isOnline': isAvailable,
      'driver.lastOnline': new Date()
    });
    
    return true;
  } catch (error) {
    console.error('Error setting driver availability:', error);
    return false;
  }
}

// Get driver's current ride
export async function getDriverCurrentRide(driverId) {
  try {
    const redis = getRedis();
    const rideId = await redis.get(`driver:current_ride:${driverId}`);
    return rideId;
  } catch (error) {
    console.error('Error getting driver current ride:', error);
    return null;
  }
}

// Check if driver is available
export async function isDriverAvailable(driverId) {
  try {
    const redis = getRedis();
    const availability = await redis.get(`driver:available:${driverId}`);
    return availability === 'true';
  } catch (error) {
    console.error('Error checking driver availability:', error);
    return false;
  }
}

// Get all online drivers (for admin dashboard)
export async function getOnlineDrivers() {
  try {
    const redis = getRedis();
    const drivers = await User.find({
      role: 'driver',
      'driver.verificationStatus': 'approved'
    }).select('_id name phone driver');

    const onlineDrivers = [];

    for (const driver of drivers) {
      const isAvailable = await redis.get(`driver:available:${driver._id}`);
      const locationData = await redis.get(`driver:location:${driver._id}`);
      
      if (isAvailable === 'true' || isAvailable === 'false') {
        // Driver is online (either available or busy)
        let location = null;
        if (locationData) {
          location = JSON.parse(locationData);
        }

        onlineDrivers.push({
          driverId: driver._id,
          name: driver.name,
          phone: driver.phone,
          vehicleType: driver.driver.vehicleType,
          vehicleModel: driver.driver.vehicleModel,
          vehicleNumber: driver.driver.vehicleNumber,
          isAvailable: isAvailable === 'true',
          location,
          rating: driver.driver.rating || 4.5
        });
      }
    }

    return onlineDrivers;
  } catch (error) {
    console.error('Error getting online drivers:', error);
    return [];
  }
}

// Calculate estimated arrival time based on distance
function calculateArrivalTime(distanceKm) {
  // Assume average speed of 30 km/h in city
  const timeInHours = distanceKm / 30;
  const timeInMinutes = Math.round(timeInHours * 60);
  
  // Minimum 2 minutes, maximum 30 minutes
  return Math.max(2, Math.min(30, timeInMinutes));
}

// Driver performance metrics
export async function getDriverMetrics(driverId, days = 30) {
  try {
    const redis = getRedis();
    const endDate = new Date();
    const startDate = new Date(endDate.getTime() - (days * 24 * 60 * 60 * 1000));

    // This would typically query ride completion data
    // For now, return sample metrics
    const metrics = {
      totalRides: 45,
      totalEarnings: 12750, // Driver's 75% share
      totalFares: 17000, // Total fare collected
      companyCommission: 4250, // Company's 25% share
      averageRating: 4.7,
      acceptanceRate: 92,
      cancellationRate: 3,
      onlineHours: 180
    };

    return metrics;
  } catch (error) {
    console.error('Error getting driver metrics:', error);
    return null;
  }
}
