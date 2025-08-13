import notificationService from '../services/notificationService.js';
import { User } from '../models/userModel.js';

// Send test notification
export const sendTestNotification = async (req, res) => {
  try {
    const { userId, title, message, type = 'test' } = req.body;

    if (!userId || !title || !message) {
      return res.status(400).json({
        success: false,
        message: 'UserId, title, and message are required'
      });
    }

    const sent = notificationService.sendNotification(userId, {
      type,
      title,
      message,
      timestamp: new Date()
    });

    res.json({
      success: true,
      message: sent ? 'Notification sent successfully' : 'User not connected, notification queued',
      sent
    });
  } catch (error) {
    console.error('Send test notification error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to send notification',
      error: error.message
    });
  }
};

// Send bulk notification
export const sendBulkNotification = async (req, res) => {
  try {
    const { userIds, title, message, type = 'system' } = req.body;

    if (!userIds || !Array.isArray(userIds) || !title || !message) {
      return res.status(400).json({
        success: false,
        message: 'UserIds array, title, and message are required'
      });
    }

    const sentCount = notificationService.sendBulkNotification(userIds, {
      type,
      title,
      message,
      timestamp: new Date()
    });

    res.json({
      success: true,
      message: `Notification sent to ${sentCount} of ${userIds.length} users`,
      sentCount,
      totalUsers: userIds.length
    });
  } catch (error) {
    console.error('Send bulk notification error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to send bulk notification',
      error: error.message
    });
  }
};

// Send notification to all users of a specific type
export const sendNotificationByUserType = async (req, res) => {
  try {
    const { userType, title, message, type = 'system' } = req.body;

    if (!userType || !title || !message) {
      return res.status(400).json({
        success: false,
        message: 'UserType, title, and message are required'
      });
    }

    // Get all users of specified type
    const users = await User.find({ role: userType }, '_id');
    const userIds = users.map(user => user._id.toString());

    const sentCount = notificationService.sendBulkNotification(userIds, {
      type,
      title,
      message,
      timestamp: new Date()
    });

    res.json({
      success: true,
      message: `Notification sent to ${sentCount} of ${userIds.length} ${userType}s`,
      sentCount,
      totalUsers: userIds.length,
      userType
    });
  } catch (error) {
    console.error('Send notification by user type error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to send notification to user type',
      error: error.message
    });
  }
};

// Send system notification to all users
export const sendSystemNotification = async (req, res) => {
  try {
    const { title, message, type = 'system' } = req.body;

    if (!title || !message) {
      return res.status(400).json({
        success: false,
        message: 'Title and message are required'
      });
    }

    // Get all active users
    const users = await User.find({ status: 'active' }, '_id');
    const userIds = users.map(user => user._id.toString());

    const sentCount = notificationService.sendBulkNotification(userIds, {
      type,
      title,
      message,
      timestamp: new Date()
    });

    res.json({
      success: true,
      message: `System notification sent to ${sentCount} of ${userIds.length} users`,
      sentCount,
      totalUsers: userIds.length
    });
  } catch (error) {
    console.error('Send system notification error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to send system notification',
      error: error.message
    });
  }
};

// Send promotional notification
export const sendPromotionalNotification = async (req, res) => {
  try {
    const { 
      title, 
      description, 
      code, 
      discount, 
      validUntil, 
      targetUsers = 'all' 
    } = req.body;

    if (!title || !description) {
      return res.status(400).json({
        success: false,
        message: 'Title and description are required'
      });
    }

    let userIds = [];

    if (targetUsers === 'all') {
      const users = await User.find({ role: { $in: ['customer', 'driver'] } }, '_id');
      userIds = users.map(user => user._id.toString());
    } else if (Array.isArray(targetUsers)) {
      userIds = targetUsers;
    } else if (typeof targetUsers === 'string') {
      const users = await User.find({ role: targetUsers }, '_id');
      userIds = users.map(user => user._id.toString());
    }

    const sentCount = await notificationService.sendPromotionalNotification(userIds, {
      title,
      description,
      code,
      discount,
      validUntil
    });

    res.json({
      success: true,
      message: `Promotional notification sent to ${sentCount} users`,
      sentCount,
      totalUsers: userIds.length,
      promotion: { title, code, discount }
    });
  } catch (error) {
    console.error('Send promotional notification error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to send promotional notification',
      error: error.message
    });
  }
};

// Get notification statistics
export const getNotificationStats = async (req, res) => {
  try {
    const connectedUsersCount = notificationService.getConnectedUsersCount();
    const connectedCustomers = notificationService.getConnectedUsersByType('customer');
    const connectedDrivers = notificationService.getConnectedUsersByType('driver');
    const connectedAdmins = notificationService.getConnectedUsersByType('admin');

    res.json({
      success: true,
      data: {
        totalConnected: connectedUsersCount,
        connectedCustomers: connectedCustomers.length,
        connectedDrivers: connectedDrivers.length,
        connectedAdmins: connectedAdmins.length,
        breakdown: {
          customers: connectedCustomers,
          drivers: connectedDrivers,
          admins: connectedAdmins
        }
      }
    });
  } catch (error) {
    console.error('Get notification stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get notification statistics',
      error: error.message
    });
  }
};

// Send ride notification manually
export const sendRideNotification = async (req, res) => {
  try {
    const { rideId, updateType, additionalData = {} } = req.body;

    if (!rideId || !updateType) {
      return res.status(400).json({
        success: false,
        message: 'RideId and updateType are required'
      });
    }

    await notificationService.notifyRideUpdate(rideId, updateType, additionalData);

    res.json({
      success: true,
      message: `Ride notification sent for ${updateType}`,
      rideId,
      updateType
    });
  } catch (error) {
    console.error('Send ride notification error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to send ride notification',
      error: error.message
    });
  }
};

// Send emergency alert
export const sendEmergencyAlert = async (req, res) => {
  try {
    const { rideId, alertType, customMessage } = req.body;

    if (!rideId || !alertType) {
      return res.status(400).json({
        success: false,
        message: 'RideId and alertType are required'
      });
    }

    await notificationService.sendEmergencyAlert(rideId, alertType);

    res.json({
      success: true,
      message: `Emergency alert sent for ${alertType}`,
      rideId,
      alertType
    });
  } catch (error) {
    console.error('Send emergency alert error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to send emergency alert',
      error: error.message
    });
  }
};
