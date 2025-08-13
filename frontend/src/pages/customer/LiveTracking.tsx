import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import Navigation from '../../components/Navigation';
import LiveTrackingMap from '../../components/LiveTrackingMap';
import { RidesAPI, TrackingAPI } from '../../lib/api';
import { ArrowLeft, Clock, MapPin, Star, Phone, MessageCircle, AlertCircle, CheckCircle, Navigation as NavIcon } from 'lucide-react';
import ChatInterface from '../../components/ChatInterface';

interface RideData {
  _id: string;
  pickup: {
    address: string;
    coordinates: [number, number];
  };
  destination: {
    address: string;
    coordinates: [number, number];
  };
  driver?: {
    _id: string;
    name: string;
    phone: string;
    rating: number;
    vehicleModel: string;
    vehicleNumber: string;
    photo?: string;
  };
  status: string;
  fare: {
    estimated: number;
    actual?: number;
  };
  vehicleType: string;
  estimatedDuration?: number;
  distance?: number;
  createdAt: string;
  assignedAt?: string;
  startedAt?: string;
  completedAt?: string;
}

const LiveTracking: React.FC = () => {
  const { rideId } = useParams<{ rideId: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();
  
  const [rideData, setRideData] = useState<RideData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentStatus, setCurrentStatus] = useState<string>('');
  const [trackingActive, setTrackingActive] = useState(false);
  const [isChatOpen, setIsChatOpen] = useState(false);

  useEffect(() => {
    if (!rideId) {
      setError('Invalid ride ID');
      setIsLoading(false);
      return;
    }

    loadRideData();
  }, [rideId]);

  const loadRideData = async () => {
    try {
      setIsLoading(true);
      const response = await RidesAPI.get(rideId!);
      
      if (response.success) {
        setRideData(response.data);
        setCurrentStatus(response.data.status);
        
        // Start tracking if ride is active
        if (['driver_assigned', 'driver_arrived', 'on_trip'].includes(response.data.status)) {
          setTrackingActive(true);
          await startTracking();
        }
      } else {
        setError('Failed to load ride data');
      }
    } catch (err: any) {
      console.error('Error loading ride:', err);
      setError(err.message || 'Failed to load ride data');
    } finally {
      setIsLoading(false);
    }
  };

  const startTracking = async () => {
    try {
      await TrackingAPI.startTracking({
        rideId: rideId!,
        customerId: user?.id
      });
    } catch (error) {
      console.error('Failed to start tracking:', error);
    }
  };

  const handleStatusUpdate = (newStatus: string) => {
    setCurrentStatus(newStatus);
    
    // Stop tracking when ride is completed or cancelled
    if (['completed', 'cancelled'].includes(newStatus)) {
      setTrackingActive(false);
      stopTracking();
    }
  };

  const stopTracking = async () => {
    try {
      await TrackingAPI.stopTracking({
        rideId: rideId!,
        reason: 'completed'
      });
    } catch (error) {
      console.error('Failed to stop tracking:', error);
    }
  };

  const getStatusInfo = (status: string) => {
    const statusMap = {
      'requested': {
        icon: Clock,
        color: 'text-yellow-600',
        bg: 'bg-yellow-50',
        border: 'border-yellow-200',
        title: 'Finding Driver',
        description: 'We are looking for a nearby driver for you'
      },
      'driver_assigned': {
        icon: CheckCircle,
        color: 'text-blue-600',
        bg: 'bg-blue-50',
        border: 'border-blue-200',
        title: 'Driver Assigned',
        description: 'Your driver is on the way to pick you up'
      },
      'driver_arrived': {
        icon: MapPin,
        color: 'text-green-600',
        bg: 'bg-green-50',
        border: 'border-green-200',
        title: 'Driver Arrived',
        description: 'Your driver has arrived at the pickup location'
      },
      'on_trip': {
        icon: NavIcon,
        color: 'text-purple-600',
        bg: 'bg-purple-50',
        border: 'border-purple-200',
        title: 'Trip Started',
        description: 'You are on your way to the destination'
      },
      'completed': {
        icon: CheckCircle,
        color: 'text-green-600',
        bg: 'bg-green-50',
        border: 'border-green-200',
        title: 'Trip Completed',
        description: 'You have reached your destination'
      },
      'cancelled': {
        icon: AlertCircle,
        color: 'text-red-600',
        bg: 'bg-red-50',
        border: 'border-red-200',
        title: 'Trip Cancelled',
        description: 'This trip has been cancelled'
      }
    };

    return statusMap[status as keyof typeof statusMap] || statusMap.requested;
  };

  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatDuration = (minutes: number) => {
    if (minutes < 60) {
      return `${minutes} mins`;
    }
    const hours = Math.floor(minutes / 60);
    const remainingMins = minutes % 60;
    return `${hours}h ${remainingMins}m`;
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/50">
        <Navigation />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !rideData) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/50">
        <Navigation />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center py-12">
            <AlertCircle className="h-16 w-16 text-red-500 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-slate-900 mb-2">Unable to Load Ride</h2>
            <p className="text-slate-600 mb-6">{error || 'Ride not found'}</p>
            <button
              onClick={() => navigate('/customer/dashboard')}
              className="bg-blue-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-blue-700 transition-colors"
            >
              Back to Dashboard
            </button>
          </div>
        </div>
      </div>
    );
  }

  const statusInfo = getStatusInfo(currentStatus);
  const StatusIcon = statusInfo.icon;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/50">
      <Navigation />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => navigate('/customer/dashboard')}
            className="flex items-center space-x-2 text-slate-600 hover:text-slate-800 mb-4 transition-colors"
          >
            <ArrowLeft className="h-5 w-5" />
            <span>Back to Dashboard</span>
          </button>
          
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-bold text-slate-900 mb-2">Live Tracking</h1>
                <p className="text-slate-600">Ride ID: {rideData._id.slice(-8).toUpperCase()}</p>
              </div>
              
              <div className={`flex items-center space-x-3 px-4 py-2 rounded-lg border ${statusInfo.bg} ${statusInfo.border}`}>
                <StatusIcon className={`h-5 w-5 ${statusInfo.color}`} />
                <div>
                  <div className={`font-medium ${statusInfo.color}`}>{statusInfo.title}</div>
                  <div className="text-sm text-slate-600">{statusInfo.description}</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Map */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
              <LiveTrackingMap
                rideId={rideId!}
                pickup={{
                  lat: rideData.pickup.coordinates[1],
                  lng: rideData.pickup.coordinates[0],
                  address: rideData.pickup.address
                }}
                destination={{
                  lat: rideData.destination.coordinates[1],
                  lng: rideData.destination.coordinates[0],
                  address: rideData.destination.address
                }}
                driver={rideData.driver ? {
                  id: rideData.driver._id,
                  name: rideData.driver.name,
                  phone: rideData.driver.phone,
                  rating: rideData.driver.rating,
                  vehicleModel: rideData.driver.vehicleModel,
                  vehicleNumber: rideData.driver.vehicleNumber,
                  photo: rideData.driver.photo
                } : undefined}
                onStatusUpdate={handleStatusUpdate}
                className="h-96 lg:h-[600px]"
              />
            </div>
          </div>

          {/* Ride Details */}
          <div className="space-y-6">
            {/* Trip Info */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-slate-900 mb-4">Trip Details</h3>
              
              <div className="space-y-4">
                <div>
                  <div className="flex items-start space-x-3">
                    <div className="w-3 h-3 bg-green-500 rounded-full mt-2"></div>
                    <div className="flex-1">
                      <div className="text-sm text-slate-500">Pickup</div>
                      <div className="font-medium text-slate-900">{rideData.pickup.address}</div>
                    </div>
                  </div>
                </div>
                
                <div>
                  <div className="flex items-start space-x-3">
                    <div className="w-3 h-3 bg-red-500 rounded-full mt-2"></div>
                    <div className="flex-1">
                      <div className="text-sm text-slate-500">Destination</div>
                      <div className="font-medium text-slate-900">{rideData.destination.address}</div>
                    </div>
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4 pt-4 border-t border-slate-200">
                  <div>
                    <div className="text-sm text-slate-500">Vehicle</div>
                    <div className="font-medium text-slate-900 capitalize">{rideData.vehicleType}</div>
                  </div>
                  <div>
                    <div className="text-sm text-slate-500">Fare</div>
                    <div className="font-medium text-slate-900">₹{rideData.fare.actual || rideData.fare.estimated}</div>
                  </div>
                  {rideData.distance && (
                    <div>
                      <div className="text-sm text-slate-500">Distance</div>
                      <div className="font-medium text-slate-900">{rideData.distance} km</div>
                    </div>
                  )}
                  {rideData.estimatedDuration && (
                    <div>
                      <div className="text-sm text-slate-500">Duration</div>
                      <div className="font-medium text-slate-900">{formatDuration(rideData.estimatedDuration)}</div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Driver Info */}
            {rideData.driver && (
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <h3 className="text-lg font-semibold text-slate-900 mb-4">Driver Information</h3>
                
                <div className="flex items-center space-x-4 mb-4">
                  <div className="w-16 h-16 bg-blue-600 rounded-full flex items-center justify-center">
                    {rideData.driver.photo ? (
                      <img 
                        src={rideData.driver.photo} 
                        alt={rideData.driver.name}
                        className="w-16 h-16 rounded-full object-cover"
                      />
                    ) : (
                      <span className="text-white font-bold text-xl">
                        {rideData.driver.name.charAt(0).toUpperCase()}
                      </span>
                    )}
                  </div>
                  
                  <div className="flex-1">
                    <div className="font-semibold text-slate-900">{rideData.driver.name}</div>
                    <div className="text-slate-600">{rideData.driver.vehicleModel}</div>
                    <div className="text-slate-600">{rideData.driver.vehicleNumber}</div>
                    <div className="flex items-center space-x-1 mt-1">
                      <Star className="h-4 w-4 text-yellow-500 fill-current" />
                      <span className="text-sm text-slate-600">{rideData.driver.rating}</span>
                    </div>
                  </div>
                </div>
                
                <div className="flex space-x-3">
                  <button
                    onClick={() => window.open(`tel:${rideData.driver!.phone}`)}
                    className="flex-1 bg-green-600 text-white py-2 px-4 rounded-lg font-medium hover:bg-green-700 transition-colors flex items-center justify-center space-x-2"
                  >
                    <Phone className="h-4 w-4" />
                    <span>Call</span>
                  </button>
                  <button
                    onClick={() => setIsChatOpen(true)}
                    className="flex-1 bg-blue-500 text-white py-2 px-4 rounded-lg font-medium hover:bg-blue-600 transition-colors flex items-center justify-center space-x-2"
                  >
                    <MessageCircle className="h-4 w-4" />
                    <span>Chat</span>
                  </button>
                </div>
              </div>
            )}

            {/* Timeline */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-slate-900 mb-4">Trip Timeline</h3>
              
              <div className="space-y-3">
                <div className="flex items-center space-x-3">
                  <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                  <div className="flex-1">
                    <div className="text-sm font-medium text-slate-900">Ride Requested</div>
                    <div className="text-xs text-slate-500">{formatTime(rideData.createdAt)}</div>
                  </div>
                </div>
                
                {rideData.assignedAt && (
                  <div className="flex items-center space-x-3">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    <div className="flex-1">
                      <div className="text-sm font-medium text-slate-900">Driver Assigned</div>
                      <div className="text-xs text-slate-500">{formatTime(rideData.assignedAt)}</div>
                    </div>
                  </div>
                )}
                
                {rideData.startedAt && (
                  <div className="flex items-center space-x-3">
                    <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                    <div className="flex-1">
                      <div className="text-sm font-medium text-slate-900">Trip Started</div>
                      <div className="text-xs text-slate-500">{formatTime(rideData.startedAt)}</div>
                    </div>
                  </div>
                )}
                
                {rideData.completedAt && (
                  <div className="flex items-center space-x-3">
                    <div className="w-2 h-2 bg-green-600 rounded-full"></div>
                    <div className="flex-1">
                      <div className="text-sm font-medium text-slate-900">Trip Completed</div>
                      <div className="text-xs text-slate-500">{formatTime(rideData.completedAt)}</div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Chat Interface */}
      {rideData.driver && (
        <ChatInterface
          rideId={rideId!}
          isOpen={isChatOpen}
          onClose={() => setIsChatOpen(false)}
          otherParty={{
            id: rideData.driver._id,
            name: rideData.driver.name,
            type: 'driver',
            avatar: rideData.driver.photo
          }}
        />
      )}
    </div>
  );
};

export default LiveTracking;
