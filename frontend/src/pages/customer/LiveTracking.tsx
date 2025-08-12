import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import Navigation from '../../components/Navigation';
import LiveTrackingMap from '../../components/LiveTrackingMap';
import { Phone, MessageCircle, Star, Clock, MapPin, AlertTriangle, Navigation as NavigationIcon } from 'lucide-react';
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

  useEffect(() => {
    if (!rideId || !user) return;
    
    fetchRideDetails();
    fetchTrackingStatus();
  }, [rideId, user]);

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

  const handleEmergency = async () => {
    try {
      const response = await TrackingAPI.triggerEmergency({
        rideId: rideId!,
        location: { lat: 0, lng: 0 }, // You'd get user's current location here
        message: 'Emergency triggered from tracking page'
      });

      if (response.success) {
        alert('Emergency alert sent! Support will contact you shortly.');
      }
    } catch (error) {
      console.error('Error triggering emergency:', error);
      alert('Failed to send emergency alert. Please call support directly.');
    }
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
              onEmergency={handleEmergency}
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

            {/* Emergency Button */}
            <div className="bg-red-50 border border-red-200 rounded-xl p-6">
              <h3 className="text-lg font-semibold text-red-800 mb-2">Emergency</h3>
              <p className="text-red-600 text-sm mb-4">
                In case of emergency, click the button below to alert our support team and emergency contacts.
              </p>
              <button
                onClick={handleEmergency}
                className="w-full bg-red-600 text-white py-3 px-4 rounded-lg hover:bg-red-700 transition-colors font-medium"
              >
                <AlertTriangle className="h-5 w-5 inline mr-2" />
                Emergency Alert
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LiveTracking;
