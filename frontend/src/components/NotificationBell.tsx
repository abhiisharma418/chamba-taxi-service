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
      {/* Premium Notification Bell */}
      <button
        onClick={handleBellClick}
        className="group relative p-3 bg-white/70 backdrop-blur-xl hover:bg-white/90 rounded-2xl shadow-xl border border-white/40 transition-all duration-300 hover:scale-110 hover:shadow-2xl overflow-hidden"
      >
        <div className="absolute inset-0 bg-gradient-to-br from-blue-50/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
        <Bell className="relative z-10 h-6 w-6 text-blue-600 group-hover:text-blue-700 transition-colors duration-300" />

        {unreadCount > 0 && (
          <div className="absolute -top-2 -right-2 flex items-center justify-center">
            <div className="bg-gradient-to-r from-red-500 to-red-600 text-white text-xs font-bold rounded-full h-6 w-6 flex items-center justify-center shadow-lg animate-pulse border-2 border-white">
              {unreadCount > 9 ? '9+' : unreadCount}
            </div>
            <div className="absolute inset-0 bg-red-400 rounded-full animate-ping opacity-30"></div>
          </div>
        )}

        {/* Premium shine effect */}
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000 skew-x-12"></div>
      </button>

      {/* Premium Dropdown */}
      {showDropdown && (
        <div className="absolute right-0 mt-4 w-96 bg-white/90 backdrop-blur-2xl rounded-3xl shadow-2xl border border-white/30 z-50 overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-0.5 bg-gradient-to-r from-blue-500 via-purple-500 to-indigo-500"></div>
          <div className="absolute inset-0 bg-gradient-to-br from-blue-50/30 via-transparent to-purple-50/20"></div>

          <div className="relative z-10 p-6 border-b border-white/20">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-100 rounded-xl">
                  <Bell className="h-5 w-5 text-blue-600" />
                </div>
                <h3 className="text-xl font-bold bg-gradient-to-r from-slate-900 to-slate-700 bg-clip-text text-transparent">
                  Notifications
                </h3>
              </div>
              <button
                onClick={() => setShowSettings(true)}
                className="group p-2 hover:bg-white/60 rounded-xl transition-all duration-300 border border-transparent hover:border-blue-200/50"
              >
                <Settings className="h-5 w-5 text-slate-600 group-hover:text-blue-600 transition-colors duration-300" />
              </button>
            </div>
          </div>

          <div className="relative z-10 max-h-96 overflow-y-auto">
            {!hasPermission ? (
              <div className="p-8 text-center">
                <div className="relative mb-6">
                  <div className="w-20 h-20 bg-gradient-to-br from-blue-100 to-blue-200 rounded-3xl flex items-center justify-center mx-auto mb-4">
                    <Bell className="h-10 w-10 text-blue-600" />
                  </div>
                  <div className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 rounded-full animate-bounce"></div>
                </div>
                <h4 className="text-xl font-bold text-slate-900 mb-3">Enable Premium Notifications</h4>
                <p className="text-slate-600 text-base mb-6 leading-relaxed">
                  Get instant updates about ride status, driver arrivals, and important alerts with our premium notification system.
                </p>
                <button
                  onClick={handleEnableNotifications}
                  className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white px-8 py-3 rounded-2xl font-semibold transition-all duration-300 shadow-lg hover:shadow-xl transform hover:-translate-y-1"
                >
                  Enable Notifications
                </button>
              </div>
            ) : unreadCount === 0 ? (
              <div className="p-8 text-center">
                <div className="w-20 h-20 bg-gradient-to-br from-emerald-100 to-green-200 rounded-3xl flex items-center justify-center mx-auto mb-4">
                  <Check className="h-10 w-10 text-emerald-600" />
                </div>
                <h4 className="text-lg font-bold text-slate-900 mb-2">All Caught Up!</h4>
                <p className="text-slate-600">You have no new notifications.</p>
              </div>
            ) : (
              <div className="p-4 space-y-3">
                {/* Premium notification items */}
                {Array.from({ length: Math.min(unreadCount, 5) }).map((_, index) => (
                  <div key={index} className="group relative p-4 bg-white/60 backdrop-blur-sm hover:bg-white/90 rounded-2xl border border-white/40 hover:border-blue-200/50 transition-all duration-300 hover:shadow-lg transform hover:-translate-y-1">
                    <div className="flex items-start gap-4">
                      <div className="relative flex-shrink-0">
                        <div className="w-3 h-3 bg-gradient-to-r from-blue-500 to-blue-600 rounded-full animate-pulse"></div>
                        <div className="absolute inset-0 w-3 h-3 bg-blue-400 rounded-full animate-ping opacity-30"></div>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <p className="text-sm font-bold text-slate-900">
                            🚗 Ride Update
                          </p>
                          <span className="px-2 py-0.5 bg-blue-100 text-blue-700 text-xs font-semibold rounded-full">
                            Live
                          </span>
                        </div>
                        <p className="text-sm text-slate-700 mb-2">
                          Your driver is {2 + index} minutes away and approaching your location
                        </p>
                        <div className="flex items-center gap-2">
                          <p className="text-xs text-slate-500">
                            {new Date().toLocaleTimeString()}
                          </p>
                          <span className="w-1 h-1 bg-slate-400 rounded-full"></span>
                          <p className="text-xs text-blue-600 font-semibold">
                            Track Live
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}

                {unreadCount > 5 && (
                  <div className="p-4 text-center bg-white/40 backdrop-blur-sm rounded-2xl border border-white/30">
                    <p className="text-sm font-semibold text-slate-700">
                      +{unreadCount - 5} more notifications
                    </p>
                    <p className="text-xs text-slate-500 mt-1">View all in notification center</p>
                  </div>
                )}
              </div>
            )}
          </div>

          {hasPermission && (
            <div className="relative z-10 p-4 border-t border-white/20">
              <button
                onClick={markAsRead}
                className="w-full bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white py-3 px-6 rounded-2xl font-semibold transition-all duration-300 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
              >
                Mark All as Read
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
