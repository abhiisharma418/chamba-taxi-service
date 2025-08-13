import { Server } from 'socket.io';
import { User } from '../models/userModel.js';
import { Ride } from '../models/rideModel.js';

class NotificationService {
  constructor() {
    this.io = null;
    this.connectedUsers = new Map();
  }

  initialize(server) {
    this.io = new Server(server, {
      cors: {
        origin: process.env.FRONTEND_URL || "http://localhost:3000",
        methods: ["GET", "POST"],
        credentials: true
      }
    });

    this.io.on('connection', (socket) => {
      console.log('User connected:', socket.id);

      // User authentication and registration
      socket.on('authenticate', (userData) => {
        if (userData && userData.userId) {
          this.connectedUsers.set(userData.userId, socket.id);
          socket.userId = userData.userId;
          socket.userType = userData.userType;
          
          console.log(`User ${userData.userId} (${userData.userType}) authenticated`);
          
          // Send welcome notification
          this.sendNotification(userData.userId, {
            type: 'system',
            title: 'Connected',
            message: 'You are now connected to real-time notifications',
            timestamp: new Date()
          });
        }
      });

      // Handle disconnection
      socket.on('disconnect', () => {
        if (socket.userId) {
          this.connectedUsers.delete(socket.userId);
          console.log(`User ${socket.userId} disconnected`);
        }
      });

      // Handle notification acknowledgment
      socket.on('notification_received', (notificationId) => {
        console.log(`Notification ${notificationId} acknowledged by user ${socket.userId}`);
      });

      // Handle chat events
      socket.on('join_chat', (rideId) => {
        socket.join(`chat_${rideId}`);
        console.log(`User ${socket.userId} joined chat for ride ${rideId}`);
      });

      socket.on('leave_chat', (rideId) => {
        socket.leave(`chat_${rideId}`);
        console.log(`User ${socket.userId} left chat for ride ${rideId}`);
      });

      socket.on('typing', (data) => {
        socket.to(`chat_${data.rideId}`).emit('user_typing', {
          userId: socket.userId,
          userType: socket.userType,
          isTyping: data.isTyping
        });
      });
    });
  }

  // Send notification to specific user
  sendNotification(userId, notification) {
    const socketId = this.connectedUsers.get(userId);
    if (socketId && this.io) {
      const notificationWithId = {
        id: `notif_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        ...notification,
        timestamp: notification.timestamp || new Date()
      };

      this.io.to(socketId).emit('notification', notificationWithId);
      console.log(`Notification sent to user ${userId}:`, notificationWithId.title);
      return true;
    }
    console.log(`User ${userId} not connected, notification queued`);
    return false;
  }

  // Send notification to multiple users
  sendBulkNotification(userIds, notification) {
    let sentCount = 0;
    userIds.forEach(userId => {
      if (this.sendNotification(userId, notification)) {
        sentCount++;
      }
    });
    return sentCount;
  }

  // Ride-related notifications
  async notifyRideUpdate(rideId, updateType, additionalData = {}) {
    try {
      const ride = await Ride.findById(rideId)
        .populate('customerId', 'name phone')
        .populate('driverId', 'name phone vehicle');

      if (!ride) {
        console.error('Ride not found:', rideId);
        return;
      }

      let notification = {
        type: 'ride_update',
        rideId: rideId,
        ...additionalData
      };

      switch (updateType) {
        case 'driver_assigned':
          notification = {
            ...notification,
            title: '🚗 Driver Assigned',
            message: `${ride.driverId?.name} is your driver. Vehicle: ${ride.driverId?.vehicle?.make} ${ride.driverId?.vehicle?.model}`,
            action: 'track_driver'
          };
          this.sendNotification(ride.customerId._id, notification);
          break;

        case 'driver_arriving':
          notification = {
            ...notification,
            title: '📍 Driver Arriving',
            message: `Your driver is ${additionalData.eta || '2-3'} minutes away`,
            action: 'prepare_pickup'
          };
          this.sendNotification(ride.customerId._id, notification);
          break;

        case 'ride_started':
          notification = {
            ...notification,
            title: '🚀 Ride Started',
            message: 'Your ride has begun. Enjoy your journey!',
            action: 'track_ride'
          };
          this.sendNotification(ride.customerId._id, notification);
          break;

        case 'ride_completed':
          notification = {
            ...notification,
            title: '✅ Ride Completed',
            message: `Trip completed. Fare: ₹${ride.fare?.actual || ride.fare?.estimated}`,
            action: 'rate_driver'
          };
          this.sendNotification(ride.customerId._id, notification);
          break;

        case 'payment_processed':
          notification = {
            ...notification,
            title: '💳 Payment Processed',
            message: `Payment of ₹${additionalData.amount} completed successfully`,
            action: 'view_receipt'
          };
          this.sendNotification(ride.customerId._id, notification);
          break;

        case 'new_ride_request':
          notification = {
            ...notification,
            title: '🔔 New Ride Request',
            message: `Pickup from ${ride.pickup?.address || 'location'} to ${ride.destination?.address || 'destination'}`,
            action: 'accept_ride'
          };
          this.sendNotification(ride.driverId, notification);
          break;
      }

    } catch (error) {
      console.error('Error sending ride notification:', error);
    }
  }

  // System notifications
  async sendSystemNotification(userIds, title, message, type = 'system') {
    const notification = {
      type,
      title,
      message,
      timestamp: new Date()
    };

    if (Array.isArray(userIds)) {
      return this.sendBulkNotification(userIds, notification);
    } else {
      return this.sendNotification(userIds, notification);
    }
  }

  // Emergency notifications
  async sendEmergencyAlert(rideId, alertType) {
    try {
      const ride = await Ride.findById(rideId)
        .populate('customerId driverId');

      const emergency = {
        type: 'emergency',
        priority: 'high',
        title: '🚨 Emergency Alert',
        rideId: rideId
      };

      switch (alertType) {
        case 'panic_button':
          emergency.message = 'Panic button activated. Emergency services notified.';
          break;
        case 'route_deviation':
          emergency.message = 'Route deviation detected. Monitoring situation.';
          break;
        case 'vehicle_breakdown':
          emergency.message = 'Vehicle breakdown reported. Assistance on the way.';
          break;
      }

      // Notify customer and driver
      if (ride.customerId) {
        this.sendNotification(ride.customerId._id, emergency);
      }
      if (ride.driverId) {
        this.sendNotification(ride.driverId._id, emergency);
      }

      // Notify admin users
      const adminUsers = await User.find({ role: 'admin' });
      adminUsers.forEach(admin => {
        this.sendNotification(admin._id, {
          ...emergency,
          title: '🚨 Admin Alert',
          message: `Emergency in ride ${rideId}: ${emergency.message}`
        });
      });

    } catch (error) {
      console.error('Error sending emergency alert:', error);
    }
  }

  // Chat message notifications
  sendChatMessage(userId, chatData) {
    const socketId = this.connectedUsers.get(userId);
    if (socketId && this.io) {
      // Send to specific chat room
      this.io.to(`chat_${chatData.rideId}`).emit('new_message', chatData.chatMessage);

      // Send notification if user is not in chat room
      this.sendNotification(userId, {
        type: 'chat_message',
        title: `New message from ${chatData.senderName}`,
        message: chatData.chatMessage.message.text,
        rideId: chatData.rideId,
        data: {
          senderType: chatData.senderType,
          messageId: chatData.chatMessage._id
        }
      });

      return true;
    }
    return false;
  }

  // Check if user is online
  isUserOnline(userId) {
    return this.connectedUsers.has(userId);
  }

  // Get all connected users
  getConnectedUsers() {
    return Array.from(this.connectedUsers.keys());
  }

  // Send typing indicator
  sendTypingIndicator(rideId, userId, userType, isTyping) {
    if (this.io) {
      this.io.to(`chat_${rideId}`).emit('user_typing', {
        userId,
        userType,
        isTyping
      });
    }
  }

  // Promotional notifications
  async sendPromotionalNotification(userIds, promotion) {
    const notification = {
      type: 'promotion',
      title: `🎉 ${promotion.title}`,
      message: promotion.description,
      action: 'view_offer',
      data: {
        promoCode: promotion.code,
        discount: promotion.discount,
        validUntil: promotion.validUntil
      }
    };

    return this.sendBulkNotification(userIds, notification);
  }

  // Get connected users count
  getConnectedUsersCount() {
    return this.connectedUsers.size;
  }

  // Get connected users by type
  getConnectedUsersByType(userType) {
    const users = [];
    this.io.sockets.sockets.forEach(socket => {
      if (socket.userType === userType) {
        users.push({
          userId: socket.userId,
          socketId: socket.id,
          userType: socket.userType
        });
      }
    });
    return users;
  }
}

// Create singleton instance
const notificationService = new NotificationService();

export default notificationService;
