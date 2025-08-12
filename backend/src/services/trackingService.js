// import  getIO } from './notifyService.js';
import { setDriverLocation} from '../utils/liveStore.js';
import { Ride } from '../models/rideModel.js';
import { User } from '../models/userModel.js';

class TrackingService {
  constructor() {
    this.activeRides = new Map(); // rideId -> { driverId, customerId, route, eta }
    this.driverLocations = new Map(); // driverId -> { lat, lng, timestamp, heading, speed }
  }

  // Start tracking a ride
  async startRideTracking(rideId, driverId, customerId) {
    try {
      const ride = await Ride.findById(rideId);
      if (!ride) throw new Error('Ride not found');

      this.activeRides.set(rideId, {
        driverId,
        customerId,
        startTime: new Date(),
        pickup: ride.pickup,
        destination: ride.destination,
        status: 'tracking',
        route: null,
        eta: null
      });

      const io = getIO();
      
      // Notify both customer and driver that tracking has started
      io.to(`user:${customerId}`).emit('tracking:started', {
        rideId,
        driverId,
        message: 'Live tracking activated'
      });

      io.to(`user:${driverId}`).emit('tracking:started', {
        rideId,
        customerId,
        message: 'Ride tracking started'
      });

      console.log(`Started tracking for ride ${rideId}`);
      return { success: true, rideId, message: 'Tracking started' };
    } catch (error) {
      console.error('Error starting ride tracking:', error);
      return { success: false, error: error.message };
    }
  }

  // Update driver location and broadcast to customers
  async updateDriverLocation(driverId, locationData) {
    try {
      const { lat, lng, heading = 0, speed = 0, accuracy = 0 } = locationData;
      
      // Store location in live store
      await setDriverLocation(driverId, lng, lat);
      
      // Update our tracking data
      this.driverLocations.set(driverId, {
        lat,
        lng,
        heading,
        speed,
        accuracy,
        timestamp: new Date()
      });

      // Find active rides for this driver
      const activeRides = Array.from(this.activeRides.entries())
        .filter(([_, rideData]) => rideData.driverId === driverId);

      const io = getIO();

      // Broadcast location to customers of active rides
      for (const [rideId, rideData] of activeRides) {
        const locationUpdate = {
          rideId,
          driverId,
          location: { lat, lng },
          heading,
          speed,
          timestamp: new Date(),
          eta: await this.calculateETA(rideData, { lat, lng })
        };

        // Send to customer
        io.to(`user:${rideData.customerId}`).emit('driver:location', locationUpdate);
        
        // Send to ride room (if anyone is watching the ride)
        io.to(`ride:${rideId}`).emit('driver:location', locationUpdate);
      }

      return { success: true, location: { lat, lng }, ridesUpdated: activeRides.length };
    } catch (error) {
      console.error('Error updating driver location:', error);
      return { success: false, error: error.message };
    }
  }

  // Calculate ETA based on current location and destination
  async calculateETA(rideData, currentLocation) {
    try {
      if (!rideData.destination || !currentLocation) return null;

      const destination = rideData.destination.coordinates;
      if (!destination || destination.length !== 2) return null;

      // Simple distance calculation (in real app, use routing service)
      const distance = this.calculateDistance(
        currentLocation.lat,
        currentLocation.lng,
        destination[1],  // latitude
        destination[0]   // longitude
      );

      // Estimate time based on average speed (assume 30 km/h in city)
      const averageSpeedKmh = 30;
      const etaMinutes = Math.round((distance / averageSpeedKmh) * 60);

      return {
        distanceKm: Math.round(distance * 100) / 100,
        etaMinutes,
        estimatedArrival: new Date(Date.now() + etaMinutes * 60 * 1000)
      };
    } catch (error) {
      console.error('Error calculating ETA:', error);
      return null;
    }
  }

  // Calculate distance between two points (Haversine formula)
  calculateDistance(lat1, lon1, lat2, lon2) {
    const R = 6371; // Earth's radius in kilometers
    const dLat = this.toRadians(lat2 - lat1);
    const dLon = this.toRadians(lon2 - lon1);
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(this.toRadians(lat1)) * Math.cos(this.toRadians(lat2)) * 
      Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  }

  toRadians(degrees) {
    return degrees * (Math.PI/180);
  }

  // Stop tracking a ride
  async stopRideTracking(rideId, reason = 'completed') {
    try {
      const rideData = this.activeRides.get(rideId);
      if (!rideData) return { success: false, message: 'Ride not being tracked' };

      const io = getIO();
      
      // Notify both parties that tracking has ended
      const trackingEndData = {
        rideId,
        reason,
        duration: new Date() - rideData.startTime,
        endTime: new Date()
      };

      io.to(`user:${rideData.customerId}`).emit('tracking:ended', trackingEndData);
      io.to(`user:${rideData.driverId}`).emit('tracking:ended', trackingEndData);
      io.to(`ride:${rideId}`).emit('tracking:ended', trackingEndData);

      // Remove from active tracking
      this.activeRides.delete(rideId);

      console.log(`Stopped tracking for ride ${rideId}, reason: ${reason}`);
      return { success: true, rideId, reason };
    } catch (error) {
      console.error('Error stopping ride tracking:', error);
      return { success: false, error: error.message };
    }
  }

  // Get current status of a ride
  getRideTrackingStatus(rideId) {
    const rideData = this.activeRides.get(rideId);
    if (!rideData) return null;

    const driverLocation = this.driverLocations.get(rideData.driverId);
    
    return {
      rideId,
      isTracking: true,
      startTime: rideData.startTime,
      driverLocation,
      eta: rideData.eta,
      status: rideData.status
    };
  }

  // Get all active rides being tracked
  getActiveRides() {
    return Array.from(this.activeRides.entries()).map(([rideId, data]) => ({
      rideId,
      ...data,
      driverLocation: this.driverLocations.get(data.driverId)
    }));
  }

  // Share live location with customer
  async shareLiveLocation(rideId, driverId, customerId) {
    try {
      const driverLocation = this.driverLocations.get(driverId);
      if (!driverLocation) {
        return { success: false, message: 'Driver location not available' };
      }

      const io = getIO();
      
      // Send current location to customer
      io.to(`user:${customerId}`).emit('driver:location:shared', {
        rideId,
        driverId,
        location: driverLocation,
        timestamp: new Date(),
        message: 'Driver has shared their live location'
      });

      return { success: true, location: driverLocation };
    } catch (error) {
      console.error('Error sharing live location:', error);
      return { success: false, error: error.message };
    }
  }

  // Geofence alerts (when driver reaches pickup/destination)
  async checkGeofence(driverId, currentLocation) {
    try {
      const activeRides = Array.from(this.activeRides.entries())
        .filter(([_, rideData]) => rideData.driverId === driverId);

      const io = getIO();
      const alerts = [];

      for (const [rideId, rideData] of activeRides) {
        // Check if driver is near pickup location
        if (rideData.pickup && rideData.pickup.coordinates) {
          const pickupDistance = this.calculateDistance(
            currentLocation.lat,
            currentLocation.lng,
            rideData.pickup.coordinates[1],
            rideData.pickup.coordinates[0]
          );

          if (pickupDistance <= 0.1) { // Within 100 meters
            const alert = {
              type: 'arrived_pickup',
              rideId,
              message: 'Driver has arrived at pickup location'
            };

            io.to(`user:${rideData.customerId}`).emit('geofence:alert', alert);
            io.to(`user:${driverId}`).emit('geofence:alert', alert);
            alerts.push(alert);
          }
        }

        // Check if driver is near destination
        if (rideData.destination && rideData.destination.coordinates) {
          const destDistance = this.calculateDistance(
            currentLocation.lat,
            currentLocation.lng,
            rideData.destination.coordinates[1],
            rideData.destination.coordinates[0]
          );

          if (destDistance <= 0.1) { // Within 100 meters
            const alert = {
              type: 'arrived_destination',
              rideId,
              message: 'Driver has arrived at destination'
            };

            io.to(`user:${rideData.customerId}`).emit('geofence:alert', alert);
            io.to(`user:${driverId}`).emit('geofence:alert', alert);
            alerts.push(alert);
          }
        }
      }

      return { success: true, alerts };
    } catch (error) {
      console.error('Error checking geofence:', error);
      return { success: false, error: error.message };
    }
  }

  // Emergency tracking (SOS)
  async triggerEmergencyTracking(rideId, triggeredBy, location) {
    try {
      const rideData = this.activeRides.get(rideId);
      if (!rideData) return { success: false, message: 'Ride not found' };

      const io = getIO();
      const emergencyData = {
        rideId,
        triggeredBy,
        location,
        timestamp: new Date(),
        type: 'emergency'
      };

      // Notify all relevant parties
      io.to(`user:${rideData.customerId}`).emit('emergency:triggered', emergencyData);
      io.to(`user:${rideData.driverId}`).emit('emergency:triggered', emergencyData);
      
      // Notify admin/support
      io.to('admin').emit('emergency:alert', emergencyData);

      console.log(`Emergency triggered for ride ${rideId} by ${triggeredBy}`);
      return { success: true, emergencyData };
    } catch (error) {
      console.error('Error triggering emergency tracking:', error);
      return { success: false, error: error.message };
    }
  }
}

export default new TrackingService();
