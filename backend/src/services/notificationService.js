import { getIoInstance } from '../server.js';
import { WhatsAppAPI } from '../lib/api.js';

// Notify driver about ride offer or updates
export async function notifyDriver(driverId, type, data) {
  try {
    const io = getIoInstance();
    
    // Send real-time notification via Socket.IO
    io.to(`driver:${driverId}`).emit('notification', {
      type,
      data,
      timestamp: new Date().toISOString()
    });
    
    // Also send specific event based on type
    switch (type) {
      case 'ride_offer':
        io.to(`driver:${driverId}`).emit('ride:offer', data);
        break;
      case 'ride_cancelled':
        io.to(`driver:${driverId}`).emit('ride:cancelled', data);
        break;
      case 'ride_completed':
        io.to(`driver:${driverId}`).emit('ride:completed', data);
        break;
    }
    
    console.log(`Notification sent to driver ${driverId}: ${type}`);
    return { success: true };
  } catch (error) {
    console.error('Error notifying driver:', error);
    return { success: false, error: error.message };
  }
}

// Notify customer about ride updates
export async function notifyCustomer(customerId, type, data) {
  try {
    const io = getIoInstance();
    
    // Send real-time notification via Socket.IO
    io.to(`customer:${customerId}`).emit('notification', {
      type,
      data,
      timestamp: new Date().toISOString()
    });
    
    // Also send specific event based on type
    switch (type) {
      case 'driver_assigned':
        io.to(`customer:${customerId}`).emit('ride:driver_assigned', data);
        break;
      case 'driver_arrived':
        io.to(`customer:${customerId}`).emit('ride:driver_arrived', data);
        break;
      case 'ride_started':
        io.to(`customer:${customerId}`).emit('ride:started', data);
        break;
      case 'ride_completed':
        io.to(`customer:${customerId}`).emit('ride:completed', data);
        break;
      case 'no_drivers_available':
        io.to(`customer:${customerId}`).emit('ride:no_drivers', data);
        break;
    }
    
    console.log(`Notification sent to customer ${customerId}: ${type}`);
    return { success: true };
  } catch (error) {
    console.error('Error notifying customer:', error);
    return { success: false, error: error.message };
  }
}

// Send WhatsApp notification
export async function sendWhatsAppNotification(phone, type, data) {
  try {
    let message = '';
    
    switch (type) {
      case 'booking_confirmed':
        message = `🚗 RideWithUs - Booking Confirmed!
        
Booking ID: ${data.bookingId}
Pickup: ${data.pickup}
Destination: ${data.destination}
Vehicle: ${data.vehicleType}
Fare: ₹${data.fare}

We're finding a driver for you. You'll get updates here.`;
        break;
        
      case 'driver_assigned':
        message = `🚗 Driver Assigned!
        
Driver: ${data.driver.name}
Phone: ${data.driver.phone}
Vehicle: ${data.driver.vehicleModel} (${data.driver.vehicleNumber})
Rating: ${data.driver.rating}⭐
ETA: ${data.estimatedArrival} minutes

Track your ride in the app.`;
        break;
        
      case 'driver_arrived':
        message = `🚗 Driver Arrived!
        
Your driver ${data.driver.name} has arrived at the pickup location.
Vehicle: ${data.driver.vehicleNumber}

Please come out when ready.`;
        break;
        
      case 'ride_started':
        message = `🚗 Trip Started!
        
Your ride has started to ${data.destination}.
Estimated arrival: ${data.estimatedArrival}

Have a safe journey!`;
        break;
        
      case 'ride_completed':
        message = `🚗 Trip Completed!
        
Fare: ₹${data.fare}
Payment: ${data.paymentMethod}
Distance: ${data.distance}km

Thank you for choosing RideWithUs!
Rate your driver in the app.`;
        break;
        
      case 'ride_cancelled':
        message = `🚗 Booking Cancelled
        
Your booking ${data.bookingId} has been cancelled.
${data.reason || ''}

Book again anytime through the app.`;
        break;
    }
    
    if (message) {
      // Here you would integrate with actual WhatsApp Business API
      // For now, just log the message
      console.log(`WhatsApp to ${phone}: ${message}`);
      
      // You can integrate with services like:
      // - WhatsApp Business API
      // - Twilio WhatsApp
      // - MessageBird
      // - etc.
    }
    
    return { success: true };
  } catch (error) {
    console.error('Error sending WhatsApp notification:', error);
    return { success: false, error: error.message };
  }
}

// Send push notification (for mobile apps)
export async function sendPushNotification(userId, type, data) {
  try {
    // Here you would integrate with push notification services like:
    // - Firebase Cloud Messaging (FCM)
    // - Apple Push Notification Service (APNS)
    // - OneSignal
    // - etc.
    
    const notification = {
      title: getNotificationTitle(type),
      body: getNotificationBody(type, data),
      data: {
        type,
        rideId: data.rideId,
        ...data
      }
    };
    
    console.log(`Push notification to user ${userId}:`, notification);
    
    return { success: true };
  } catch (error) {
    console.error('Error sending push notification:', error);
    return { success: false, error: error.message };
  }
}

// Send email notification
export async function sendEmailNotification(email, type, data) {
  try {
    // Here you would integrate with email services like:
    // - SendGrid
    // - Amazon SES
    // - Mailgun
    // - etc.
    
    const emailData = {
      to: email,
      subject: getEmailSubject(type),
      template: type,
      data
    };
    
    console.log(`Email notification to ${email}:`, emailData);
    
    return { success: true };
  } catch (error) {
    console.error('Error sending email notification:', error);
    return { success: false, error: error.message };
  }
}

// Broadcast to all drivers in a radius
export async function broadcastToNearbyDrivers(lat, lng, radiusKm, type, data) {
  try {
    const io = getIoInstance();
    
    // This would typically query for drivers in the radius
    // For now, broadcast to all connected drivers
    io.to('drivers').emit('broadcast', {
      type,
      location: { lat, lng, radius: radiusKm },
      data,
      timestamp: new Date().toISOString()
    });
    
    return { success: true };
  } catch (error) {
    console.error('Error broadcasting to nearby drivers:', error);
    return { success: false, error: error.message };
  }
}

// Helper functions for notification content
function getNotificationTitle(type) {
  const titles = {
    'ride_offer': '🚗 New Ride Request',
    'driver_assigned': '✅ Driver Assigned',
    'driver_arrived': '📍 Driver Arrived',
    'ride_started': '🛣️ Trip Started',
    'ride_completed': '✅ Trip Completed',
    'ride_cancelled': '❌ Trip Cancelled',
    'no_drivers_available': '😔 No Drivers Available'
  };
  
  return titles[type] || 'RideWithUs Update';
}

function getNotificationBody(type, data) {
  const bodies = {
    'ride_offer': `Pickup: ${data.pickup?.address || 'Unknown'} • Fare: ₹${data.fare || 0}`,
    'driver_assigned': `${data.driver?.name || 'Driver'} is coming • ETA: ${data.estimatedArrival || 'Unknown'} min`,
    'driver_arrived': `Your driver has arrived at the pickup location`,
    'ride_started': `Trip started to ${data.destination?.address || 'destination'}`,
    'ride_completed': `Trip completed • Fare: ₹${data.fare || 0}`,
    'ride_cancelled': `Your booking has been cancelled`,
    'no_drivers_available': `No drivers available. Please try again later.`
  };
  
  return bodies[type] || 'You have a new update';
}

function getEmailSubject(type) {
  const subjects = {
    'booking_confirmed': 'RideWithUs - Booking Confirmed',
    'driver_assigned': 'RideWithUs - Driver Assigned',
    'ride_completed': 'RideWithUs - Trip Completed',
    'ride_cancelled': 'RideWithUs - Booking Cancelled'
  };
  
  return subjects[type] || 'RideWithUs Update';
}

// Notification preferences management
export async function updateNotificationPreferences(userId, preferences) {
  try {
    // Store user notification preferences
    // This would typically be saved to database
    console.log(`Updated notification preferences for user ${userId}:`, preferences);
    
    return { success: true };
  } catch (error) {
    console.error('Error updating notification preferences:', error);
    return { success: false, error: error.message };
  }
}
