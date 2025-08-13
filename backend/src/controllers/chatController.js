import { ChatMessage } from '../models/chatModel.js';
import { Ride } from '../models/rideModel.js';
import { User } from '../models/userModel.js';
import { DriverProfile } from '../models/driverProfileModel.js';
import { NotificationService } from '../services/notificationService.js';

export class ChatController {
  // Send a message
  static async sendMessage(req, res) {
    try {
      const { rideId, receiverId, message, messageType = 'text', metadata } = req.body;
      const senderId = req.user.id;
      const senderType = req.user.role || 'customer';

      // Validate ride exists and user is part of it
      const ride = await Ride.findById(rideId).populate('customer driver');
      if (!ride) {
        return res.status(404).json({
          success: false,
          message: 'Ride not found'
        });
      }

      // Check if user is authorized to send messages for this ride
      const isCustomer = ride.customer._id.toString() === senderId;
      const isDriver = ride.driver && ride.driver._id.toString() === senderId;
      
      if (!isCustomer && !isDriver) {
        return res.status(403).json({
          success: false,
          message: 'Unauthorized to send messages for this ride'
        });
      }

      // Determine receiver info
      let receiverInfo;
      if (isCustomer) {
        // Customer sending to driver
        receiverInfo = {
          id: ride.driver._id,
          type: 'driver',
          name: ride.driver.name
        };
      } else {
        // Driver sending to customer
        receiverInfo = {
          id: ride.customer._id,
          type: 'customer',
          name: ride.customer.name
        };
      }

      // Get sender info
      const senderInfo = {
        id: senderId,
        type: senderType,
        name: isCustomer ? ride.customer.name : ride.driver.name
      };

      // Create chat message
      const chatMessage = new ChatMessage({
        rideId,
        sender: senderInfo,
        receiver: receiverInfo,
        message: {
          text: message,
          type: messageType,
          metadata
        }
      });

      await chatMessage.save();

      // Send real-time notification to receiver
      const notificationService = req.app.get('notificationService');
      if (notificationService) {
        notificationService.sendChatMessage(receiverInfo.id, {
          chatMessage: chatMessage.toObject(),
          rideId,
          senderName: senderInfo.name,
          senderType: senderInfo.type
        });
      }

      // Mark as delivered if receiver is online
      if (notificationService && notificationService.isUserOnline(receiverInfo.id)) {
        await chatMessage.markAsDelivered();
      }

      res.status(201).json({
        success: true,
        data: chatMessage,
        message: 'Message sent successfully'
      });

    } catch (error) {
      console.error('Error sending message:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to send message',
        error: error.message
      });
    }
  }

  // Get chat messages for a ride
  static async getChatMessages(req, res) {
    try {
      const { rideId } = req.params;
      const { page = 1, limit = 50 } = req.query;
      const userId = req.user.id;

      // Validate ride exists and user is part of it
      const ride = await Ride.findById(rideId);
      if (!ride) {
        return res.status(404).json({
          success: false,
          message: 'Ride not found'
        });
      }

      // Check authorization
      const isCustomer = ride.customer.toString() === userId;
      const isDriver = ride.driver && ride.driver.toString() === userId;
      
      if (!isCustomer && !isDriver) {
        return res.status(403).json({
          success: false,
          message: 'Unauthorized to view messages for this ride'
        });
      }

      // Get messages with pagination
      const skip = (page - 1) * limit;
      const messages = await ChatMessage.find({ rideId })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit))
        .lean();

      // Reverse to show oldest first
      messages.reverse();

      // Mark unread messages as read
      await ChatMessage.updateMany({
        rideId,
        'receiver.id': userId,
        status: { $ne: 'read' }
      }, {
        status: 'read',
        readAt: new Date()
      });

      // Get total count for pagination
      const totalMessages = await ChatMessage.countDocuments({ rideId });

      res.json({
        success: true,
        data: {
          messages,
          pagination: {
            page: parseInt(page),
            limit: parseInt(limit),
            total: totalMessages,
            pages: Math.ceil(totalMessages / limit)
          }
        }
      });

    } catch (error) {
      console.error('Error fetching messages:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch messages',
        error: error.message
      });
    }
  }

  // Send quick reply message
  static async sendQuickReply(req, res) {
    try {
      const { rideId, quickReplyType, customMessage } = req.body;
      const senderId = req.user.id;
      const senderType = req.user.role || 'customer';

      const quickReplyTemplates = {
        'eta_request': "What's your ETA?",
        'pickup_confirmation': "I'm here for pickup",
        'destination_reached': "We've reached the destination",
        'custom': customMessage
      };

      const message = quickReplyTemplates[quickReplyType] || customMessage;

      // Use the regular sendMessage functionality
      req.body = {
        rideId,
        message,
        messageType: 'quick_reply',
        metadata: { quickReplyType }
      };

      return ChatController.sendMessage(req, res);

    } catch (error) {
      console.error('Error sending quick reply:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to send quick reply',
        error: error.message
      });
    }
  }

  // Mark messages as read
  static async markAsRead(req, res) {
    try {
      const { rideId } = req.params;
      const { messageIds } = req.body;
      const userId = req.user.id;

      let query = {
        rideId,
        'receiver.id': userId,
        status: { $ne: 'read' }
      };

      if (messageIds && messageIds.length > 0) {
        query._id = { $in: messageIds };
      }

      const result = await ChatMessage.updateMany(query, {
        status: 'read',
        readAt: new Date()
      });

      res.json({
        success: true,
        data: {
          modifiedCount: result.modifiedCount
        },
        message: 'Messages marked as read'
      });

    } catch (error) {
      console.error('Error marking messages as read:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to mark messages as read',
        error: error.message
      });
    }
  }

  // Get unread message count
  static async getUnreadCount(req, res) {
    try {
      const { rideId } = req.params;
      const userId = req.user.id;

      const unreadCount = await ChatMessage.countDocuments({
        rideId,
        'receiver.id': userId,
        status: { $ne: 'read' }
      });

      res.json({
        success: true,
        data: { unreadCount }
      });

    } catch (error) {
      console.error('Error getting unread count:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get unread count',
        error: error.message
      });
    }
  }

  // Send location message
  static async sendLocation(req, res) {
    try {
      const { rideId, latitude, longitude, address } = req.body;

      req.body = {
        rideId,
        message: `📍 Location shared: ${address || 'Current location'}`,
        messageType: 'location',
        metadata: {
          location: { latitude, longitude, address }
        }
      };

      return ChatController.sendMessage(req, res);

    } catch (error) {
      console.error('Error sending location:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to send location',
        error: error.message
      });
    }
  }

  // Get chat statistics for admin
  static async getChatStats(req, res) {
    try {
      const { startDate, endDate } = req.query;
      
      let dateFilter = {};
      if (startDate && endDate) {
        dateFilter.createdAt = {
          $gte: new Date(startDate),
          $lte: new Date(endDate)
        };
      }

      const [
        totalMessages,
        messagesByType,
        averageResponseTime,
        activeChats
      ] = await Promise.all([
        ChatMessage.countDocuments(dateFilter),
        
        ChatMessage.aggregate([
          { $match: dateFilter },
          { $group: { _id: '$message.type', count: { $sum: 1 } } }
        ]),

        ChatMessage.aggregate([
          { $match: { ...dateFilter, 'message.type': 'text' } },
          { $sort: { rideId: 1, createdAt: 1 } },
          {
            $group: {
              _id: '$rideId',
              messages: { $push: '$$ROOT' }
            }
          }
        ]),

        ChatMessage.distinct('rideId', {
          createdAt: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) }
        })
      ]);

      res.json({
        success: true,
        data: {
          totalMessages,
          messagesByType,
          activeChatCount: activeChats.length,
          statistics: {
            averageMessagesPerChat: activeChats.length > 0 ? (totalMessages / activeChats.length).toFixed(2) : 0
          }
        }
      });

    } catch (error) {
      console.error('Error getting chat stats:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get chat statistics',
        error: error.message
      });
    }
  }
}
