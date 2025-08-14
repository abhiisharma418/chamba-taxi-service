import ScheduledRide from '../models/scheduledRideModel.js';
// import User from '../models/userModel.js';
// import Booking from '../models/bookingModel.js';
import { validationResult } from 'express-validator';
import notificationService from '../services/notificationService.js';

class ScheduledRideController {
  async createScheduledRide(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: 'Validation failed',
          errors: errors.array()
        });
      }

      const customerId = req.user.id;
      const {
        vehicleType,
        pickupLocation,
        destinationLocation,
        scheduledDateTime,
        recurrence,
        paymentMethod,
        promoCode,
        specialRequests,
        passengerCount,
        customerNotes,
        priority,
        autoAssignment
      } = req.body;

      // Validate scheduled time is at least 30 minutes in the future
      const minScheduleTime = new Date(Date.now() + 30 * 60 * 1000);
      if (new Date(scheduledDateTime) < minScheduleTime) {
        return res.status(400).json({
          success: false,
          message: 'Scheduled rides must be at least 30 minutes in advance'
        });
      }

      // Check for conflicting scheduled rides
      const existingRide = await ScheduledRide.findOne({
        customerId,
        scheduledDateTime: {
          $gte: new Date(scheduledDateTime).getTime() - 15 * 60 * 1000,
          $lte: new Date(scheduledDateTime).getTime() + 15 * 60 * 1000
        },
        status: { $in: ['scheduled', 'confirmed', 'driver_assigned'] }
      });

      if (existingRide) {
        return res.status(400).json({
          success: false,
          message: 'You already have a ride scheduled within 15 minutes of this time'
        });
      }

      // Calculate fare estimate
      const fareEstimate = await this.calculateFareEstimate(
        pickupLocation,
        destinationLocation,
        vehicleType,
        scheduledDateTime
      );

      // Apply promo code discount if provided
      if (promoCode) {
        const discount = await this.applyPromoCode(promoCode, fareEstimate.totalEstimate, customerId);
        if (discount.success) {
          fareEstimate.totalEstimate -= discount.discountAmount;
        }
      }

      const scheduledRide = new ScheduledRide({
        customerId,
        vehicleType,
        pickupLocation,
        destinationLocation,
        scheduledDateTime: new Date(scheduledDateTime),
        recurrence: recurrence || { type: 'none' },
        fareEstimate,
        paymentMethod,
        promoCode,
        specialRequests: specialRequests || [],
        passengerCount: passengerCount || 1,
        customerNotes,
        priority: priority || 'normal',
        autoAssignment: autoAssignment || { enabled: true },
        estimatedDistance: fareEstimate.distance,
        estimatedDuration: fareEstimate.duration
      });

      await scheduledRide.save();

      // Send confirmation notification
      await notificationService.sendToUser(customerId, {
        type: 'ride_scheduled',
        title: 'Ride Scheduled Successfully',
        message: `Your ride is scheduled for ${new Date(scheduledDateTime).toLocaleString()}`,
        data: {
          rideId: scheduledRide.rideId,
          scheduledDateTime,
          pickup: pickupLocation.address,
          destination: destinationLocation.address
        }
      });

      // Schedule reminder notification
      this.scheduleReminderNotification(scheduledRide);

      res.status(201).json({
        success: true,
        message: 'Ride scheduled successfully',
        data: {
          rideId: scheduledRide.rideId,
          scheduledDateTime: scheduledRide.scheduledDateTime,
          fareEstimate: scheduledRide.fareEstimate,
          status: scheduledRide.status,
          nextExecutions: scheduledRide.getNextExecutionDates()
        }
      });

    } catch (error) {
      console.error('Error creating scheduled ride:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to schedule ride',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }

  async getScheduledRides(req, res) {
    try {
      const customerId = req.user.id;
      const { status, page = 1, limit = 10, upcoming = false } = req.query;

      const query = { customerId };
      
      if (status && status !== 'all') {
        query.status = status;
      }

      if (upcoming === 'true') {
        query.scheduledDateTime = { $gte: new Date() };
        query.status = { $in: ['scheduled', 'confirmed', 'driver_assigned'] };
      }

      const rides = await ScheduledRide.find(query)
        .populate('driverId', 'name phoneNumber rating profilePicture')
        .populate('actualRideId', 'status actualFare')
        .sort({ scheduledDateTime: upcoming === 'true' ? 1 : -1 })
        .limit(limit * 1)
        .skip((page - 1) * limit);

      const total = await ScheduledRide.countDocuments(query);

      res.json({
        success: true,
        data: {
          rides,
          pagination: {
            currentPage: parseInt(page),
            totalPages: Math.ceil(total / limit),
            totalRides: total,
            hasNext: page < Math.ceil(total / limit),
            hasPrev: page > 1
          }
        }
      });

    } catch (error) {
      console.error('Error fetching scheduled rides:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch scheduled rides'
      });
    }
  }

  async getScheduledRide(req, res) {
    try {
      const { rideId } = req.params;
      const customerId = req.user.id;

      const ride = await ScheduledRide.findOne({ rideId })
        .populate('customerId', 'name email phoneNumber')
        .populate('driverId', 'name phoneNumber rating profilePicture vehicleInfo')
        .populate('actualRideId');

      if (!ride) {
        return res.status(404).json({
          success: false,
          message: 'Scheduled ride not found'
        });
      }

      // Check access permissions
      if (ride.customerId._id.toString() !== customerId && 
          (!ride.driverId || ride.driverId._id.toString() !== customerId) &&
          req.user.role !== 'admin') {
        return res.status(403).json({
          success: false,
          message: 'Access denied'
        });
      }

      res.json({
        success: true,
        data: {
          ...ride.toObject(),
          nextExecutions: ride.getNextExecutionDates(),
          canCancel: ride.canBeCancelled(),
          cancellationFee: ride.getCancellationFee(),
          isExecutionTime: ride.isExecutionTime()
        }
      });

    } catch (error) {
      console.error('Error fetching scheduled ride:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch scheduled ride details'
      });
    }
  }

  async updateScheduledRide(req, res) {
    try {
      const { rideId } = req.params;
      const customerId = req.user.id;
      const updates = req.body;

      const ride = await ScheduledRide.findOne({ rideId, customerId });

      if (!ride) {
        return res.status(404).json({
          success: false,
          message: 'Scheduled ride not found'
        });
      }

      if (!ride.canBeCancelled()) {
        return res.status(400).json({
          success: false,
          message: 'This ride cannot be modified'
        });
      }

      // Validate new scheduled time if being updated
      if (updates.scheduledDateTime) {
        const minScheduleTime = new Date(Date.now() + 30 * 60 * 1000);
        if (new Date(updates.scheduledDateTime) < minScheduleTime) {
          return res.status(400).json({
            success: false,
            message: 'Scheduled rides must be at least 30 minutes in advance'
          });
        }
      }

      // Recalculate fare if locations or vehicle type changed
      if (updates.pickupLocation || updates.destinationLocation || updates.vehicleType) {
        const fareEstimate = await this.calculateFareEstimate(
          updates.pickupLocation || ride.pickupLocation,
          updates.destinationLocation || ride.destinationLocation,
          updates.vehicleType || ride.vehicleType,
          updates.scheduledDateTime || ride.scheduledDateTime
        );
        updates.fareEstimate = fareEstimate;
        updates.estimatedDistance = fareEstimate.distance;
        updates.estimatedDuration = fareEstimate.duration;
      }

      Object.assign(ride, updates);
      await ride.save();

      // Send update notification
      await notificationService.sendToUser(customerId, {
        type: 'ride_updated',
        title: 'Scheduled Ride Updated',
        message: `Your scheduled ride for ${ride.scheduledDateTime.toLocaleString()} has been updated`,
        data: {
          rideId: ride.rideId,
          scheduledDateTime: ride.scheduledDateTime
        }
      });

      res.json({
        success: true,
        message: 'Scheduled ride updated successfully',
        data: ride
      });

    } catch (error) {
      console.error('Error updating scheduled ride:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to update scheduled ride'
      });
    }
  }

  async cancelScheduledRide(req, res) {
    try {
      const { rideId } = req.params;
      const customerId = req.user.id;
      const { reason } = req.body;

      const ride = await ScheduledRide.findOne({ rideId, customerId });

      if (!ride) {
        return res.status(404).json({
          success: false,
          message: 'Scheduled ride not found'
        });
      }

      if (!ride.canBeCancelled()) {
        return res.status(400).json({
          success: false,
          message: 'This ride cannot be cancelled'
        });
      }

      const cancellationFee = ride.getCancellationFee();
      
      ride.status = 'cancelled';
      ride.adminNotes = `Cancelled by customer. Reason: ${reason || 'No reason provided'}. Fee: $${cancellationFee}`;
      
      await ride.save();

      // Process cancellation fee if applicable
      if (cancellationFee > 0) {
        // Implement payment processing for cancellation fee
        await this.processCancellationFee(customerId, cancellationFee, ride.paymentMethod);
      }

      // Notify driver if assigned
      if (ride.driverId) {
        await notificationService.sendToUser(ride.driverId, {
          type: 'ride_cancelled',
          title: 'Scheduled Ride Cancelled',
          message: `The scheduled ride for ${ride.scheduledDateTime.toLocaleString()} has been cancelled`,
          data: {
            rideId: ride.rideId,
            reason: reason || 'No reason provided'
          }
        });
      }

      res.json({
        success: true,
        message: 'Scheduled ride cancelled successfully',
        data: {
          rideId: ride.rideId,
          cancellationFee,
          status: ride.status
        }
      });

    } catch (error) {
      console.error('Error cancelling scheduled ride:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to cancel scheduled ride'
      });
    }
  }

  async assignDriver(req, res) {
    try {
      const { rideId } = req.params;
      const { driverId } = req.body;

      const ride = await ScheduledRide.findOne({ rideId });

      if (!ride) {
        return res.status(404).json({
          success: false,
          message: 'Scheduled ride not found'
        });
      }

      const driver = await User.findById(driverId);
      if (!driver || driver.role !== 'driver') {
        return res.status(400).json({
          success: false,
          message: 'Invalid driver selected'
        });
      }

      // Check driver availability
      const conflictingRide = await ScheduledRide.findOne({
        driverId,
        scheduledDateTime: {
          $gte: new Date(ride.scheduledDateTime.getTime() - 60 * 60 * 1000),
          $lte: new Date(ride.scheduledDateTime.getTime() + 60 * 60 * 1000)
        },
        status: { $in: ['confirmed', 'driver_assigned'] }
      });

      if (conflictingRide) {
        return res.status(400).json({
          success: false,
          message: 'Driver is not available at this time'
        });
      }

      ride.driverId = driverId;
      ride.status = 'driver_assigned';
      ride.notifications.driverAssignedNotified = true;
      
      await ride.save();

      // Notify customer
      await notificationService.sendToUser(ride.customerId, {
        type: 'driver_assigned',
        title: 'Driver Assigned',
        message: `${driver.name} has been assigned to your scheduled ride`,
        data: {
          rideId: ride.rideId,
          driverName: driver.name,
          driverPhone: driver.phoneNumber,
          scheduledDateTime: ride.scheduledDateTime
        }
      });

      // Notify driver
      await notificationService.sendToUser(driverId, {
        type: 'ride_assigned',
        title: 'New Scheduled Ride Assigned',
        message: `You have been assigned a scheduled ride for ${ride.scheduledDateTime.toLocaleString()}`,
        data: {
          rideId: ride.rideId,
          pickup: ride.pickupLocation.address,
          destination: ride.destinationLocation.address,
          scheduledDateTime: ride.scheduledDateTime
        }
      });

      res.json({
        success: true,
        message: 'Driver assigned successfully',
        data: {
          rideId: ride.rideId,
          driverId,
          driverName: driver.name,
          status: ride.status
        }
      });

    } catch (error) {
      console.error('Error assigning driver:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to assign driver'
      });
    }
  }

  async executeScheduledRide(req, res) {
    try {
      const { rideId } = req.params;

      const scheduledRide = await ScheduledRide.findOne({ rideId })
        .populate('customerId')
        .populate('driverId');

      if (!scheduledRide) {
        return res.status(404).json({
          success: false,
          message: 'Scheduled ride not found'
        });
      }

      if (!scheduledRide.isExecutionTime()) {
        return res.status(400).json({
          success: false,
          message: 'It is not time to execute this scheduled ride'
        });
      }

      // Create actual booking
      const booking = new Booking({
        customerId: scheduledRide.customerId._id,
        driverId: scheduledRide.driverId?._id,
        vehicleType: scheduledRide.vehicleType,
        pickupLocation: scheduledRide.pickupLocation,
        destinationLocation: scheduledRide.destinationLocation,
        paymentMethod: scheduledRide.paymentMethod,
        specialRequests: scheduledRide.specialRequests,
        passengerCount: scheduledRide.passengerCount,
        customerNotes: scheduledRide.customerNotes,
        fareEstimate: scheduledRide.fareEstimate,
        scheduledRideId: scheduledRide._id,
        status: scheduledRide.driverId ? 'driver_assigned' : 'pending'
      });

      await booking.save();

      // Update scheduled ride
      scheduledRide.actualRideId = booking._id;
      scheduledRide.status = 'started';
      await scheduledRide.addExecutionAttempt('completed', scheduledRide.driverId);

      // Handle recurring rides
      if (scheduledRide.recurrence.type !== 'none') {
        await this.createNextRecurringRide(scheduledRide);
      }

      res.json({
        success: true,
        message: 'Scheduled ride executed successfully',
        data: {
          scheduledRideId: scheduledRide.rideId,
          actualRideId: booking.rideId,
          status: booking.status
        }
      });

    } catch (error) {
      console.error('Error executing scheduled ride:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to execute scheduled ride'
      });
    }
  }

  async getDriverSchedule(req, res) {
    try {
      const driverId = req.user.id;
      const { date, week, month } = req.query;

      let startDate, endDate;

      if (date) {
        startDate = new Date(date);
        endDate = new Date(startDate.getTime() + 24 * 60 * 60 * 1000);
      } else if (week) {
        startDate = new Date(week);
        endDate = new Date(startDate.getTime() + 7 * 24 * 60 * 60 * 1000);
      } else if (month) {
        startDate = new Date(month);
        endDate = new Date(startDate.getFullYear(), startDate.getMonth() + 1, 1);
      } else {
        // Default to next 7 days
        startDate = new Date();
        endDate = new Date(startDate.getTime() + 7 * 24 * 60 * 60 * 1000);
      }

      const schedule = await ScheduledRide.getDriverSchedule(driverId, startDate, endDate);

      res.json({
        success: true,
        data: {
          schedule,
          period: { startDate, endDate },
          totalRides: schedule.length
        }
      });

    } catch (error) {
      console.error('Error fetching driver schedule:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch driver schedule'
      });
    }
  }

  // Helper methods
  async calculateFareEstimate(pickupLocation, destinationLocation, vehicleType, scheduledDateTime) {
    // Implement fare calculation logic
    const distance = this.calculateDistance(pickupLocation.coordinates, destinationLocation.coordinates);
    const duration = distance * 2; // Rough estimate: 2 minutes per km
    
    const baseRates = {
      car: { base: 5, perKm: 1.5, perMin: 0.25 },
      bike: { base: 3, perKm: 1, perMin: 0.2 },
      premium: { base: 10, perKm: 2.5, perMin: 0.5 },
      xl: { base: 8, perKm: 2, perMin: 0.4 }
    };

    const rates = baseRates[vehicleType] || baseRates.car;
    
    // Add surge pricing for peak hours and scheduled rides
    const hour = new Date(scheduledDateTime).getHours();
    const isPeakHour = (hour >= 7 && hour <= 9) || (hour >= 17 && hour <= 19);
    const surgeFactor = isPeakHour ? 1.5 : 1.2; // 20% surcharge for scheduled rides

    const baseFare = rates.base * surgeFactor;
    const distanceFare = distance * rates.perKm * surgeFactor;
    const timeFare = duration * rates.perMin * surgeFactor;
    const totalEstimate = baseFare + distanceFare + timeFare;

    return {
      baseFare: Math.round(baseFare * 100) / 100,
      distanceFare: Math.round(distanceFare * 100) / 100,
      timeFare: Math.round(timeFare * 100) / 100,
      totalEstimate: Math.round(totalEstimate * 100) / 100,
      distance: Math.round(distance * 100) / 100,
      duration: Math.round(duration),
      surgeFactor,
      currency: 'USD'
    };
  }

  calculateDistance(coord1, coord2) {
    const R = 6371; // Earth's radius in km
    const dLat = (coord2.latitude - coord1.latitude) * Math.PI / 180;
    const dLon = (coord2.longitude - coord1.longitude) * Math.PI / 180;
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
              Math.cos(coord1.latitude * Math.PI / 180) * Math.cos(coord2.latitude * Math.PI / 180) *
              Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  }

  async applyPromoCode(promoCode, fareAmount, customerId) {
    // Implement promo code logic - integrate with existing promo code service
    return { success: false, discountAmount: 0 };
  }

  async processCancellationFee(customerId, amount, paymentMethod) {
    // Implement payment processing for cancellation fees
    console.log(`Processing cancellation fee of $${amount} for customer ${customerId}`);
  }

  async scheduleReminderNotification(scheduledRide) {
    // Implement reminder scheduling - could use a job queue like Bull or node-cron
    console.log(`Scheduling reminder for ride ${scheduledRide.rideId} at ${scheduledRide.notifications.reminderTime}`);
  }

  async createNextRecurringRide(originalRide) {
    const nextDates = originalRide.getNextExecutionDates(1);
    if (nextDates.length > 1) {
      const nextDate = nextDates[1];
      
      const newRide = new ScheduledRide({
        ...originalRide.toObject(),
        _id: undefined,
        rideId: undefined,
        scheduledDateTime: nextDate,
        status: 'scheduled',
        actualRideId: undefined,
        executionAttempts: [],
        notifications: {
          reminderSent: false,
          confirmationSent: false,
          driverAssignedNotified: false
        }
      });
      
      await newRide.save();
    }
  }
}

export default new ScheduledRideController();
