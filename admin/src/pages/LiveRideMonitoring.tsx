import React, { useState, useEffect } from 'react';
import { 
  Map, Navigation, Clock, Users, Car, AlertTriangle, 
  Play, Pause, RotateCcw, Eye, MessageSquare, Phone, 
  MapPin, CheckCircle, XCircle, UserX
} from 'lucide-react';

interface RideTracking {
  location: {
    coordinates: [number, number];
    timestamp: string;
  };
  speed: number;
  heading: number;
}

interface ActiveRide {
  _id: string;
  status: 'requested' | 'accepted' | 'driver_arrived' | 'on-trip' | 'completed' | 'cancelled';
  customer: {
    _id: string;
    name: string;
    phone: string;
  };
  driver?: {
    _id: string;
    name: string;
    phone: string;
  };
  pickup: {
    address: string;
    coordinates: [number, number];
  };
  destination: {
    address: string;
    coordinates: [number, number];
  };
  fare: {
    estimated: number;
    actual?: number;
  };
  vehicleType: string;
  createdAt: string;
  acceptedAt?: string;
  startedAt?: string;
  tracking?: RideTracking;
  estimatedArrival?: number;
}

interface RideStats {
  totalActiveRides: number;
  ridesRequested: number;
  ridesInProgress: number;
  ridesCompleted: number;
  avgWaitTime: number;
  avgTripTime: number;
}

const LiveRideMonitoring: React.FC = () => {
  const [activeRides, setActiveRides] = useState<ActiveRide[]>([]);
  const [selectedRide, setSelectedRide] = useState<ActiveRide | null>(null);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<RideStats>({
    totalActiveRides: 0,
    ridesRequested: 0,
    ridesInProgress: 0,
    ridesCompleted: 0,
    avgWaitTime: 0,
    avgTripTime: 0
  });
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [showMap, setShowMap] = useState(false);
  const [statusFilter, setStatusFilter] = useState('all');

  // Load active rides
  useEffect(() => {
    loadActiveRides();
    loadRideStats();
  }, [statusFilter]);

  // Auto refresh every 10 seconds
  useEffect(() => {
    if (!autoRefresh) return;

    const interval = setInterval(() => {
      loadActiveRides();
      loadRideStats();
    }, 10000);

    return () => clearInterval(interval);
  }, [autoRefresh, statusFilter]);

  const loadActiveRides = async () => {
    try {
      setLoading(true);
      
      // Mock data for active rides
      const mockRides: ActiveRide[] = [
        {
          _id: '1',
          status: 'on-trip',
          customer: {
            _id: 'c1',
            name: 'John Doe',
            phone: '+91 9876543210'
          },
          driver: {
            _id: 'd1',
            name: 'Rajesh Kumar',
            phone: '+91 9876543211'
          },
          pickup: {
            address: 'Connaught Place, New Delhi',
            coordinates: [77.2167, 28.6269]
          },
          destination: {
            address: 'India Gate, New Delhi',
            coordinates: [77.2295, 28.6129]
          },
          fare: {
            estimated: 150,
            actual: 145
          },
          vehicleType: 'hatchback',
          createdAt: '2024-01-15T10:30:00Z',
          acceptedAt: '2024-01-15T10:32:00Z',
          startedAt: '2024-01-15T10:45:00Z',
          tracking: {
            location: {
              coordinates: [77.2200, 28.6200],
              timestamp: '2024-01-15T11:05:00Z'
            },
            speed: 25,
            heading: 45
          },
          estimatedArrival: 8
        },
        {
          _id: '2',
          status: 'accepted',
          customer: {
            _id: 'c2',
            name: 'Priya Sharma',
            phone: '+91 9876543212'
          },
          driver: {
            _id: 'd2',
            name: 'Amit Singh',
            phone: '+91 9876543213'
          },
          pickup: {
            address: 'Karol Bagh Metro Station',
            coordinates: [77.1924, 28.6507]
          },
          destination: {
            address: 'Rajouri Garden Metro Station',
            coordinates: [77.1208, 28.6469]
          },
          fare: {
            estimated: 280
          },
          vehicleType: 'sedan',
          createdAt: '2024-01-15T11:10:00Z',
          acceptedAt: '2024-01-15T11:12:00Z',
          tracking: {
            location: {
              coordinates: [77.1850, 28.6450],
              timestamp: '2024-01-15T11:15:00Z'
            },
            speed: 0,
            heading: 180
          },
          estimatedArrival: 5
        },
        {
          _id: '3',
          status: 'requested',
          customer: {
            _id: 'c3',
            name: 'Mike Johnson',
            phone: '+91 9876543214'
          },
          pickup: {
            address: 'DLF Cyber City, Gurgaon',
            coordinates: [77.0886, 28.4950]
          },
          destination: {
            address: 'IGI Airport Terminal 3',
            coordinates: [77.1025, 28.5562]
          },
          fare: {
            estimated: 420
          },
          vehicleType: 'suv',
          createdAt: '2024-01-15T11:18:00Z'
        }
      ];

      // Filter rides based on status filter
      const filteredRides = statusFilter === 'all' 
        ? mockRides 
        : mockRides.filter(ride => ride.status === statusFilter);

      setActiveRides(filteredRides);
    } catch (error) {
      console.error('Failed to load active rides:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadRideStats = async () => {
    try {
      // Mock stats data
      setStats({
        totalActiveRides: 23,
        ridesRequested: 5,
        ridesInProgress: 18,
        ridesCompleted: 156,
        avgWaitTime: 4.2,
        avgTripTime: 18.5
      });
    } catch (error) {
      console.error('Failed to load ride stats:', error);
    }
  };

  const handleAssignDriver = async (rideId: string) => {
    try {
      // Mock driver assignment
      console.log('Assigning driver to ride:', rideId);
      
      setActiveRides(prev => prev.map(ride => 
        ride._id === rideId 
          ? { 
              ...ride, 
              status: 'accepted',
              driver: {
                _id: 'd_new',
                name: 'Auto Assigned Driver',
                phone: '+91 9876543999'
              },
              acceptedAt: new Date().toISOString()
            }
          : ride
      ));
    } catch (error) {
      console.error('Failed to assign driver:', error);
    }
  };

  const handleCancelRide = async (rideId: string, reason: string) => {
    try {
      // Mock ride cancellation
      console.log('Cancelling ride:', rideId, 'Reason:', reason);
      
      setActiveRides(prev => prev.filter(ride => ride._id !== rideId));
    } catch (error) {
      console.error('Failed to cancel ride:', error);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'requested': return 'text-yellow-600 bg-yellow-100';
      case 'accepted': return 'text-blue-600 bg-blue-100';
      case 'driver_arrived': return 'text-purple-600 bg-purple-100';
      case 'on-trip': return 'text-green-600 bg-green-100';
      case 'completed': return 'text-gray-600 bg-gray-100';
      case 'cancelled': return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'requested': return <Clock className="h-4 w-4" />;
      case 'accepted': return <CheckCircle className="h-4 w-4" />;
      case 'driver_arrived': return <MapPin className="h-4 w-4" />;
      case 'on-trip': return <Car className="h-4 w-4" />;
      case 'completed': return <CheckCircle className="h-4 w-4" />;
      case 'cancelled': return <XCircle className="h-4 w-4" />;
      default: return <Clock className="h-4 w-4" />;
    }
  };

  const RideDetailsModal: React.FC<{ ride: ActiveRide; onClose: () => void }> = ({ ride, onClose }) => (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold text-gray-900">Ride Details</h2>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              ×
            </button>
          </div>
        </div>

        <div className="p-6 space-y-6">
          {/* Status */}
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <span className={`px-3 py-1 rounded-full text-sm font-medium flex items-center space-x-2 ${getStatusColor(ride.status)}`}>
                {getStatusIcon(ride.status)}
                <span>{ride.status.replace('_', ' ').toUpperCase()}</span>
              </span>
              {ride.tracking && (
                <span className="text-sm text-gray-500">
                  Speed: {ride.tracking.speed} km/h
                </span>
              )}
            </div>
            {ride.estimatedArrival && (
              <span className="text-sm font-medium text-blue-600">
                ETA: {ride.estimatedArrival} min
              </span>
            )}
          </div>

          {/* Route */}
          <div>
            <h3 className="font-semibold text-gray-900 mb-3">Route</h3>
            <div className="space-y-3">
              <div className="flex items-start space-x-3">
                <div className="w-3 h-3 bg-green-500 rounded-full mt-2"></div>
                <div>
                  <div className="font-medium">Pickup</div>
                  <div className="text-sm text-gray-600">{ride.pickup.address}</div>
                </div>
              </div>
              <div className="flex items-start space-x-3">
                <div className="w-3 h-3 bg-red-500 rounded-full mt-2"></div>
                <div>
                  <div className="font-medium">Destination</div>
                  <div className="text-sm text-gray-600">{ride.destination.address}</div>
                </div>
              </div>
            </div>
          </div>

          {/* Customer & Driver Info */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h3 className="font-semibold text-gray-900 mb-3">Customer</h3>
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                  <Users className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                  <div className="font-medium">{ride.customer.name}</div>
                  <div className="text-sm text-gray-600">{ride.customer.phone}</div>
                </div>
              </div>
            </div>

            {ride.driver && (
              <div>
                <h3 className="font-semibold text-gray-900 mb-3">Driver</h3>
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                    <Car className="h-5 w-5 text-green-600" />
                  </div>
                  <div>
                    <div className="font-medium">{ride.driver.name}</div>
                    <div className="text-sm text-gray-600">{ride.driver.phone}</div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Timing */}
          <div>
            <h3 className="font-semibold text-gray-900 mb-3">Timeline</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">Requested:</span>
                <span>{new Date(ride.createdAt).toLocaleString()}</span>
              </div>
              {ride.acceptedAt && (
                <div className="flex justify-between">
                  <span className="text-gray-600">Accepted:</span>
                  <span>{new Date(ride.acceptedAt).toLocaleString()}</span>
                </div>
              )}
              {ride.startedAt && (
                <div className="flex justify-between">
                  <span className="text-gray-600">Started:</span>
                  <span>{new Date(ride.startedAt).toLocaleString()}</span>
                </div>
              )}
            </div>
          </div>

          {/* Fare */}
          <div>
            <h3 className="font-semibold text-gray-900 mb-3">Fare Details</h3>
            <div className="bg-gray-50 rounded-lg p-4">
              <div className="flex justify-between items-center">
                <span>Estimated Fare:</span>
                <span className="font-medium">₹{ride.fare.estimated}</span>
              </div>
              {ride.fare.actual && (
                <div className="flex justify-between items-center mt-2">
                  <span>Actual Fare:</span>
                  <span className="font-medium">₹{ride.fare.actual}</span>
                </div>
              )}
              <div className="text-sm text-gray-600 mt-2">
                Vehicle: {ride.vehicleType.charAt(0).toUpperCase() + ride.vehicleType.slice(1)}
              </div>
            </div>
          </div>
        </div>

        <div className="p-6 border-t border-gray-200 flex justify-end space-x-3">
          <button
            onClick={onClose}
            className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
          >
            Close
          </button>
          
          {ride.status === 'requested' && (
            <button
              onClick={() => handleAssignDriver(ride._id)}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Assign Driver
            </button>
          )}
          
          {['requested', 'accepted', 'driver_arrived'].includes(ride.status) && (
            <button
              onClick={() => {
                const reason = prompt('Enter cancellation reason:');
                if (reason) {
                  handleCancelRide(ride._id, reason);
                  onClose();
                }
              }}
              className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
            >
              Cancel Ride
            </button>
          )}
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Live Ride Monitoring</h1>
              <p className="text-gray-600">Real-time tracking and management of active rides</p>
            </div>

            <div className="flex items-center space-x-3">
              <button
                onClick={() => setAutoRefresh(!autoRefresh)}
                className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-colors ${
                  autoRefresh 
                    ? 'bg-green-600 text-white hover:bg-green-700' 
                    : 'border border-gray-300 text-gray-700 hover:bg-gray-50'
                }`}
              >
                {autoRefresh ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                <span>{autoRefresh ? 'Auto Refresh ON' : 'Auto Refresh OFF'}</span>
              </button>
              
              <button
                onClick={() => {
                  loadActiveRides();
                  loadRideStats();
                }}
                className="flex items-center space-x-2 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <RotateCcw className="h-4 w-4" />
                <span>Refresh</span>
              </button>

              <button
                onClick={() => setShowMap(!showMap)}
                className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-colors ${
                  showMap 
                    ? 'bg-blue-600 text-white hover:bg-blue-700' 
                    : 'border border-gray-300 text-gray-700 hover:bg-gray-50'
                }`}
              >
                <Map className="h-4 w-4" />
                <span>Map View</span>
              </button>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-6 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center">
              <div className="bg-blue-100 p-3 rounded-full">
                <Car className="h-6 w-6 text-blue-600" />
              </div>
              <div className="ml-4">
                <div className="text-2xl font-bold text-gray-900">{stats.totalActiveRides}</div>
                <div className="text-gray-600">Active Rides</div>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center">
              <div className="bg-yellow-100 p-3 rounded-full">
                <Clock className="h-6 w-6 text-yellow-600" />
              </div>
              <div className="ml-4">
                <div className="text-2xl font-bold text-gray-900">{stats.ridesRequested}</div>
                <div className="text-gray-600">Requested</div>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center">
              <div className="bg-green-100 p-3 rounded-full">
                <Navigation className="h-6 w-6 text-green-600" />
              </div>
              <div className="ml-4">
                <div className="text-2xl font-bold text-gray-900">{stats.ridesInProgress}</div>
                <div className="text-gray-600">In Progress</div>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center">
              <div className="bg-purple-100 p-3 rounded-full">
                <CheckCircle className="h-6 w-6 text-purple-600" />
              </div>
              <div className="ml-4">
                <div className="text-2xl font-bold text-gray-900">{stats.ridesCompleted}</div>
                <div className="text-gray-600">Completed</div>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center">
              <div className="bg-orange-100 p-3 rounded-full">
                <Clock className="h-6 w-6 text-orange-600" />
              </div>
              <div className="ml-4">
                <div className="text-2xl font-bold text-gray-900">{stats.avgWaitTime}</div>
                <div className="text-gray-600">Avg Wait (min)</div>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center">
              <div className="bg-red-100 p-3 rounded-full">
                <Navigation className="h-6 w-6 text-red-600" />
              </div>
              <div className="ml-4">
                <div className="text-2xl font-bold text-gray-900">{stats.avgTripTime}</div>
                <div className="text-gray-600">Avg Trip (min)</div>
              </div>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Status Filter</label>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="all">All Status</option>
                  <option value="requested">Requested</option>
                  <option value="accepted">Accepted</option>
                  <option value="driver_arrived">Driver Arrived</option>
                  <option value="on-trip">On Trip</option>
                </select>
              </div>
            </div>

            <div className="text-sm text-gray-500">
              Last updated: {new Date().toLocaleTimeString()}
              {autoRefresh && <span className="ml-2">(Auto-refreshing)</span>}
            </div>
          </div>
        </div>

        {/* Rides List */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Ride Info
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Customer
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Driver
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    ETA
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Fare
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {loading ? (
                  <tr>
                    <td colSpan={7} className="px-6 py-12 text-center">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                      <p className="text-gray-500 mt-2">Loading rides...</p>
                    </td>
                  </tr>
                ) : activeRides.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-6 py-12 text-center">
                      <Car className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                      <p className="text-gray-500">No active rides found</p>
                    </td>
                  </tr>
                ) : (
                  activeRides.map((ride) => (
                    <tr key={ride._id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm">
                          <div className="font-medium text-gray-900">#{ride._id}</div>
                          <div className="text-gray-500 capitalize">{ride.vehicleType}</div>
                          <div className="text-xs text-gray-400">
                            {new Date(ride.createdAt).toLocaleTimeString()}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm">
                          <div className="font-medium text-gray-900">{ride.customer.name}</div>
                          <div className="text-gray-500">{ride.customer.phone}</div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {ride.driver ? (
                          <div className="text-sm">
                            <div className="font-medium text-gray-900">{ride.driver.name}</div>
                            <div className="text-gray-500">{ride.driver.phone}</div>
                          </div>
                        ) : (
                          <div className="flex items-center text-gray-400">
                            <UserX className="h-4 w-4 mr-1" />
                            <span className="text-sm">Not assigned</span>
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium flex items-center space-x-1 w-fit ${getStatusColor(ride.status)}`}>
                          {getStatusIcon(ride.status)}
                          <span>{ride.status.replace('_', ' ')}</span>
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {ride.estimatedArrival ? `${ride.estimatedArrival} min` : '-'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        ₹{ride.fare.actual || ride.fare.estimated}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <div className="flex items-center space-x-2">
                          <button
                            onClick={() => setSelectedRide(ride)}
                            className="text-blue-600 hover:text-blue-900"
                            title="View Details"
                          >
                            <Eye className="h-4 w-4" />
                          </button>
                          
                          {ride.customer.phone && (
                            <a
                              href={`tel:${ride.customer.phone}`}
                              className="text-green-600 hover:text-green-900"
                              title="Call Customer"
                            >
                              <Phone className="h-4 w-4" />
                            </a>
                          )}
                          
                          {ride.driver?.phone && (
                            <a
                              href={`tel:${ride.driver.phone}`}
                              className="text-blue-600 hover:text-blue-900"
                              title="Call Driver"
                            >
                              <Phone className="h-4 w-4" />
                            </a>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Ride Details Modal */}
      {selectedRide && (
        <RideDetailsModal 
          ride={selectedRide} 
          onClose={() => setSelectedRide(null)} 
        />
      )}
    </div>
  );
};

export default LiveRideMonitoring;
