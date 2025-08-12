import React, { useState } from 'react';
import { Bell, Settings, Check, X } from 'lucide-react';
import { useNotifications } from '../contexts/NotificationContext';

const NotificationBell: React.FC = () => {
  const { hasPermission, requestPermission, unreadCount, markAsRead } = useNotifications();
  const [showDropdown, setShowDropdown] = useState(false);
  const [showSettings, setShowSettings] = useState(false);

  const handleBellClick = () => {
    setShowDropdown(!showDropdown);
    if (showDropdown && unreadCount > 0) {
      markAsRead();
    }
  };

  const handleEnableNotifications = async () => {
    const granted = await requestPermission();
    if (granted) {
      setShowSettings(false);
    }
  };

  return (
    <div className="relative">
      {/* Notification Bell */}
      <button
        onClick={handleBellClick}
        className="relative p-2 bg-white hover:bg-gray-50 rounded-full shadow-md border border-gray-200 transition-all duration-200 hover:scale-105"
      >
        <Bell className="h-5 w-5 text-gray-600" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center animate-pulse">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown */}
      {showDropdown && (
        <div className="absolute right-0 mt-2 w-80 bg-white rounded-xl shadow-xl border border-gray-200 z-50">
          <div className="p-4 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900">Notifications</h3>
              <button
                onClick={() => setShowSettings(true)}
                className="p-1 hover:bg-gray-100 rounded-md transition-colors"
              >
                <Settings className="h-4 w-4 text-gray-500" />
              </button>
            </div>
          </div>

          <div className="max-h-96 overflow-y-auto">
            {!hasPermission ? (
              <div className="p-4 text-center">
                <Bell className="h-12 w-12 text-gray-400 mx-auto mb-3" />
                <h4 className="text-lg font-medium text-gray-900 mb-2">Enable Notifications</h4>
                <p className="text-gray-600 text-sm mb-4">
                  Get notified about ride updates, driver arrivals, and important alerts.
                </p>
                <button
                  onClick={handleEnableNotifications}
                  className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Enable Notifications
                </button>
              </div>
            ) : unreadCount === 0 ? (
              <div className="p-6 text-center">
                <Check className="h-12 w-12 text-green-500 mx-auto mb-3" />
                <p className="text-gray-600">All caught up! No new notifications.</p>
              </div>
            ) : (
              <div className="p-2">
                {/* Mock notifications - in real app, these would come from state */}
                {Array.from({ length: Math.min(unreadCount, 5) }).map((_, index) => (
                  <div key={index} className="p-3 hover:bg-gray-50 rounded-lg mb-2">
                    <div className="flex items-start gap-3">
                      <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 flex-shrink-0"></div>
                      <div className="flex-1">
                        <p className="text-sm font-medium text-gray-900">
                          Ride Update
                        </p>
                        <p className="text-xs text-gray-600 mt-1">
                          Your driver is 2 minutes away
                        </p>
                        <p className="text-xs text-gray-400 mt-1">
                          {new Date().toLocaleTimeString()}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
                
                {unreadCount > 5 && (
                  <div className="p-3 text-center">
                    <p className="text-sm text-gray-500">
                      +{unreadCount - 5} more notifications
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>

          {hasPermission && (
            <div className="p-3 border-t border-gray-200">
              <button
                onClick={markAsRead}
                className="w-full text-sm text-blue-600 hover:text-blue-700 transition-colors"
              >
                Mark all as read
              </button>
            </div>
          )}
        </div>
      )}

      {/* Settings Modal */}
      {showSettings && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-gray-900">Notification Settings</h3>
              <button
                onClick={() => setShowSettings(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="h-6 w-6" />
              </button>
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-gray-900">Push Notifications</p>
                  <p className="text-sm text-gray-600">Receive notifications in your browser</p>
                </div>
                <div className="flex items-center">
                  {hasPermission ? (
                    <span className="text-green-600 text-sm font-medium">Enabled</span>
                  ) : (
                    <button
                      onClick={handleEnableNotifications}
                      className="bg-blue-600 text-white px-3 py-1 rounded-md text-sm hover:bg-blue-700 transition-colors"
                    >
                      Enable
                    </button>
                  )}
                </div>
              </div>

              <div className="pt-4 border-t border-gray-200">
                <h4 className="font-medium text-gray-900 mb-3">Notification Types</h4>
                <div className="space-y-3">
                  {[
                    { name: 'Ride Updates', description: 'Driver acceptance, arrival, trip status' },
                    { name: 'Payment Alerts', description: 'Payment confirmations and receipts' },
                    { name: 'Emergency Alerts', description: 'Safety and emergency notifications' },
                    { name: 'Promotions', description: 'Special offers and discounts' }
                  ].map((type, index) => (
                    <div key={index} className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-900">{type.name}</p>
                        <p className="text-xs text-gray-600">{type.description}</p>
                      </div>
                      <input
                        type="checkbox"
                        defaultChecked={index < 3} // First 3 enabled by default
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setShowSettings(false)}
                className="flex-1 bg-gray-200 text-gray-800 py-2 px-4 rounded-lg hover:bg-gray-300 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => setShowSettings(false)}
                className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors"
              >
                Save Settings
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default NotificationBell;
