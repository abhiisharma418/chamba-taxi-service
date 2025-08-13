import React, { useState, useEffect } from 'react';
import { Calendar, Clock, MapPin, User, Car, AlertCircle, CheckCircle, X } from 'lucide-react';

interface ScheduledRide {
  _id: string;
  rideId: string;
  customerId: {
    _id: string;
    name: string;
    phoneNumber: string;
    email: string;
  };
  driverId?: {
    _id: string;
    name: string;
    phoneNumber: string;
  };
  vehicleType: 'car' | 'bike' | 'premium' | 'xl';
  pickupLocation: {
    address: string;
    coordinates: {
      latitude: number;
      longitude: number;
    };
  };
  destinationLocation: {
    address: string;
    coordinates: {
      latitude: number;
      longitude: number;
    };
  };
  scheduledDateTime: string;
  status: 'scheduled' | 'confirmed' | 'driver_assigned' | 'started' | 'completed' | 'cancelled' | 'failed';
  priority: 'normal' | 'high' | 'urgent';
  fareEstimate: {
    totalEstimate: number;
    currency: string;
  };
  passengerCount: number;
  estimatedDistance: number;
  estimatedDuration: number;
  createdAt: string;
  updatedAt: string;
}

interface ScheduledRideStats {
  total: number;
  totalRevenue: number;
  avgFare: number;
  byStatus: Record<string, number>;
  byVehicleType: Record<string, number>;
  byPriority: Record<string, number>;
  timeframe: string;
}

const ScheduledRidesManagement: React.FC = () => {
  const [rides, setRides] = useState<ScheduledRide[]>([]);
  const [stats, setStats] = useState<ScheduledRideStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedRide, setSelectedRide] = useState<ScheduledRide | null>(null);
  const [filter, setFilter] = useState('all');
  const [timeframe, setTimeframe] = useState('week');
  const [showAssignDriver, setShowAssignDriver] = useState<string | null>(null);

  useEffect(() => {
    loadData();
  }, [filter, timeframe]);

  const loadData = async () => {
    setLoading(true);
    try {
      // Load pending rides and statistics
      const [ridesResponse, statsResponse] = await Promise.all([
        fetch(`/api/scheduled-rides/admin/pending?priority=${filter}`),
        fetch(`/api/scheduled-rides/admin/stats?timeframe=${timeframe}`)
      ]);

      const ridesData = await ridesResponse.json();
      const statsData = await statsResponse.json();

      if (ridesData.success) {
        setRides(ridesData.data.rides);
      }

      if (statsData.success) {
        setStats(statsData.data);
      }
    } catch (error) {
      console.error('Failed to load scheduled rides data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'scheduled': return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300';
      case 'confirmed': return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300';
      case 'driver_assigned': return 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300';
      case 'started': return 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900/30 dark:text-indigo-300';
      case 'completed': return 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300';
      case 'cancelled': return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-300';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent': return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300';
      case 'high': return 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300';
      default: return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300';
    }
  };

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getTimeUntilScheduled = (scheduledDateTime: string) => {
    const now = new Date();
    const scheduled = new Date(scheduledDateTime);
    const diff = scheduled.getTime() - now.getTime();

    if (diff < 0) return 'Past due';

    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

    if (hours > 0) return `${hours}h ${minutes}m`;
    return `${minutes}m`;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/50 dark:from-dark-surface dark:via-dark-100 dark:to-dark-200 transition-colors duration-300 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="bg-white/80 dark:bg-dark-card/80 backdrop-blur-sm rounded-3xl p-8 shadow-lg dark:shadow-dark-lg">
            <div className="animate-pulse">
              <div className="h-8 bg-gray-200 dark:bg-dark-200 rounded w-1/3 mb-6"></div>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
                {[...Array(4)].map((_, i) => (
                  <div key={i} className="h-24 bg-gray-200 dark:bg-dark-200 rounded-xl"></div>
                ))}
              </div>
              <div className="space-y-4">
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="h-32 bg-gray-200 dark:bg-dark-200 rounded-xl"></div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/50 dark:from-dark-surface dark:via-dark-100 dark:to-dark-200 transition-colors duration-300 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="bg-white/80 dark:bg-dark-card/80 backdrop-blur-sm rounded-3xl p-8 shadow-lg dark:shadow-dark-lg border border-gray-100 dark:border-dark-border">
          <h1 className="text-3xl font-bold mb-8 bg-gradient-to-r from-slate-900 to-slate-700 dark:from-dark-800 dark:to-dark-600 bg-clip-text text-transparent">
            Scheduled Rides Management
          </h1>

          {/* Statistics */}
          {stats && (
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
              <div className="bg-white/60 dark:bg-dark-100/60 backdrop-blur-sm rounded-xl p-6 border border-gray-200 dark:border-dark-border">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">{stats.total}</p>
                    <p className="text-sm text-gray-600 dark:text-dark-500">Total Rides</p>
                  </div>
                  <Calendar className="w-8 h-8 text-blue-500" />
                </div>
              </div>

              <div className="bg-white/60 dark:bg-dark-100/60 backdrop-blur-sm rounded-xl p-6 border border-gray-200 dark:border-dark-border">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-2xl font-bold text-green-600 dark:text-green-400">
                      ${stats.totalRevenue.toFixed(0)}
                    </p>
                    <p className="text-sm text-gray-600 dark:text-dark-500">Revenue</p>
                  </div>
                  <div className="text-2xl">���</div>
                </div>
              </div>

              <div className="bg-white/60 dark:bg-dark-100/60 backdrop-blur-sm rounded-xl p-6 border border-gray-200 dark:border-dark-border">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                      ${stats.avgFare.toFixed(2)}
                    </p>
                    <p className="text-sm text-gray-600 dark:text-dark-500">Avg Fare</p>
                  </div>
                  <div className="text-2xl">📊</div>
                </div>
              </div>

              <div className="bg-white/60 dark:bg-dark-100/60 backdrop-blur-sm rounded-xl p-6 border border-gray-200 dark:border-dark-border">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-2xl font-bold text-orange-600 dark:text-orange-400">
                      {stats.byPriority.urgent || 0}
                    </p>
                    <p className="text-sm text-gray-600 dark:text-dark-500">Urgent</p>
                  </div>
                  <AlertCircle className="w-8 h-8 text-orange-500" />
                </div>
              </div>
            </div>
          )}

          {/* Filters */}
          <div className="flex justify-between items-center mb-6">
            <div className="flex space-x-2">
              {['all', 'urgent', 'high', 'normal'].map((priority) => (
                <button
                  key={priority}
                  onClick={() => setFilter(priority)}
                  className={`px-4 py-2 rounded-lg font-semibold transition-all duration-300 ${
                    filter === priority
                      ? 'bg-blue-600 text-white shadow-lg'
                      : 'text-gray-600 dark:text-dark-500 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20'
                  }`}
                >
                  {priority === 'all' ? 'All' : priority.charAt(0).toUpperCase() + priority.slice(1)}
                </button>
              ))}
            </div>

            <select
              value={timeframe}
              onChange={(e) => setTimeframe(e.target.value)}
              className="px-4 py-2 bg-white dark:bg-dark-100 border border-gray-300 dark:border-dark-border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="today">Today</option>
              <option value="week">This Week</option>
              <option value="month">This Month</option>
              <option value="quarter">This Quarter</option>
            </select>
          </div>

          {/* Rides List */}
          <div className="space-y-4">
            {rides.length === 0 ? (
              <div className="text-center py-12">
                <Calendar className="w-16 h-16 text-gray-400 dark:text-dark-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 dark:text-dark-800 mb-2">No Scheduled Rides</h3>
                <p className="text-gray-600 dark:text-dark-500">No rides match your current filters.</p>
              </div>
            ) : (
              rides.map((ride) => (
                <div
                  key={ride._id}
                  className="bg-white/60 dark:bg-dark-100/60 backdrop-blur-sm rounded-xl p-6 border border-gray-200 dark:border-dark-border hover:shadow-md dark:hover:shadow-dark-md transition-all duration-200"
                >
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-2">
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-dark-800">
                          {ride.rideId}
                        </h3>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(ride.status)}`}>
                          {ride.status.replace('_', ' ').toUpperCase()}
                        </span>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getPriorityColor(ride.priority)}`}>
                          {ride.priority.toUpperCase()}
                        </span>
                      </div>

                      <div className="flex items-center text-sm text-gray-600 dark:text-dark-500 mb-2">
                        <Calendar className="w-4 h-4 mr-1" />
                        {formatDateTime(ride.scheduledDateTime)}
                        <span className="mx-2">•</span>
                        <Clock className="w-4 h-4 mr-1" />
                        {getTimeUntilScheduled(ride.scheduledDateTime)}
                      </div>
                    </div>

                    <div className="flex space-x-2">
                      <button
                        onClick={() => setSelectedRide(ride)}
                        className="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm transition-colors"
                      >
                        View Details
                      </button>
                      
                      {!ride.driverId && ride.status === 'scheduled' && (
                        <button
                          onClick={() => setShowAssignDriver(ride._id)}
                          className="px-3 py-1 bg-green-600 hover:bg-green-700 text-white rounded-lg text-sm transition-colors"
                        >
                          Assign Driver
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Route Information */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                    <div className="flex items-start space-x-3">
                      <div className="w-3 h-3 bg-green-500 rounded-full mt-1.5"></div>
                      <div className="flex-1">
                        <p className="text-sm font-medium text-gray-900 dark:text-dark-800">Pickup</p>
                        <p className="text-sm text-gray-600 dark:text-dark-500">{ride.pickupLocation.address}</p>
                      </div>
                    </div>
                    
                    <div className="flex items-start space-x-3">
                      <div className="w-3 h-3 bg-red-500 rounded-full mt-1.5"></div>
                      <div className="flex-1">
                        <p className="text-sm font-medium text-gray-900 dark:text-dark-800">Destination</p>
                        <p className="text-sm text-gray-600 dark:text-dark-500">{ride.destinationLocation.address}</p>
                      </div>
                    </div>
                  </div>

                  {/* Customer and Details */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="flex items-center space-x-2">
                      <User className="w-4 h-4 text-gray-500 dark:text-dark-500" />
                      <div>
                        <p className="text-sm font-medium text-gray-900 dark:text-dark-800">{ride.customerId.name}</p>
                        <p className="text-xs text-gray-600 dark:text-dark-500">{ride.customerId.phoneNumber}</p>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <Car className="w-4 h-4 text-gray-500 dark:text-dark-500" />
                      <span className="text-sm text-gray-600 dark:text-dark-500">
                        {ride.vehicleType.toUpperCase()}
                      </span>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <span className="text-sm text-gray-600 dark:text-dark-500">
                        ${ride.fareEstimate.totalEstimate.toFixed(2)}
                      </span>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <MapPin className="w-4 h-4 text-gray-500 dark:text-dark-500" />
                      <span className="text-sm text-gray-600 dark:text-dark-500">
                        {ride.estimatedDistance.toFixed(1)} km
                      </span>
                    </div>
                  </div>

                  {/* Driver Information */}
                  {ride.driverId && (
                    <div className="mt-4 flex items-center space-x-3 p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
                      <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400" />
                      <div>
                        <p className="text-sm font-medium text-green-900 dark:text-green-300">
                          Driver: {ride.driverId.name}
                        </p>
                        <p className="text-xs text-green-700 dark:text-green-400">
                          {ride.driverId.phoneNumber}
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Ride Details Modal */}
      {selectedRide && (
        <div className="fixed inset-0 bg-black/50 dark:bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-dark-card rounded-3xl shadow-2xl dark:shadow-dark-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-dark-border">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-dark-800">
                Ride Details - {selectedRide.rideId}
              </h2>
              <button
                onClick={() => setSelectedRide(null)}
                className="p-2 hover:bg-gray-100 dark:hover:bg-dark-100 rounded-xl transition-colors"
              >
                <X className="w-6 h-6 text-gray-500 dark:text-dark-500" />
              </button>
            </div>

            <div className="p-6 space-y-6">
              {/* Customer Information */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-dark-800 mb-3">Customer Information</h3>
                <div className="bg-gray-50 dark:bg-dark-100 rounded-xl p-4">
                  <p><strong>Name:</strong> {selectedRide.customerId.name}</p>
                  <p><strong>Phone:</strong> {selectedRide.customerId.phoneNumber}</p>
                  <p><strong>Email:</strong> {selectedRide.customerId.email}</p>
                </div>
              </div>

              {/* Trip Details */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-dark-800 mb-3">Trip Details</h3>
                <div className="space-y-3">
                  <div className="flex items-start space-x-3">
                    <div className="w-3 h-3 bg-green-500 rounded-full mt-1.5"></div>
                    <div>
                      <p className="font-medium">Pickup</p>
                      <p className="text-gray-600 dark:text-dark-500">{selectedRide.pickupLocation.address}</p>
                    </div>
                  </div>
                  <div className="flex items-start space-x-3">
                    <div className="w-3 h-3 bg-red-500 rounded-full mt-1.5"></div>
                    <div>
                      <p className="font-medium">Destination</p>
                      <p className="text-gray-600 dark:text-dark-500">{selectedRide.destinationLocation.address}</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Schedule & Status */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h4 className="font-semibold mb-2">Schedule</h4>
                  <p>{formatDateTime(selectedRide.scheduledDateTime)}</p>
                  <p className="text-sm text-gray-500">{getTimeUntilScheduled(selectedRide.scheduledDateTime)}</p>
                </div>
                <div>
                  <h4 className="font-semibold mb-2">Status</h4>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(selectedRide.status)}`}>
                    {selectedRide.status.replace('_', ' ').toUpperCase()}
                  </span>
                </div>
              </div>

              {/* Additional Details */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h4 className="font-semibold mb-2">Vehicle Type</h4>
                  <p>{selectedRide.vehicleType.toUpperCase()}</p>
                </div>
                <div>
                  <h4 className="font-semibold mb-2">Passengers</h4>
                  <p>{selectedRide.passengerCount}</p>
                </div>
                <div>
                  <h4 className="font-semibold mb-2">Distance</h4>
                  <p>{selectedRide.estimatedDistance.toFixed(1)} km</p>
                </div>
                <div>
                  <h4 className="font-semibold mb-2">Fare</h4>
                  <p>${selectedRide.fareEstimate.totalEstimate.toFixed(2)}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ScheduledRidesManagement;
