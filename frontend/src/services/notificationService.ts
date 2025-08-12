// Push Notification Service for RideWithUs App

interface NotificationOptions {
  title: string;
  body: string;
  icon?: string;
  data?: any;
  actions?: Array<{
    action: string;
    title: string;
    icon?: string;
  }>;
}

class NotificationService {
  private permission: NotificationPermission = 'default';

  constructor() {
    this.checkPermission();
  }

  // Check current notification permission
  checkPermission(): NotificationPermission {
    if ('Notification' in window) {
      this.permission = Notification.permission;
    }
    return this.permission;
  }

  // Request notification permission
  async requestPermission(): Promise<NotificationPermission> {
    if (!('Notification' in window)) {
      console.warn('This browser does not support notifications');
      return 'denied';
    }

    if (this.permission === 'granted') {
      return 'granted';
    }

    if (this.permission !== 'denied') {
      const permission = await Notification.requestPermission();
      this.permission = permission;
      return permission;
    }

    return this.permission;
  }

  // Show notification
  async showNotification(options: NotificationOptions): Promise<void> {
    const permission = await this.requestPermission();
    
    if (permission !== 'granted') {
      console.warn('Notification permission denied');
      return;
    }

    const notification = new Notification(options.title, {
      body: options.body,
      icon: options.icon || '/favicon.ico',
      data: options.data,
      requireInteraction: true,
      silent: false
    });

    // Handle notification click
    notification.onclick = (event) => {
      event.preventDefault();
      window.focus();
      
      if (options.data?.url) {
        window.location.href = options.data.url;
      }
      
      notification.close();
    };

    // Auto close after 10 seconds
    setTimeout(() => {
      notification.close();
    }, 10000);
  }

  // Notification types for different events
  async notifyRideRequest(customerName: string, pickup: string, fare: number) {
    await this.showNotification({
      title: '🚗 New Ride Request!',
      body: `${customerName} requested a ride from ${pickup}. Fare: ₹${fare}`,
      icon: '/icons/ride-request.png',
      data: { type: 'ride_request', url: '/driver/dashboard' }
    });
  }

  async notifyRideAccepted(driverName: string, estimatedArrival: number) {
    await this.showNotification({
      title: '✅ Ride Accepted!',
      body: `${driverName} accepted your ride. Arriving in ${estimatedArrival} minutes.`,
      icon: '/icons/ride-accepted.png',
      data: { type: 'ride_accepted', url: '/customer/live-tracking' }
    });
  }

  async notifyDriverArriving(driverName: string, vehicleNumber: string) {
    await this.showNotification({
      title: '🚕 Driver Arriving!',
      body: `${driverName} is arriving. Vehicle: ${vehicleNumber}`,
      icon: '/icons/driver-arriving.png',
      data: { type: 'driver_arriving' }
    });
  }

  async notifyRideStarted() {
    await this.showNotification({
      title: '🛣️ Ride Started!',
      body: 'Your ride has started. Have a safe journey!',
      icon: '/icons/ride-started.png',
      data: { type: 'ride_started', url: '/customer/live-tracking' }
    });
  }

  async notifyRideCompleted(fare: number) {
    await this.showNotification({
      title: '🏁 Ride Completed!',
      body: `Trip completed successfully. Fare: ₹${fare}. Please rate your driver.`,
      icon: '/icons/ride-completed.png',
      data: { type: 'ride_completed', url: '/customer/history' }
    });
  }

  async notifyPaymentReceived(amount: number) {
    await this.showNotification({
      title: '💰 Payment Received!',
      body: `You received ₹${amount} for your ride. Thank you!`,
      icon: '/icons/payment-received.png',
      data: { type: 'payment_received', url: '/driver/earnings' }
    });
  }

  async notifyEmergencyAlert(rideId: string) {
    await this.showNotification({
      title: '🚨 Emergency Alert!',
      body: 'Emergency alert triggered. Support team has been notified.',
      icon: '/icons/emergency.png',
      data: { type: 'emergency', url: `/ride/${rideId}/tracking` }
    });
  }

  async notifyDriverDocumentApproval() {
    await this.showNotification({
      title: '✅ Documents Approved!',
      body: 'Your driver documents have been approved. You can start accepting rides.',
      icon: '/icons/approval.png',
      data: { type: 'document_approved', url: '/driver/dashboard' }
    });
  }

  async notifyPromotion(title: string, message: string) {
    await this.showNotification({
      title: `🎉 ${title}`,
      body: message,
      icon: '/icons/promotion.png',
      data: { type: 'promotion' }
    });
  }

  // Clear all notifications
  clearNotifications(): void {
    // Note: There's no direct way to clear all notifications
    // This is a placeholder for future implementation
    console.log('Clearing notifications...');
  }

  // Check if notifications are supported
  isSupported(): boolean {
    return 'Notification' in window;
  }

  // Get notification permission status
  getPermissionStatus(): NotificationPermission {
    return this.permission;
  }
}

// Create singleton instance
export const notificationService = new NotificationService();

// Auto-request permission on page load (with user interaction)
export const initializeNotifications = async (): Promise<void> => {
  if (notificationService.isSupported()) {
    // Only auto-request if permission is default (not already granted/denied)
    if (notificationService.getPermissionStatus() === 'default') {
      console.log('Notification service initialized. Permission can be requested when needed.');
    }
  } else {
    console.warn('Push notifications are not supported in this browser');
  }
};

export default notificationService;
