import { getRedis } from '../utils/redis.js';
import { assignDriverToRide } from './driverMatchingService.js';
import { Ride } from '../models/rideModel.js';
import notificationService from './notificationService.js';

// Start dispatch process for a ride
export async function startDispatch(rideId, pickup, nearbyDrivers) {
  try {
    if (!nearbyDrivers || nearbyDrivers.length === 0) {
      console.log(`No drivers available for ride ${rideId}`);
      return { success: false, message: 'No drivers available' };
    }

    const redis = getRedis();
    
    // Create dispatch queue for this ride
    const queueKey = `dispatch:queue:${rideId}`;
    const driverIds = nearbyDrivers.map(d => d.driverId.toString());
    
    // Store driver queue in Redis
    await redis.lpush(queueKey, ...driverIds);
    await redis.expire(queueKey, 1800); // 30 minutes expiry
    
    // Store ride dispatch info
    const dispatchInfo = {
      rideId: rideId.toString(),
      pickup,
      totalDrivers: driverIds.length,
      startTime: Date.now(),
      currentDriverIndex: 0
    };
    
    await redis.setex(`dispatch:info:${rideId}`, 1800, JSON.stringify(dispatchInfo));
    
    // Start offering to first driver
    await offerToNextDriver(rideId);
    
    return { success: true, driversFound: driverIds.length };
  } catch (error) {
    console.error('Error starting dispatch:', error);
    return { success: false, message: 'Dispatch failed' };
  }
}

// Offer ride to next available driver in queue
export async function offerToNextDriver(rideId) {
  try {
    const redis = getRedis();
    const queueKey = `dispatch:queue:${rideId}`;
    
    // Get next driver from queue
    const driverId = await redis.rpop(queueKey);
    
    if (!driverId) {
      // No more drivers available
      await handleNoDriversAvailable(rideId);
      return { success: false, message: 'No more drivers in queue' };
    }
    
    // Check if driver is still available
    const isAvailable = await redis.get(`driver:available:${driverId}`);
    if (isAvailable !== 'true') {
      // Driver no longer available, try next one
      return await offerToNextDriver(rideId);
    }
    
    // Get ride details
    const ride = await Ride.findById(rideId);
    if (!ride) {
      return { success: false, message: 'Ride not found' };
    }
    
    // Create pending offer
    await redis.setex(`dispatch:pending:${rideId}`, 30, driverId); // 30 seconds to respond
    
    // Get dispatch info
    const dispatchInfoKey = `dispatch:info:${rideId}`;
    const dispatchInfo = await redis.get(dispatchInfoKey);
    let info = dispatchInfo ? JSON.parse(dispatchInfo) : {};
    
    // Update current driver index
    info.currentDriverIndex = (info.currentDriverIndex || 0) + 1;
    await redis.setex(dispatchInfoKey, 1800, JSON.stringify(info));
    
    // Notify driver about ride offer
    const offerData = {
      rideId: rideId.toString(),
      pickup: ride.pickup,
      destination: ride.destination,
      fare: ride.fare.estimated,
      driverEarning: Math.round(ride.fare.estimated * 0.75), // 75% for driver
      distance: ride.distance,
      vehicleType: ride.vehicleType,
      estimatedDuration: ride.duration,
      expiresAt: Date.now() + 30000 // 30 seconds
    };
    
    // Send real-time notification to driver
    await notificationService.sendNotification(driverId, {
      type: 'ride_offer',
      title: '🚖 New Ride Request',
      message: `New ride from ${pickup.address}`,
      data: offerData
    });
    
    // Set timeout to auto-decline if no response
    setTimeout(async () => {
      try {
        const pendingOffer = await redis.get(`dispatch:pending:${rideId}`);
        if (pendingOffer === driverId) {
          // Driver didn't respond, try next driver
          await redis.del(`dispatch:pending:${rideId}`);
          await offerToNextDriver(rideId);
        }
      } catch (error) {
        console.error('Error handling driver timeout:', error);
      }
    }, 30000);
    
    console.log(`Ride ${rideId} offered to driver ${driverId}`);
    return { success: true, driverId };
  } catch (error) {
    console.error('Error offering to next driver:', error);
    return { success: false, message: 'Failed to offer ride' };
  }
}

// Handle driver response to ride offer
export async function handleDriverResponse(rideId, driverId, accepted) {
  try {
    const redis = getRedis();
    const pendingKey = `dispatch:pending:${rideId}`;
    
    // Verify this driver has a pending offer
    const pendingDriverId = await redis.get(pendingKey);
    if (pendingDriverId !== driverId) {
      return { success: false, message: 'No pending offer for this driver' };
    }
    
    // Clear pending offer
    await redis.del(pendingKey);
    
    if (accepted) {
      // Driver accepted - assign ride
      const success = await assignDriverToRide(rideId, driverId);
      
      if (success) {
        // Update ride in database
        const ride = await Ride.findByIdAndUpdate(rideId, {
          driverId,
          status: 'driver_assigned',
          assignedAt: new Date()
        }, { new: true });
        
        // Clear dispatch queue (no longer needed)
        await redis.del(`dispatch:queue:${rideId}`);
        await redis.del(`dispatch:info:${rideId}`);
        
        // Notify customer about driver assignment
        await notificationService.sendNotification(ride.customerId, {
          type: 'driver_assigned',
          title: '🚗 Driver Assigned',
          message: 'Your driver is on the way!',
          rideId: rideId.toString(),
          data: {
            driver: {
              name: 'Driver', // Would get from driver profile
              phone: '+91XXXXXXXXXX', // Would get from driver profile
              vehicleNumber: 'DL 01 AB 1234', // Would get from driver profile
              vehicleModel: 'Swift Dzire', // Would get from driver profile
              rating: 4.8
            },
            estimatedArrival: 5 // minutes
          }
        });
        
        console.log(`Ride ${rideId} assigned to driver ${driverId}`);
        return { success: true, rideStatus: 'driver_assigned' };
      } else {
        // Assignment failed, try next driver
        await offerToNextDriver(rideId);
        return { success: false, message: 'Failed to assign driver' };
      }
    } else {
      // Driver declined - try next driver
      console.log(`Driver ${driverId} declined ride ${rideId}`);
      await offerToNextDriver(rideId);
      return { success: true, message: 'Driver declined, trying next driver' };
    }
  } catch (error) {
    console.error('Error handling driver response:', error);
    return { success: false, message: 'Failed to process response' };
  }
}

// Handle when no drivers are available
async function handleNoDriversAvailable(rideId) {
  try {
    const redis = getRedis();
    
    // Update ride status
    await Ride.findByIdAndUpdate(rideId, {
      status: 'no_drivers_available',
      noDriversAt: new Date()
    });
    
    // Clean up Redis keys
    await redis.del(`dispatch:queue:${rideId}`);
    await redis.del(`dispatch:info:${rideId}`);
    await redis.del(`dispatch:pending:${rideId}`);
    
    // Notify customer
    const ride = await Ride.findById(rideId);
    if (ride) {
      await notificationService.sendNotification(ride.customerId, {
        type: 'no_drivers_available',
        title: '❌ No Drivers Available',
        message: 'No drivers available at the moment. Please try again later.',
        rideId: rideId.toString()
      });
    }
    
    console.log(`No drivers available for ride ${rideId}`);
  } catch (error) {
    console.error('Error handling no drivers available:', error);
  }
}

// Get current dispatch status
export async function getDispatchStatus(rideId) {
  try {
    const redis = getRedis();
    
    const dispatchInfo = await redis.get(`dispatch:info:${rideId}`);
    const pendingOffer = await redis.get(`dispatch:pending:${rideId}`);
    const queueLength = await redis.llen(`dispatch:queue:${rideId}`);
    
    return {
      dispatchInfo: dispatchInfo ? JSON.parse(dispatchInfo) : null,
      pendingDriverId: pendingOffer,
      remainingDrivers: queueLength,
      isActive: !!(dispatchInfo || pendingOffer)
    };
  } catch (error) {
    console.error('Error getting dispatch status:', error);
    return null;
  }
}

// Cancel dispatch (when customer cancels ride)
export async function cancelDispatch(rideId) {
  try {
    const redis = getRedis();
    
    // Get pending driver if any
    const pendingDriverId = await redis.get(`dispatch:pending:${rideId}`);
    
    if (pendingDriverId) {
      // Notify driver that ride was cancelled
      await notifyDriver(pendingDriverId, 'ride_cancelled', {
        rideId: rideId.toString(),
        message: 'Ride was cancelled by customer'
      });
    }
    
    // Clean up all dispatch-related keys
    await redis.del(`dispatch:queue:${rideId}`);
    await redis.del(`dispatch:info:${rideId}`);
    await redis.del(`dispatch:pending:${rideId}`);
    
    console.log(`Dispatch cancelled for ride ${rideId}`);
    return { success: true };
  } catch (error) {
    console.error('Error cancelling dispatch:', error);
    return { success: false, message: 'Failed to cancel dispatch' };
  }
}

// Get dispatch statistics
export async function getDispatchStats() {
  try {
    const redis = getRedis();
    
    // Get all active dispatches
    const dispatchKeys = await redis.keys('dispatch:info:*');
    const pendingKeys = await redis.keys('dispatch:pending:*');
    
    const stats = {
      activeDispatches: dispatchKeys.length,
      pendingOffers: pendingKeys.length,
      totalQueued: 0
    };
    
    // Count total queued drivers
    for (const key of dispatchKeys) {
      const rideId = key.split(':')[2];
      const queueLength = await redis.llen(`dispatch:queue:${rideId}`);
      stats.totalQueued += queueLength;
    }
    
    return stats;
  } catch (error) {
    console.error('Error getting dispatch stats:', error);
    return null;
  }
}
