import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import Navigation from '../../components/Navigation';
import LiveTrackingMap from '../../components/LiveTrackingMap';
import { Phone, MessageCircle, Star, Clock, MapPin, AlertTriangle, Navigation as NavigationIcon, Shield, Users, HeadphonesIcon } from 'lucide-react';
import { RidesAPI, TrackingAPI } from '../../lib/api';

interface RideDetails {
  _id: string;
  customerId: string;
  driverId?: string;
  pickup: { address: string; coordinates: [number, number] };
  destination: { address: string; coordinates: [number, number] };
  status: string;
  fare: { estimated: number; actual?: number };
  createdAt: string;
  startedAt?: string;
  completedAt?: string;
  driver?: {
    name: string;
    phone: string;
    rating: number;
    vehicleDetails: {
      make: string;
      model: string;
      number: string;
      color: string;
    };
  };
}

const LiveTracking: React.FC = () => {
  const { rideId } = useParams<{ rideId: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();
  
  const [rideDetails, setRideDetails] = useState<RideDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [trackingStatus, setTrackingStatus] = useState<any>(null);
  const [showEmergencyModal, setShowEmergencyModal] = useState(false);
  const [emergencyLoading, setEmergencyLoading] = useState(false);
  const [userLocation, setUserLocation] = useState<{lat: number, lng: number} | null>(null);

  useEffect(() => {
    if (!rideId || !user) return;

    fetchRideDetails();
    fetchTrackingStatus();
    getCurrentLocation();
  }, [rideId, user]);

  const getCurrentLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setUserLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude
          });
        },
        (error) => {
          console.error('Error getting location:', error);
        }
      );
    }
  };

  const fetchRideDetails = async () => {
    try {
      const response = await RidesAPI.get(rideId!);
      if (response.success) {
        setRideDetails(response.data);
      } else {
        setError('Failed to load ride details');
      }
    } catch (error) {
      console.error('Error fetching ride details:', error);
      setError('Failed to load ride details');
    } finally {
      setLoading(false);
    }
  };

  const fetchTrackingStatus = async () => {
    try {
      const response = await TrackingAPI.getTrackingStatus(rideId!);
      if (response.success) {
        setTrackingStatus(response.data);
      }
    } catch (error) {
      console.error('Error fetching tracking status:', error);
    }
  };

  const handleDriverContact = () => {
    if (rideDetails?.driver?.phone) {
      window.location.href = `tel:${rideDetails.driver.phone}`;
    }
  };

  const handleEmergencyClick = () => {
    setShowEmergencyModal(true);
  };

  const handleEmergencyConfirm = async (emergencyType: string) => {
    setEmergencyLoading(true);
    try {
      const response = await TrackingAPI.triggerEmergency({
        rideId: rideId!,
        location: userLocation || { lat: 0, lng: 0 },
        message: `Emergency: ${emergencyType} - Triggered from live tracking`,
        emergencyType
      });

      if (response.success) {
        alert('🚨 Emergency alert sent! Support and emergency contacts have been notified. Stay safe!');
        setShowEmergencyModal(false);
      }
    } catch (error) {
      console.error('Error triggering emergency:', error);
      alert('Failed to send emergency alert. Please call 112 or local emergency services directly.');
    } finally {
      setEmergencyLoading(false);
    }
  };

  const handleDirectCall = (number: string) => {
    window.location.href = `tel:${number}`;
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'accepted': return 'bg-blue-100 text-blue-800';
      case 'arriving': return 'bg-yellow-100 text-yellow-800';
      case 'on-trip': return 'bg-green-100 text-green-800';
      case 'completed': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'accepted': return 'Driver Assigned';
      case 'arriving': return 'Driver Arriving';
      case 'on-trip': return 'Trip in Progress';
      case 'completed': return 'Trip Completed';
      default: return status;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/50">
        <Navigation />
        <div className="max-w-4xl mx-auto px-4 py-8">
          <div className="bg-white rounded-xl shadow-lg p-8 text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading ride details...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error || !rideDetails) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/50">
        <Navigation />
        <div className="max-w-4xl mx-auto px-4 py-8">
          <div className="bg-red-50 border border-red-200 rounded-xl p-8 text-center">
            <AlertTriangle className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-red-800 mb-2">Unable to Load Ride</h2>
            <p className="text-red-600 mb-4">{error}</p>
            <button
              onClick={() => navigate('/customer/dashboard')}
              className="bg-red-600 text-white px-6 py-2 rounded-lg hover:bg-red-700 transition-colors"
            >
              Back to Dashboard
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/50">
      <Navigation />

      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => navigate('/customer/dashboard')}
            className="flex items-center text-blue-600 hover:text-blue-700 mb-4"
          >
            <NavigationIcon className="h-4 w-4 mr-2" />
            Back to Dashboard
          </button>
          
          <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="flex items-center justify-between mb-4">
              <h1 className="text-2xl font-bold text-gray-900">Live Tracking</h1>
              <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(rideDetails.status)}`}>
                {getStatusText(rideDetails.status)}
              </span>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex items-center space-x-3">
                <MapPin className="h-5 w-5 text-green-600" />
                <div>
                  <p className="text-sm text-gray-500">Pickup</p>
                  <p className="font-medium">{rideDetails.pickup.address}</p>
                </div>
              </div>
              
              <div className="flex items-center space-x-3">
                <MapPin className="h-5 w-5 text-red-600" />
                <div>
                  <p className="text-sm text-gray-500">Destination</p>
                  <p className="font-medium">{rideDetails.destination.address}</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Map */}
          <div className="lg:col-span-2">
            <LiveTrackingMap
              rideId={rideDetails._id}
              customerId={rideDetails.customerId}
              driverId={rideDetails.driverId}
              pickupLocation={{
                lat: rideDetails.pickup.coordinates[1],
                lng: rideDetails.pickup.coordinates[0],
                address: rideDetails.pickup.address
              }}
              destinationLocation={{
                lat: rideDetails.destination.coordinates[1],
                lng: rideDetails.destination.coordinates[0],
                address: rideDetails.destination.address
              }}
              height="500px"
              onDriverContact={handleDriverContact}
              onEmergency={handleEmergencyClick}
            />
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Driver Details */}
            {rideDetails.driver && (
              <div className="bg-white rounded-xl shadow-lg p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Driver Details</h3>
                
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-gray-900">{rideDetails.driver.name}</p>
                      <div className="flex items-center space-x-1">
                        <Star className="h-4 w-4 text-yellow-400 fill-current" />
                        <span className="text-sm text-gray-600">{rideDetails.driver.rating.toFixed(1)}</span>
                      </div>
                    </div>
                    
                    <div className="flex space-x-2">
                      <button
                        onClick={handleDriverContact}
                        className="p-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                      >
                        <Phone className="h-4 w-4" />
                      </button>
                      <button className="p-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
                        <MessageCircle className="h-4 w-4" />
                      </button>
                    </div>
                  </div>

                  <div className="border-t pt-4">
                    <p className="text-sm text-gray-500 mb-2">Vehicle Details</p>
                    <p className="font-medium">
                      {rideDetails.driver.vehicleDetails.color} {rideDetails.driver.vehicleDetails.make} {rideDetails.driver.vehicleDetails.model}
                    </p>
                    <p className="text-lg font-bold text-gray-900">
                      {rideDetails.driver.vehicleDetails.number}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Trip Details */}
            <div className="bg-white rounded-xl shadow-lg p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Trip Details</h3>
              
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-600">Booking ID</span>
                  <span className="font-medium">{rideDetails._id.slice(-8)}</span>
                </div>
                
                <div className="flex justify-between">
                  <span className="text-gray-600">Fare</span>
                  <span className="font-medium">₹{rideDetails.fare.actual || rideDetails.fare.estimated}</span>
                </div>
                
                <div className="flex justify-between">
                  <span className="text-gray-600">Booked At</span>
                  <span className="font-medium">
                    {new Date(rideDetails.createdAt).toLocaleTimeString()}
                  </span>
                </div>

                {rideDetails.startedAt && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">Started At</span>
                    <span className="font-medium">
                      {new Date(rideDetails.startedAt).toLocaleTimeString()}
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Emergency Section */}
            <div className="bg-red-50 border border-red-200 rounded-xl p-6">
              <h3 className="text-lg font-semibold text-red-800 mb-2 flex items-center gap-2">
                <Shield className="h-5 w-5" />
                Emergency & Safety
              </h3>
              <p className="text-red-600 text-sm mb-4">
                If you feel unsafe or need immediate help, use the options below.
              </p>

              <div className="space-y-3">
                <button
                  onClick={handleEmergencyClick}
                  className="w-full bg-red-600 text-white py-3 px-4 rounded-lg hover:bg-red-700 transition-colors font-medium flex items-center justify-center gap-2"
                >
                  <AlertTriangle className="h-5 w-5" />
                  SOS Emergency Alert
                </button>

                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => handleDirectCall('112')}
                    className="bg-orange-600 text-white py-2 px-3 rounded-lg hover:bg-orange-700 transition-colors text-sm font-medium"
                  >
                    Call 112
                  </button>
                  <button
                    onClick={() => handleDirectCall('+911234567890')}
                    className="bg-blue-600 text-white py-2 px-3 rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
                  >
                    Support
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Emergency Modal */}
      {showEmergencyModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6">
            <div className="text-center mb-6">
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <AlertTriangle className="h-8 w-8 text-red-600" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">Emergency Alert</h3>
              <p className="text-gray-600">
                This will immediately notify our support team, emergency contacts, and local authorities if needed.
              </p>
            </div>

            <div className="space-y-3 mb-6">
              <h4 className="font-semibold text-gray-900">Select Emergency Type:</h4>

              <button
                onClick={() => handleEmergencyConfirm('SAFETY_CONCERN')}
                disabled={emergencyLoading}
                className="w-full bg-orange-600 text-white py-3 px-4 rounded-lg hover:bg-orange-700 transition-colors disabled:opacity-50 text-left"
              >
                <div className="flex items-center gap-3">
                  <Shield className="h-5 w-5" />
                  <div>
                    <div className="font-medium">Safety Concern</div>
                    <div className="text-sm opacity-90">Driver behavior or route issues</div>
                  </div>
                </div>
              </button>

              <button
                onClick={() => handleEmergencyConfirm('MEDICAL_EMERGENCY')}
                disabled={emergencyLoading}
                className="w-full bg-red-600 text-white py-3 px-4 rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 text-left"
              >
                <div className="flex items-center gap-3">
                  <AlertTriangle className="h-5 w-5" />
                  <div>
                    <div className="font-medium">Medical Emergency</div>
                    <div className="text-sm opacity-90">Need immediate medical assistance</div>
                  </div>
                </div>
              </button>

              <button
                onClick={() => handleEmergencyConfirm('VEHICLE_ACCIDENT')}
                disabled={emergencyLoading}
                className="w-full bg-purple-600 text-white py-3 px-4 rounded-lg hover:bg-purple-700 transition-colors disabled:opacity-50 text-left"
              >
                <div className="flex items-center gap-3">
                  <AlertTriangle className="h-5 w-5" />
                  <div>
                    <div className="font-medium">Vehicle Accident</div>
                    <div className="text-sm opacity-90">Road accident or vehicle breakdown</div>
                  </div>
                </div>
              </button>

              <button
                onClick={() => handleEmergencyConfirm('GENERAL_EMERGENCY')}
                disabled={emergencyLoading}
                className="w-full bg-gray-600 text-white py-3 px-4 rounded-lg hover:bg-gray-700 transition-colors disabled:opacity-50 text-left"
              >
                <div className="flex items-center gap-3">
                  <HeadphonesIcon className="h-5 w-5" />
                  <div>
                    <div className="font-medium">Other Emergency</div>
                    <div className="text-sm opacity-90">General emergency or assistance needed</div>
                  </div>
                </div>
              </button>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setShowEmergencyModal(false)}
                disabled={emergencyLoading}
                className="flex-1 bg-gray-200 text-gray-800 py-3 px-4 rounded-lg hover:bg-gray-300 transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={() => handleDirectCall('112')}
                className="flex-1 bg-red-600 text-white py-3 px-4 rounded-lg hover:bg-red-700 transition-colors font-medium"
              >
                Call 112 Now
              </button>
            </div>

            {emergencyLoading && (
              <div className="absolute inset-0 bg-white bg-opacity-90 rounded-2xl flex items-center justify-center">
                <div className="text-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-600 mx-auto mb-2"></div>
                  <p className="text-sm text-gray-600">Sending emergency alert...</p>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default LiveTracking;
