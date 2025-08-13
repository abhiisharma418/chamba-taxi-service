import React, { useState, useEffect, useRef } from 'react';
import { emergencyService, SOSRequest } from '../services/emergencyService';
import { useAuth } from '../contexts/AuthContext';

interface SOSButtonProps {
  rideId?: string;
  className?: string;
  size?: 'small' | 'medium' | 'large';
  variant?: 'floating' | 'embedded';
  onSosTriggered?: (incidentId: string) => void;
}

const SOSButton: React.FC<SOSButtonProps> = ({
  rideId,
  className = '',
  size = 'medium',
  variant = 'floating',
  onSosTriggered
}) => {
  const { user } = useAuth();
  const [isPressed, setIsPressed] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const [isTriggering, setIsTriggering] = useState(false);
  const [lastTrigger, setLastTrigger] = useState<number>(0);
  const countdownRef = useRef<NodeJS.Timeout>();
  const pressTimeRef = useRef<number>(0);

  const sizeClasses = {
    small: 'w-12 h-12 text-sm',
    medium: 'w-16 h-16 text-base',
    large: 'w-24 h-24 text-lg'
  };

  const variantClasses = {
    floating: 'fixed bottom-6 right-6 z-50 shadow-2xl',
    embedded: 'relative'
  };

  useEffect(() => {
    return () => {
      if (countdownRef.current) {
        clearTimeout(countdownRef.current);
      }
    };
  }, []);

  const preventAccidentalTrigger = () => {
    const now = Date.now();
    return now - lastTrigger < 30000; // 30 seconds cooldown
  };

  const startCountdown = () => {
    if (preventAccidentalTrigger()) {
      alert('Please wait 30 seconds before triggering SOS again.');
      return;
    }

    setIsPressed(true);
    setCountdown(3);
    pressTimeRef.current = Date.now();

    const countdownInterval = setInterval(() => {
      setCountdown(prev => {
        if (prev <= 1) {
          clearInterval(countdownInterval);
          triggerSOS();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    countdownRef.current = countdownInterval;
  };

  const cancelCountdown = () => {
    if (countdownRef.current) {
      clearTimeout(countdownRef.current);
    }
    setIsPressed(false);
    setCountdown(0);
  };

  const triggerSOS = async () => {
    if (isTriggering) return;
    
    setIsTriggering(true);
    setLastTrigger(Date.now());

    try {
      const location = await emergencyService.getCurrentLocation();
      const deviceInfo = emergencyService.getDeviceInfo();
      const networkInfo = emergencyService.getNetworkInfo();

      const sosData: SOSRequest = {
        incidentType: 'panic',
        severity: 'high',
        location,
        description: 'SOS button pressed - immediate assistance required',
        rideId,
        deviceInfo,
        networkInfo
      };

      const response = await emergencyService.triggerSOS(sosData);
      
      if (response.success) {
        setIsPressed(false);
        setCountdown(0);
        
        if (onSosTriggered) {
          onSosTriggered(response.data.incidentId);
        }

        // Show success notification
        if ('Notification' in window && Notification.permission === 'granted') {
          new Notification('SOS Alert Sent', {
            body: 'Emergency services and contacts have been notified',
            icon: '/emergency-icon.png',
            tag: 'sos-success'
          });
        }

        // Vibrate if supported
        if ('vibrate' in navigator) {
          navigator.vibrate([200, 100, 200, 100, 200]);
        }
      }
    } catch (error) {
      console.error('Failed to trigger SOS:', error);
      alert('Failed to send SOS alert. Please try again or contact emergency services directly.');
    } finally {
      setIsTriggering(false);
    }
  };

  const handleQuickSOS = async () => {
    if (preventAccidentalTrigger()) {
      alert('Please wait 30 seconds before triggering SOS again.');
      return;
    }

    const confirmed = window.confirm(
      'This will immediately send an SOS alert to emergency contacts and services. Continue?'
    );

    if (confirmed) {
      await triggerSOS();
    }
  };

  const baseClasses = `
    rounded-full bg-gradient-to-br from-red-500 to-red-700 
    text-white font-bold border-4 border-white
    transition-all duration-200 transform hover:scale-105
    flex items-center justify-center cursor-pointer
    select-none active:scale-95
  `;

  const pressedClasses = isPressed ? 'animate-pulse bg-gradient-to-br from-red-600 to-red-800 scale-110' : '';
  const triggeringClasses = isTriggering ? 'opacity-50 cursor-not-allowed' : '';

  return (
    <div className={`${variantClasses[variant]} ${className}`}>
      <div
        className={`
          ${baseClasses}
          ${sizeClasses[size]}
          ${pressedClasses}
          ${triggeringClasses}
        `}
        onMouseDown={startCountdown}
        onMouseUp={cancelCountdown}
        onMouseLeave={cancelCountdown}
        onTouchStart={startCountdown}
        onTouchEnd={cancelCountdown}
        onDoubleClick={handleQuickSOS}
        style={{
          background: isPressed 
            ? `conic-gradient(from 0deg, #dc2626 ${((3 - countdown) / 3) * 360}deg, #ef4444 ${((3 - countdown) / 3) * 360}deg)`
            : undefined
        }}
      >
        {isTriggering ? (
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-white"></div>
        ) : countdown > 0 ? (
          <span className="text-2xl font-bold">{countdown}</span>
        ) : (
          <span className="font-bold">SOS</span>
        )}
      </div>
      
      {isPressed && countdown > 0 && (
        <div className="absolute -top-16 left-1/2 transform -translate-x-1/2 bg-black bg-opacity-75 text-white px-3 py-1 rounded-lg text-sm whitespace-nowrap">
          Release to cancel • {countdown}s
        </div>
      )}

      {variant === 'floating' && (
        <div className="absolute -top-8 left-1/2 transform -translate-x-1/2 text-xs text-gray-600 whitespace-nowrap">
          Hold 3s or Double-tap
        </div>
      )}
    </div>
  );
};

export default SOSButton;
