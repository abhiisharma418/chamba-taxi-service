import React, { useEffect, useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useBooking } from '../../contexts/BookingContext';
import Navigation from '../../components/Navigation';
import DriverLocationTracker from '../../components/DriverLocationTracker';
import { 
  Car, Power, MapPin, Clock, DollarSign, Star, Bell, Phone, MessageCircle,
  Navigation as NavigationIcon, TrendingUp, Calendar, Users, Award,
  Settings, Battery, Wifi, AlertTriangle, Target, BookOpen, BarChart3
} from 'lucide-react';
import { LiveAPI, RidesAPI, TrackingAPI } from '../../lib/api';
import { io } from 'socket.io-client';

interface DriverStats {
  todayEarnings: number;
  weeklyEarnings: number;
  monthlyEarnings: number;
  totalRides: number;
  todayRides: number;
  rating: number;
  totalRatings: number;
  acceptanceRate: number;
  cancellationRate: number;
  avgTripTime: number;
}

interface RideOffer {
  rideId: string;
  pickup: { address: string; coordinates: [number, number] };
  destination: { address: string; coordinates: [number, number] };
  fare: number;
  distance: number;
  customerName: string;
  customerRating: number;
  estimatedTime: number;
  surgeMultiplier?: number;
}

const EnhancedDriverDashboard: React.FC = () => {
  const { user } = useAuth();
  const { bookings, updateBookingStatus, getBookingHistory } = useBooking();
  const [isOnline, setIsOnline] = useState(false);
  const [offer, setOffer] = useState<RideOffer | null>(null);
  const [activeRide, setActiveRide] = useState<any>(null);
  const [driverStats, setDriverStats] = useState<DriverStats | null>(null);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [currentLocation, setCurrentLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [batteryLevel, setBatteryLevel] = useState<number>(100);
  const [connectionStatus, setConnectionStatus] = useState<'connected' | 'connecting' | 'disconnected'>('connecting');

  useEffect(() => {
    if (!user) return;
    
    initializeDriver();
    setupSocketConnection();
    loadDriverStats();
    setupBatteryMonitoring();
    
    return () => {
      cleanup();
    };
  }, [user]);

  const initializeDriver = async () => {
    try {
      await getBookingHistory();
      const currentRide = bookings.find(booking => 
        booking.driverId === user?.id && ['accepted', 'on-trip'].includes(booking.status)
      );
      setActiveRide(currentRide);
    } catch (error) {
      console.error('Error initializing driver:', error);
    }
  };

  const setupSocketConnection = () => {
    const socket = io(import.meta.env?.VITE_API_URL || 'https://ride-with-us.onrender.com', {
      auth: { driverId: user?.id }
    });

    socket.on('connect', () => {
      setConnectionStatus('connected');
    });

    socket.on('disconnect', () => {
      setConnectionStatus('disconnected');
    });

    socket.on('dispatch:offer', (payload: RideOffer) => {
      setOffer(payload);
      // Add notification sound/vibration here
    });

    socket.on('ride:cancelled', (payload: any) => {
      setNotifications(prev => [...prev, {
        id: Date.now(),
        type: 'cancellation',
        message: `Ride ${payload.rideId} was cancelled`,
        timestamp: new Date()
      }]);
      setActiveRide(null);
    });

    socket.on('customer:message', (payload: any) => {
      setNotifications(prev => [...prev, {
        id: Date.now(),
        type: 'message',
        message: `New message from customer: ${payload.message}`,
        timestamp: new Date()
      }]);
    });

    return () => socket.disconnect();
  };

  const loadDriverStats = async () => {
    try {
      // Simulate loading driver stats - in real app, this would be an API call
      const stats: DriverStats = {
        todayEarnings: 1250,
        weeklyEarnings: 8750,
        monthlyEarnings: 35000,
        totalRides: 142,
        todayRides: 8,
        rating: 4.7,
        totalRatings: 89,
        acceptanceRate: 92,
        cancellationRate: 3,
        avgTripTime: 18
      };
      setDriverStats(stats);
    } catch (error) {
      console.error('Error loading driver stats:', error);
    }
  };

  const setupBatteryMonitoring = () => {
    if ('getBattery' in navigator) {
      (navigator as any).getBattery().then((battery: any) => {
        setBatteryLevel(Math.round(battery.level * 100));
        battery.addEventListener('levelchange', () => {
          setBatteryLevel(Math.round(battery.level * 100));
        });
      });
    }
  };

  const cleanup = async () => {
    if (isOnline) {
      try {
        await LiveAPI.setAvailability(false);
      } catch (error) {
        console.error('Error setting availability offline:', error);
      }
    }
  };

  const handleOnlineToggle = async () => {
    const newOnlineStatus = !isOnline;
    setIsOnline(newOnlineStatus);
    
    try {
      await LiveAPI.setAvailability(newOnlineStatus);
      
      if (newOnlineStatus) {
        // Start location tracking
        navigator.geolocation.getCurrentPosition(
          (position) => {
            setCurrentLocation({
              lat: position.coords.latitude,
              lng: position.coords.longitude
            });
          },
          (error) => console.error('Location error:', error)
        );
      }
    } catch (error) {
      console.error('Error toggling online status:', error);
      setIsOnline(!newOnlineStatus); // Revert on error
    }
  };

  const handleOfferResponse = async (accept: boolean) => {
    if (!offer) return;
    
    try {
      await LiveAPI.respondOffer(offer.rideId, accept);
      
      if (accept) {
        setActiveRide({
          id: offer.rideId,
          pickup: offer.pickup,
          destination: offer.destination,
          fare: { estimated: offer.fare },
          customerName: offer.customerName,
          status: 'accepted'
        });
        
        // Start tracking
        await TrackingAPI.startTracking({
          rideId: offer.rideId,
          driverId: user?.id
        });
      }
      
      setOffer(null);
    } catch (error) {
      console.error('Error responding to offer:', error);
    }
  };

  const handleRideStatusUpdate = async (status: 'on-trip' | 'completed') => {
    if (!activeRide) return;
    
    try {
      await RidesAPI.updateStatus(activeRide.id, status);
      
      if (status === 'completed') {
        await TrackingAPI.stopTracking({
          rideId: activeRide.id,
          reason: 'completed'
        });
        setActiveRide(null);
      } else {
        setActiveRide({ ...activeRide, status });
      }
      
      await getBookingHistory();
    } catch (error) {
      console.error('Error updating ride status:', error);
    }
  };

  const handleNavigation = () => {
    if (!activeRide) return;
    
    const destination = activeRide.status === 'accepted' 
      ? activeRide.pickup.coordinates 
      : activeRide.destination.coordinates;
    
    const url = `https://www.google.com/maps/dir/?api=1&destination=${destination[1]},${destination[0]}`;
    window.open(url, '_blank');
  };

  const handleCustomerContact = () => {
    // In real app, get customer phone from ride details
    const customerPhone = '+911234567890';
    window.location.href = `tel:${customerPhone}`;
  };

  const getConnectionStatusColor = () => {
    switch (connectionStatus) {
      case 'connected': return 'text-green-600';
      case 'connecting': return 'text-yellow-600';
      default: return 'text-red-600';
    }
  };

  const getBatteryColor = () => {
    if (batteryLevel > 50) return 'text-green-600';
    if (batteryLevel > 20) return 'text-yellow-600';
    return 'text-red-600';
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/50">
      <Navigation />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Ride Offer Modal */}
        {offer && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6 animate-pulse">
              <div className="text-center mb-6">
                <div className="bg-blue-100 p-4 rounded-full w-16 h-16 mx-auto mb-4">
                  <Car className="h-8 w-8 text-blue-600 mx-auto" />
                </div>
                <h2 className="text-2xl font-bold text-gray-900 mb-2">New Ride Request!</h2>
                <div className="bg-gradient-to-r from-green-500 to-blue-500 text-white px-4 py-2 rounded-full inline-block">
                  ₹{offer.fare} • {offer.distance}km • {offer.estimatedTime}min
                </div>
              </div>

              <div className="space-y-4 mb-6">
                <div className="flex items-start space-x-3">
                  <div className="w-3 h-3 bg-green-500 rounded-full mt-2"></div>
                  <div>
                    <p className="text-sm text-gray-500">Pickup</p>
                    <p className="font-medium">{offer.pickup.address}</p>
                  </div>
                </div>
                
                <div className="flex items-start space-x-3">
                  <div className="w-3 h-3 bg-red-500 rounded-full mt-2"></div>
                  <div>
                    <p className="text-sm text-gray-500">Destination</p>
                    <p className="font-medium">{offer.destination.address}</p>
                  </div>
                </div>

                <div className="flex items-center justify-between bg-gray-50 rounded-lg p-3">
                  <span className="text-gray-600">Customer</span>
                  <div className="flex items-center space-x-2">
                    <span className="font-medium">{offer.customerName}</span>
                    <div className="flex items-center">
                      <Star className="h-4 w-4 text-yellow-400 fill-current" />
                      <span className="text-sm">{offer.customerRating}</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex space-x-3">
                <button
                  onClick={() => handleOfferResponse(false)}
                  className="flex-1 py-3 px-4 border-2 border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium transition-colors"
                >
                  Decline
                </button>
                <button
                  onClick={() => handleOfferResponse(true)}
                  className="flex-1 py-3 px-4 bg-gradient-to-r from-green-600 to-green-700 text-white rounded-lg hover:from-green-700 hover:to-green-800 font-medium transition-colors shadow-lg"
                >
                  Accept
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Header Section */}
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl border border-gray-100 p-8 mb-8">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-slate-900 to-slate-700 bg-clip-text text-transparent">
                Welcome back, {user?.name}!
              </h1>
              <div className="flex items-center space-x-4 mt-2">
                <div className="flex items-center space-x-2">
                  <div className={`w-3 h-3 rounded-full ${isOnline ? 'bg-green-500 animate-pulse' : 'bg-gray-400'}`}></div>
                  <span className={`font-medium ${isOnline ? 'text-green-600' : 'text-gray-600'}`}>
                    {isOnline ? 'ONLINE' : 'OFFLINE'}
                  </span>
                </div>
                
                <div className="flex items-center space-x-1">
                  <Wifi className={`h-4 w-4 ${getConnectionStatusColor()}`} />
                  <span className={`text-sm ${getConnectionStatusColor()}`}>
                    {connectionStatus}
                  </span>
                </div>
                
                <div className="flex items-center space-x-1">
                  <Battery className={`h-4 w-4 ${getBatteryColor()}`} />
                  <span className={`text-sm ${getBatteryColor()}`}>
                    {batteryLevel}%
                  </span>
                </div>
              </div>
            </div>

            <button
              onClick={handleOnlineToggle}
              className={`flex items-center space-x-3 px-8 py-4 rounded-xl font-semibold text-lg transition-all duration-300 transform hover:scale-105 ${
                isOnline 
                  ? 'bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white shadow-lg' 
                  : 'bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white shadow-lg'
              }`}
            >
              <Power className="h-6 w-6" />
              <span>{isOnline ? 'Go Offline' : 'Go Online'}</span>
            </button>
          </div>

          {/* Quick Stats */}
          {driverStats && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-xl p-4 border border-green-200">
                <div className="flex items-center space-x-3">
                  <DollarSign className="h-8 w-8 text-green-600" />
                  <div>
                    <div className="text-2xl font-bold text-green-800">₹{driverStats.todayEarnings}</div>
                    <div className="text-green-600 text-sm">Today's Earnings</div>
                  </div>
                </div>
              </div>

              <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-4 border border-blue-200">
                <div className="flex items-center space-x-3">
                  <Car className="h-8 w-8 text-blue-600" />
                  <div>
                    <div className="text-2xl font-bold text-blue-800">{driverStats.todayRides}</div>
                    <div className="text-blue-600 text-sm">Today's Rides</div>
                  </div>
                </div>
              </div>

              <div className="bg-gradient-to-br from-yellow-50 to-yellow-100 rounded-xl p-4 border border-yellow-200">
                <div className="flex items-center space-x-3">
                  <Star className="h-8 w-8 text-yellow-600" />
                  <div>
                    <div className="text-2xl font-bold text-yellow-800">{driverStats.rating}</div>
                    <div className="text-yellow-600 text-sm">Rating</div>
                  </div>
                </div>
              </div>

              <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl p-4 border border-purple-200">
                <div className="flex items-center space-x-3">
                  <Target className="h-8 w-8 text-purple-600" />
                  <div>
                    <div className="text-2xl font-bold text-purple-800">{driverStats.acceptanceRate}%</div>
                    <div className="text-purple-600 text-sm">Acceptance</div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-8">
            {/* Active Ride */}
            {activeRide && (
              <div className="bg-gradient-to-br from-blue-600 to-blue-700 rounded-2xl shadow-xl p-8 text-white">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-2xl font-bold">
                    {activeRide.status === 'accepted' ? 'Ride Accepted' : 'Trip in Progress'}
                  </h3>
                  <div className={`px-4 py-2 rounded-full text-sm font-medium ${
                    activeRide.status === 'accepted' ? 'bg-yellow-500' : 'bg-green-500'
                  }`}>
                    {activeRide.status === 'accepted' ? 'Heading to Pickup' : 'On Trip'}
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                  <div className="space-y-4">
                    <div className="flex items-start space-x-3">
                      <div className="w-4 h-4 bg-green-400 rounded-full mt-1"></div>
                      <div>
                        <p className="text-blue-100 text-sm">
                          {activeRide.status === 'accepted' ? 'Pickup Location' : 'Started From'}
                        </p>
                        <p className="font-medium">{activeRide.pickup.address}</p>
                      </div>
                    </div>
                    
                    <div className="flex items-start space-x-3">
                      <div className="w-4 h-4 bg-red-400 rounded-full mt-1"></div>
                      <div>
                        <p className="text-blue-100 text-sm">Destination</p>
                        <p className="font-medium">{activeRide.destination.address}</p>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <p className="text-blue-100 text-sm">Customer</p>
                      <p className="font-medium">{activeRide.customerName || 'Customer'}</p>
                    </div>
                    
                    <div>
                      <p className="text-blue-100 text-sm">Fare</p>
                      <p className="text-2xl font-bold">₹{activeRide.fare.estimated}</p>
                    </div>
                  </div>
                </div>

                <div className="flex space-x-3">
                  <button
                    onClick={handleNavigation}
                    className="flex-1 bg-white/20 hover:bg-white/30 text-white py-3 px-4 rounded-xl font-medium transition-colors"
                  >
                    <NavigationIcon className="h-5 w-5 inline mr-2" />
                    Navigate
                  </button>
                  
                  <button
                    onClick={handleCustomerContact}
                    className="flex-1 bg-white/20 hover:bg-white/30 text-white py-3 px-4 rounded-xl font-medium transition-colors"
                  >
                    <Phone className="h-5 w-5 inline mr-2" />
                    Call Customer
                  </button>

                  {activeRide.status === 'accepted' && (
                    <button
                      onClick={() => handleRideStatusUpdate('on-trip')}
                      className="flex-1 bg-green-600 hover:bg-green-700 text-white py-3 px-4 rounded-xl font-medium transition-colors"
                    >
                      Start Trip
                    </button>
                  )}

                  {activeRide.status === 'on-trip' && (
                    <button
                      onClick={() => handleRideStatusUpdate('completed')}
                      className="flex-1 bg-yellow-600 hover:bg-yellow-700 text-white py-3 px-4 rounded-xl font-medium transition-colors"
                    >
                      Complete Trip
                    </button>
                  )}
                </div>
              </div>
            )}

            {/* Driver Location Tracker */}
            {isOnline && (
              <DriverLocationTracker
                driverId={user?.id || ''}
                isOnline={isOnline}
                activeRideId={activeRide?.id}
                onLocationUpdate={setCurrentLocation}
              />
            )}

            {/* Performance Metrics */}
            {driverStats && (
              <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl border border-gray-100 p-8">
                <h3 className="text-2xl font-bold text-gray-900 mb-6">Performance Metrics</h3>
                
                <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
                  <div className="text-center">
                    <div className="bg-green-100 p-4 rounded-xl mb-3">
                      <TrendingUp className="h-8 w-8 text-green-600 mx-auto" />
                    </div>
                    <div className="text-2xl font-bold text-gray-900">₹{driverStats.weeklyEarnings}</div>
                    <div className="text-gray-600">Weekly Earnings</div>
                  </div>

                  <div className="text-center">
                    <div className="bg-blue-100 p-4 rounded-xl mb-3">
                      <Users className="h-8 w-8 text-blue-600 mx-auto" />
                    </div>
                    <div className="text-2xl font-bold text-gray-900">{driverStats.totalRides}</div>
                    <div className="text-gray-600">Total Rides</div>
                  </div>

                  <div className="text-center">
                    <div className="bg-purple-100 p-4 rounded-xl mb-3">
                      <Clock className="h-8 w-8 text-purple-600 mx-auto" />
                    </div>
                    <div className="text-2xl font-bold text-gray-900">{driverStats.avgTripTime}m</div>
                    <div className="text-gray-600">Avg Trip Time</div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Quick Actions */}
            <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl border border-gray-100 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
              
              <div className="space-y-3">
                <button className="w-full flex items-center space-x-3 p-3 bg-gray-50 hover:bg-gray-100 rounded-xl transition-colors">
                  <BarChart3 className="h-5 w-5 text-blue-600" />
                  <span className="font-medium">View Earnings</span>
                </button>
                
                <button className="w-full flex items-center space-x-3 p-3 bg-gray-50 hover:bg-gray-100 rounded-xl transition-colors">
                  <BookOpen className="h-5 w-5 text-green-600" />
                  <span className="font-medium">Trip History</span>
                </button>
                
                <button className="w-full flex items-center space-x-3 p-3 bg-gray-50 hover:bg-gray-100 rounded-xl transition-colors">
                  <Settings className="h-5 w-5 text-gray-600" />
                  <span className="font-medium">Settings</span>
                </button>
              </div>
            </div>

            {/* Notifications */}
            <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl border border-gray-100 p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">Notifications</h3>
                <Bell className="h-5 w-5 text-gray-400" />
              </div>
              
              {notifications.length > 0 ? (
                <div className="space-y-3">
                  {notifications.slice(0, 3).map((notification) => (
                    <div key={notification.id} className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                      <p className="text-sm text-blue-800">{notification.message}</p>
                      <p className="text-xs text-blue-600 mt-1">
                        {notification.timestamp.toLocaleTimeString()}
                      </p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500 text-sm">No new notifications</p>
              )}
            </div>

            {/* Today's Goals */}
            <div className="bg-gradient-to-br from-orange-50 to-orange-100 rounded-2xl border border-orange-200 p-6">
              <div className="flex items-center space-x-2 mb-4">
                <Award className="h-6 w-6 text-orange-600" />
                <h3 className="text-lg font-semibold text-orange-900">Today's Goals</h3>
              </div>
              
              <div className="space-y-4">
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-orange-700">Earnings Goal</span>
                    <span className="text-orange-700">₹{driverStats?.todayEarnings || 0}/₹2000</span>
                  </div>
                  <div className="w-full bg-orange-200 rounded-full h-2">
                    <div 
                      className="bg-orange-600 h-2 rounded-full" 
                      style={{ width: `${Math.min(((driverStats?.todayEarnings || 0) / 2000) * 100, 100)}%` }}
                    ></div>
                  </div>
                </div>

                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-orange-700">Rides Goal</span>
                    <span className="text-orange-700">{driverStats?.todayRides || 0}/15</span>
                  </div>
                  <div className="w-full bg-orange-200 rounded-full h-2">
                    <div 
                      className="bg-orange-600 h-2 rounded-full" 
                      style={{ width: `${Math.min(((driverStats?.todayRides || 0) / 15) * 100, 100)}%` }}
                    ></div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EnhancedDriverDashboard;
