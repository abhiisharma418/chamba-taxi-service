import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import SOSButton from '../../components/SOSButton';
import EmergencySettings from '../../components/EmergencySettings';
import EmergencyIncidents from '../../components/EmergencyIncidents';
import FakeCall from '../../components/FakeCall';
import { emergencyService } from '../../services/emergencyService';

const EmergencyCenter: React.FC = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('overview');
  const [emergencyStats, setEmergencyStats] = useState<any>(null);
  const [quickActions, setQuickActions] = useState({
    locationPermission: false,
    notificationPermission: false,
    emergencyContactsCount: 0
  });

  useEffect(() => {
    loadEmergencyData();
    checkPermissions();
  }, []);

  const loadEmergencyData = async () => {
    try {
      const [statsResponse, settingsResponse] = await Promise.all([
        emergencyService.getEmergencyStats(),
        emergencyService.getEmergencySettings()
      ]);

      setEmergencyStats(statsResponse.data);
      setQuickActions(prev => ({
        ...prev,
        emergencyContactsCount: settingsResponse.data.emergencyContacts?.length || 0
      }));
    } catch (error) {
      console.error('Failed to load emergency data:', error);
    }
  };

  const checkPermissions = async () => {
    const locationPermission = await emergencyService.requestLocationPermission();
    const notificationPermission = Notification.permission === 'granted';
    
    setQuickActions(prev => ({
      ...prev,
      locationPermission,
      notificationPermission
    }));
  };

  const requestNotificationPermission = async () => {
    if ('Notification' in window) {
      const permission = await Notification.requestPermission();
      setQuickActions(prev => ({
        ...prev,
        notificationPermission: permission === 'granted'
      }));
    }
  };

  const triggerTestSOS = async () => {
    try {
      const location = await emergencyService.getCurrentLocation();
      
      const confirmed = window.confirm(
        'This will send a test SOS alert. Are you sure you want to continue?'
      );
      
      if (confirmed) {
        await emergencyService.triggerSOS({
          incidentType: 'other',
          severity: 'low',
          location,
          description: 'Test SOS - Please ignore this alert'
        });
        
        alert('Test SOS sent successfully!');
        loadEmergencyData();
      }
    } catch (error) {
      console.error('Failed to send test SOS:', error);
      alert('Failed to send test SOS. Please try again.');
    }
  };

  const handleSOSTriggered = (incidentId: string) => {
    alert(`SOS Alert Sent! Incident ID: ${incidentId}`);
    loadEmergencyData();
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-purple-900">
      {/* SOS Button - Always visible */}
      <SOSButton 
        variant="floating" 
        size="large"
        onSosTriggered={handleSOSTriggered}
      />

      <div className="p-6">
        <div className="max-w-6xl mx-auto">
          <div className="bg-white/10 dark:bg-dark-glass backdrop-blur-lg rounded-3xl p-8 text-white shadow-dark-2xl border border-white/20 dark:border-dark-border">
            <h1 className="text-3xl font-bold mb-8 bg-gradient-to-r from-white to-blue-200 bg-clip-text text-transparent">
              Emergency Safety Center
            </h1>

            {/* Navigation Tabs */}
            <div className="flex space-x-1 mb-8">
              {[
                { id: 'overview', label: 'Overview', icon: '🏠' },
                { id: 'incidents', label: 'Incidents', icon: '📋' },
                { id: 'settings', label: 'Settings', icon: '⚙️' },
                { id: 'tools', label: 'Safety Tools', icon: '🛡️' }
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center space-x-2 px-6 py-3 rounded-xl font-semibold transition-all duration-300 ${
                    activeTab === tab.id
                      ? 'bg-white bg-opacity-20 text-white shadow-lg'
                      : 'text-gray-300 hover:text-white hover:bg-white hover:bg-opacity-10'
                  }`}
                >
                  <span>{tab.icon}</span>
                  <span>{tab.label}</span>
                </button>
              ))}
            </div>

            {/* Tab Content */}
            {activeTab === 'overview' && (
              <div className="space-y-8">
                {/* Safety Status */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="bg-white bg-opacity-10 rounded-xl p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="text-lg font-semibold">Location Access</h3>
                        <p className="text-sm text-gray-300">GPS tracking for emergencies</p>
                      </div>
                      <div className={`w-4 h-4 rounded-full ${quickActions.locationPermission ? 'bg-green-500' : 'bg-red-500'}`}></div>
                    </div>
                    {!quickActions.locationPermission && (
                      <button
                        onClick={() => emergencyService.requestLocationPermission()}
                        className="mt-3 text-blue-400 hover:text-blue-300 text-sm"
                      >
                        Enable Location →
                      </button>
                    )}
                  </div>

                  <div className="bg-white bg-opacity-10 rounded-xl p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="text-lg font-semibold">Notifications</h3>
                        <p className="text-sm text-gray-300">Alert permissions</p>
                      </div>
                      <div className={`w-4 h-4 rounded-full ${quickActions.notificationPermission ? 'bg-green-500' : 'bg-red-500'}`}></div>
                    </div>
                    {!quickActions.notificationPermission && (
                      <button
                        onClick={requestNotificationPermission}
                        className="mt-3 text-blue-400 hover:text-blue-300 text-sm"
                      >
                        Enable Notifications →
                      </button>
                    )}
                  </div>

                  <div className="bg-white bg-opacity-10 rounded-xl p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="text-lg font-semibold">Emergency Contacts</h3>
                        <p className="text-sm text-gray-300">{quickActions.emergencyContactsCount} contacts</p>
                      </div>
                      <div className={`w-4 h-4 rounded-full ${quickActions.emergencyContactsCount > 0 ? 'bg-green-500' : 'bg-yellow-500'}`}></div>
                    </div>
                    {quickActions.emergencyContactsCount === 0 && (
                      <button
                        onClick={() => setActiveTab('settings')}
                        className="mt-3 text-blue-400 hover:text-blue-300 text-sm"
                      >
                        Add Contacts →
                      </button>
                    )}
                  </div>
                </div>

                {/* Emergency Statistics */}
                {emergencyStats && (
                  <div className="bg-white bg-opacity-10 rounded-xl p-6">
                    <h3 className="text-xl font-semibold mb-4">Your Safety Overview</h3>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div className="text-center">
                        <div className="text-3xl font-bold text-blue-400">{emergencyStats.totalIncidents}</div>
                        <div className="text-sm text-gray-300">Total Incidents</div>
                      </div>
                      <div className="text-center">
                        <div className="text-3xl font-bold text-green-400">
                          {emergencyStats.incidentsByStatus?.resolved || 0}
                        </div>
                        <div className="text-sm text-gray-300">Resolved</div>
                      </div>
                      <div className="text-center">
                        <div className="text-3xl font-bold text-yellow-400">
                          {emergencyStats.incidentsByStatus?.active || 0}
                        </div>
                        <div className="text-sm text-gray-300">Active</div>
                      </div>
                      <div className="text-center">
                        <div className="text-3xl font-bold text-purple-400">
                          {Math.round(emergencyStats.avgResponseTime / 1000 / 60) || 0}m
                        </div>
                        <div className="text-sm text-gray-300">Avg Response</div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Quick Actions */}
                <div className="bg-white bg-opacity-10 rounded-xl p-6">
                  <h3 className="text-xl font-semibold mb-6">Quick Actions</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    <button
                      onClick={triggerTestSOS}
                      className="p-4 bg-gradient-to-br from-orange-500 to-red-500 rounded-xl hover:from-orange-600 hover:to-red-600 transition-all duration-300 text-center"
                    >
                      <div className="text-2xl mb-2">🧪</div>
                      <div className="font-semibold">Test SOS</div>
                      <div className="text-xs text-gray-200">Send test alert</div>
                    </button>

                    <button
                      onClick={() => setActiveTab('tools')}
                      className="p-4 bg-gradient-to-br from-blue-500 to-purple-500 rounded-xl hover:from-blue-600 hover:to-purple-600 transition-all duration-300 text-center"
                    >
                      <div className="text-2xl mb-2">📞</div>
                      <div className="font-semibold">Fake Call</div>
                      <div className="text-xs text-gray-200">Safety exit tool</div>
                    </button>

                    <button
                      onClick={() => setActiveTab('settings')}
                      className="p-4 bg-gradient-to-br from-green-500 to-blue-500 rounded-xl hover:from-green-600 hover:to-blue-600 transition-all duration-300 text-center"
                    >
                      <div className="text-2xl mb-2">👥</div>
                      <div className="font-semibold">Contacts</div>
                      <div className="text-xs text-gray-200">Manage emergency contacts</div>
                    </button>

                    <button
                      onClick={() => setActiveTab('incidents')}
                      className="p-4 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl hover:from-purple-600 hover:to-pink-600 transition-all duration-300 text-center"
                    >
                      <div className="text-2xl mb-2">📋</div>
                      <div className="font-semibold">History</div>
                      <div className="text-xs text-gray-200">View past incidents</div>
                    </button>
                  </div>
                </div>

                {/* Safety Tips */}
                <div className="bg-white bg-opacity-10 rounded-xl p-6">
                  <h3 className="text-xl font-semibold mb-4">🛡️ Safety Tips</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-3">
                      <div className="flex items-start space-x-3">
                        <span className="text-green-400">✓</span>
                        <p className="text-sm">Always share your trip details with trusted contacts</p>
                      </div>
                      <div className="flex items-start space-x-3">
                        <span className="text-green-400">✓</span>
                        <p className="text-sm">Keep your emergency contacts updated</p>
                      </div>
                      <div className="flex items-start space-x-3">
                        <span className="text-green-400">✓</span>
                        <p className="text-sm">Enable location sharing during rides</p>
                      </div>
                    </div>
                    <div className="space-y-3">
                      <div className="flex items-start space-x-3">
                        <span className="text-green-400">✓</span>
                        <p className="text-sm">Test the SOS feature periodically</p>
                      </div>
                      <div className="flex items-start space-x-3">
                        <span className="text-green-400">✓</span>
                        <p className="text-sm">Trust your instincts - if something feels wrong, use SOS</p>
                      </div>
                      <div className="flex items-start space-x-3">
                        <span className="text-green-400">✓</span>
                        <p className="text-sm">Keep your phone charged and accessible</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'incidents' && <EmergencyIncidents />}
            {activeTab === 'settings' && <EmergencySettings />}
            
            {activeTab === 'tools' && (
              <div className="space-y-8">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                  {/* Fake Call Tool */}
                  <FakeCall />
                  
                  {/* SOS Test Tool */}
                  <div className="bg-white bg-opacity-10 backdrop-blur-lg rounded-2xl p-6 text-white">
                    <h3 className="text-xl font-semibold mb-6 flex items-center">
                      🚨 SOS Button Test
                    </h3>
                    
                    <div className="space-y-6">
                      <div className="text-center">
                        <SOSButton 
                          variant="embedded" 
                          size="large"
                          onSosTriggered={handleSOSTriggered}
                          className="mx-auto"
                        />
                      </div>
                      
                      <div className="bg-red-500 bg-opacity-20 rounded-xl p-4">
                        <h4 className="font-semibold mb-2">🚨 How to use SOS</h4>
                        <ul className="text-sm text-gray-300 space-y-1">
                          <li>• <strong>Hold for 3 seconds:</strong> Triggers countdown then sends alert</li>
                          <li>• <strong>Double-tap:</strong> Immediately sends SOS alert</li>
                          <li>• <strong>Release early:</strong> Cancels the countdown</li>
                          <li>• <strong>30-second cooldown:</strong> Prevents accidental triggers</li>
                        </ul>
                      </div>
                      
                      <div className="bg-blue-500 bg-opacity-20 rounded-xl p-4">
                        <h4 className="font-semibold mb-2">📡 What happens when triggered</h4>
                        <ul className="text-sm text-gray-300 space-y-1">
                          <li>• Emergency contacts are immediately notified</li>
                          <li>• Your location is shared with contacts and authorities</li>
                          <li>• RideWithUs emergency team is alerted</li>
                          <li>• Police/ambulance may be contacted based on your settings</li>
                        </ul>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Emergency Hotlines */}
                <div className="bg-white bg-opacity-10 rounded-xl p-6">
                  <h3 className="text-xl font-semibold mb-6">📞 Emergency Hotlines</h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <a 
                      href="tel:911"
                      className="p-4 bg-red-500 bg-opacity-20 rounded-xl hover:bg-opacity-30 transition-all duration-300 text-center"
                    >
                      <div className="text-2xl mb-2">🚨</div>
                      <div className="font-semibold">911</div>
                      <div className="text-sm text-gray-300">Emergency Services</div>
                    </a>
                    
                    <a 
                      href="tel:211"
                      className="p-4 bg-blue-500 bg-opacity-20 rounded-xl hover:bg-opacity-30 transition-all duration-300 text-center"
                    >
                      <div className="text-2xl mb-2">ℹ️</div>
                      <div className="font-semibold">211</div>
                      <div className="text-sm text-gray-300">Community Resources</div>
                    </a>
                    
                    <a 
                      href="tel:988"
                      className="p-4 bg-purple-500 bg-opacity-20 rounded-xl hover:bg-opacity-30 transition-all duration-300 text-center"
                    >
                      <div className="text-2xl mb-2">💚</div>
                      <div className="font-semibold">988</div>
                      <div className="text-sm text-gray-300">Mental Health Crisis</div>
                    </a>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default EmergencyCenter;
