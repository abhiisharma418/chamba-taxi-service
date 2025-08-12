import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useAuth } from './AuthContext';
import { notificationService } from '../services/notificationService';
import { io, Socket } from 'socket.io-client';

interface NotificationContextType {
  hasPermission: boolean;
  requestPermission: () => Promise<boolean>;
  showNotification: (title: string, message: string, type?: string) => void;
  unreadCount: number;
  markAsRead: () => void;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
};

interface NotificationProviderProps {
  children: ReactNode;
}

export const NotificationProvider: React.FC<NotificationProviderProps> = ({ children }) => {
  const { user } = useAuth();
  const [hasPermission, setHasPermission] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [socket, setSocket] = useState<Socket | null>(null);

  useEffect(() => {
    // Check initial permission status
    const permission = notificationService.getPermissionStatus();
    setHasPermission(permission === 'granted');
  }, []);

  useEffect(() => {
    if (!user) return;

    // Initialize socket connection for real-time notifications
    const socketInstance = io(
      (import.meta as any).env?.VITE_API_URL || 'https://chamba-taxi-service-2.onrender.com',
      {
        auth: { userId: user.id, role: user.role }
      }
    );

    setSocket(socketInstance);

    // Listen for various notification events
    socketInstance.on('notification', (data) => {
      handleNotification(data);
    });

    // Ride-related notifications
    socketInstance.on('ride:request', (data) => {
      if (user.role === 'driver') {
        notificationService.notifyRideRequest(
          data.customerName, 
          data.pickup?.address || 'Unknown location', 
          data.fare || 0
        );
        setUnreadCount(prev => prev + 1);
      }
    });

    socketInstance.on('ride:accepted', (data) => {
      if (user.role === 'customer') {
        notificationService.notifyRideAccepted(
          data.driverName, 
          data.estimatedArrival || 5
        );
        setUnreadCount(prev => prev + 1);
      }
    });

    socketInstance.on('ride:driver_arriving', (data) => {
      if (user.role === 'customer') {
        notificationService.notifyDriverArriving(
          data.driverName,
          data.vehicleNumber
        );
        setUnreadCount(prev => prev + 1);
      }
    });

    socketInstance.on('ride:started', () => {
      if (user.role === 'customer') {
        notificationService.notifyRideStarted();
        setUnreadCount(prev => prev + 1);
      }
    });

    socketInstance.on('ride:completed', (data) => {
      if (user.role === 'customer') {
        notificationService.notifyRideCompleted(data.fare || 0);
      } else if (user.role === 'driver') {
        notificationService.notifyPaymentReceived(data.fare || 0);
      }
      setUnreadCount(prev => prev + 1);
    });

    // Emergency notifications
    socketInstance.on('emergency:triggered', (data) => {
      notificationService.notifyEmergencyAlert(data.rideId);
      setUnreadCount(prev => prev + 1);
    });

    // Driver-specific notifications
    socketInstance.on('driver:documents_approved', () => {
      if (user.role === 'driver') {
        notificationService.notifyDriverDocumentApproval();
        setUnreadCount(prev => prev + 1);
      }
    });

    // Promotional notifications
    socketInstance.on('promotion', (data) => {
      notificationService.notifyPromotion(data.title, data.message);
      setUnreadCount(prev => prev + 1);
    });

    return () => {
      socketInstance.disconnect();
    };
  }, [user]);

  const handleNotification = (data: any) => {
    // Generic notification handler
    const { title, message, type } = data;
    notificationService.showNotification({
      title: title || 'RideWithUs',
      body: message || 'You have a new notification',
      data: { type }
    });
    setUnreadCount(prev => prev + 1);
  };

  const requestPermission = async (): Promise<boolean> => {
    const permission = await notificationService.requestPermission();
    const granted = permission === 'granted';
    setHasPermission(granted);
    
    if (granted) {
      // Send a test notification
      await notificationService.showNotification({
        title: '🎉 Notifications Enabled!',
        body: 'You will now receive ride updates and important alerts.',
        data: { type: 'permission_granted' }
      });
    }
    
    return granted;
  };

  const showNotification = (title: string, message: string, type?: string) => {
    notificationService.showNotification({
      title,
      body: message,
      data: { type: type || 'general' }
    });
    setUnreadCount(prev => prev + 1);
  };

  const markAsRead = () => {
    setUnreadCount(0);
  };

  return (
    <NotificationContext.Provider
      value={{
        hasPermission,
        requestPermission,
        showNotification,
        unreadCount,
        markAsRead
      }}
    >
      {children}
    </NotificationContext.Provider>
  );
};

export default NotificationProvider;
