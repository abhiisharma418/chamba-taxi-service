import React, { useState, useEffect } from 'react';
import { MessageCircle, Phone, CheckCircle, Clock, AlertCircle, Settings } from 'lucide-react';

interface WhatsAppNotificationProps {
  isEnabled?: boolean;
  phoneNumber?: string;
  onToggle?: (enabled: boolean) => void;
  onPhoneUpdate?: (phone: string) => void;
}

const WhatsAppNotification: React.FC<WhatsAppNotificationProps> = ({
  isEnabled = false,
  phoneNumber = '',
  onToggle,
  onPhoneUpdate
}) => {
  const [enabled, setEnabled] = useState(isEnabled);
  const [phone, setPhone] = useState(phoneNumber);
  const [isEditing, setIsEditing] = useState(false);
  const [notifications, setNotifications] = useState({
    booking: true,
    driverAssigned: true,
    statusUpdates: true,
    promotions: false
  });

  const handleToggle = () => {
    const newEnabled = !enabled;
    setEnabled(newEnabled);
    onToggle?.(newEnabled);
  };

  const handlePhoneSubmit = () => {
    if (phone.trim()) {
      onPhoneUpdate?.(phone);
      setIsEditing(false);
    }
  };

  const handleNotificationChange = (type: keyof typeof notifications) => {
    setNotifications(prev => ({
      ...prev,
      [type]: !prev[type]
    }));
  };

  const formatPhoneNumber = (phone: string) => {
    const cleaned = phone.replace(/\D/g, '');
    if (cleaned.startsWith('91')) {
      return `+${cleaned.slice(0, 2)} ${cleaned.slice(2, 7)} ${cleaned.slice(7)}`;
    }
    return `+91 ${cleaned.slice(0, 5)} ${cleaned.slice(5)}`;
  };

  return (
    <div className="bg-white rounded-xl shadow-lg border border-gray-100 p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-3">
          <div className="bg-green-100 p-3 rounded-full">
            <MessageCircle className="h-6 w-6 text-green-600" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900">WhatsApp Notifications</h3>
            <p className="text-sm text-gray-600">Get ride updates on WhatsApp</p>
          </div>
        </div>
        
        <label className="relative inline-flex items-center cursor-pointer">
          <input
            type="checkbox"
            checked={enabled}
            onChange={handleToggle}
            className="sr-only peer"
          />
          <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-green-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-600"></div>
        </label>
      </div>

      {enabled && (
        <div className="space-y-6">
          {/* Phone Number Section */}
          <div className="bg-gray-50 rounded-lg p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-700">Phone Number</span>
              {!isEditing && (
                <button
                  onClick={() => setIsEditing(true)}
                  className="text-blue-600 hover:text-blue-700 text-sm font-medium"
                >
                  Edit
                </button>
              )}
            </div>
            
            {isEditing ? (
              <div className="flex space-x-2">
                <div className="flex-1 relative">
                  <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+91 12345 67890"
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  />
                </div>
                <button
                  onClick={handlePhoneSubmit}
                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                >
                  Save
                </button>
                <button
                  onClick={() => {
                    setIsEditing(false);
                    setPhone(phoneNumber);
                  }}
                  className="px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 transition-colors"
                >
                  Cancel
                </button>
              </div>
            ) : (
              <div className="flex items-center space-x-2">
                <Phone className="h-4 w-4 text-gray-400" />
                <span className="text-gray-900">
                  {phone ? formatPhoneNumber(phone) : 'No phone number added'}
                </span>
                {phone && (
                  <CheckCircle className="h-4 w-4 text-green-500" />
                )}
              </div>
            )}
          </div>

          {/* Notification Types */}
          <div>
            <h4 className="text-sm font-medium text-gray-700 mb-3">Notification Types</h4>
            <div className="space-y-3">
              {[
                {
                  key: 'booking' as const,
                  title: 'Booking Confirmation',
                  description: 'Get notified when your ride is booked',
                  icon: CheckCircle
                },
                {
                  key: 'driverAssigned' as const,
                  title: 'Driver Assigned',
                  description: 'Get driver details and vehicle info',
                  icon: MessageCircle
                },
                {
                  key: 'statusUpdates' as const,
                  title: 'Status Updates',
                  description: 'Trip started, arrived, completed notifications',
                  icon: Clock
                },
                {
                  key: 'promotions' as const,
                  title: 'Promotions & Offers',
                  description: 'Special deals and discount notifications',
                  icon: Settings
                }
              ].map((item) => {
                const IconComponent = item.icon;
                return (
                  <div key={item.key} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center space-x-3">
                      <IconComponent className="h-5 w-5 text-gray-600" />
                      <div>
                        <p className="text-sm font-medium text-gray-900">{item.title}</p>
                        <p className="text-xs text-gray-600">{item.description}</p>
                      </div>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={notifications[item.key]}
                        onChange={() => handleNotificationChange(item.key)}
                        className="sr-only peer"
                      />
                      <div className="w-8 h-4 bg-gray-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-green-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[1px] after:left-[1px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-3 after:w-3 after:transition-all peer-checked:bg-green-600"></div>
                    </label>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Sample Message Preview */}
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <div className="flex items-start space-x-3">
              <MessageCircle className="h-5 w-5 text-green-600 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-green-800 mb-1">Sample Message Preview</p>
                <div className="text-xs text-green-700 bg-white rounded-lg p-3 border border-green-200">
                  <div className="font-medium mb-1">🚗 RideWithUs Booking Confirmed</div>
                  <p>Hi John! Your ride has been booked.</p>
                  <p><strong>Booking ID:</strong> RWU12345</p>
                  <p><strong>Vehicle:</strong> Car</p>
                  <p><strong>From:</strong> Downtown Mall</p>
                  <p><strong>To:</strong> Airport Terminal 1</p>
                  <p><strong>Fare:</strong> ₹450</p>
                  <p className="mt-2 text-gray-600">We'll notify you when a driver is assigned!</p>
                </div>
              </div>
            </div>
          </div>

          {/* Terms */}
          <div className="text-xs text-gray-500 bg-gray-50 rounded-lg p-3">
            <div className="flex items-start space-x-2">
              <AlertCircle className="h-4 w-4 text-gray-400 mt-0.5 flex-shrink-0" />
              <p>
                By enabling WhatsApp notifications, you agree to receive automated messages from RideWithUs. 
                Standard messaging rates may apply. You can disable this anytime in settings.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default WhatsAppNotification;
