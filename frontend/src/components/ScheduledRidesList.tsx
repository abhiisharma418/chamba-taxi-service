import React, { useState, useEffect } from 'react';
import { Calendar, Clock, MapPin, Car, Users, DollarSign, Edit3, Trash2, MoreVertical, Eye } from 'lucide-react';
import { scheduledRideService, ScheduledRide } from '../services/scheduledRideService';

interface ScheduledRidesListProps {
  upcoming?: boolean;
  limit?: number;
  onEditRide?: (ride: ScheduledRide) => void;
  onViewRide?: (ride: ScheduledRide) => void;
}

const ScheduledRidesList: React.FC<ScheduledRidesListProps> = ({
  upcoming = false,
  limit = 10,
  onEditRide,
  onViewRide
}) => {
  const [rides, setRides] = useState<ScheduledRide[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState<any>(null);
  const [showActions, setShowActions] = useState<string | null>(null);

  useEffect(() => {
    loadRides();
  }, [filter, page, upcoming]);

  const loadRides = async () => {
    try {
      setLoading(true);
      const response = await scheduledRideService.getScheduledRides({
        status: filter === 'all' ? undefined : filter,
        page,
        limit,
        upcoming
      });

      setRides(response.data.rides);
      setPagination(response.data.pagination);
    } catch (error) {
      console.error('Failed to load scheduled rides:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCancelRide = async (rideId: string, reason?: string) => {
    const confirmCancel = window.confirm(
      'Are you sure you want to cancel this scheduled ride? Cancellation fees may apply.'
    );

    if (!confirmCancel) return;

    try {
      await scheduledRideService.cancelScheduledRide(rideId, reason);
      loadRides(); // Refresh the list
      alert('Ride cancelled successfully');
    } catch (error: any) {
      alert(error.message || 'Failed to cancel ride');
    }
  };

  const getStatusBadge = (status: ScheduledRide['status']) => {
    const colorClass = scheduledRideService.getStatusColor(status);
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${colorClass}`}>
        {status.replace('_', ' ').toUpperCase()}
      </span>
    );
  };

  const getPriorityBadge = (priority: ScheduledRide['priority']) => {
    const colorClass = scheduledRideService.getPriorityColor(priority);
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${colorClass}`}>
        {priority.toUpperCase()}
      </span>
    );
  };

  if (loading) {
    return (
      <div className="space-y-4">
        {[...Array(3)].map((_, index) => (
          <div key={index} className="bg-white dark:bg-dark-card rounded-xl p-6 shadow-sm dark:shadow-dark-md animate-pulse">
            <div className="flex justify-between items-start mb-4">
              <div className="space-y-2">
                <div className="h-5 bg-gray-200 dark:bg-dark-200 rounded w-32"></div>
                <div className="h-4 bg-gray-200 dark:bg-dark-200 rounded w-48"></div>
              </div>
              <div className="h-6 bg-gray-200 dark:bg-dark-200 rounded w-20"></div>
            </div>
            <div className="space-y-2">
              <div className="h-4 bg-gray-200 dark:bg-dark-200 rounded w-full"></div>
              <div className="h-4 bg-gray-200 dark:bg-dark-200 rounded w-3/4"></div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (rides.length === 0) {
    return (
      <div className="text-center py-12">
        <Calendar className="w-16 h-16 text-gray-400 dark:text-dark-400 mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-gray-900 dark:text-dark-800 mb-2">
          {upcoming ? 'No Upcoming Rides' : 'No Scheduled Rides'}
        </h3>
        <p className="text-gray-600 dark:text-dark-500">
          {upcoming 
            ? 'You don\'t have any upcoming scheduled rides.' 
            : 'You haven\'t scheduled any rides yet.'}
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Filter Tabs */}
      {!upcoming && (
        <div className="flex space-x-1 bg-gray-100 dark:bg-dark-100 rounded-xl p-1">
          {['all', 'scheduled', 'confirmed', 'driver_assigned', 'completed', 'cancelled'].map((status) => (
            <button
              key={status}
              onClick={() => {
                setFilter(status);
                setPage(1);
              }}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                filter === status
                  ? 'bg-white dark:bg-dark-card text-blue-600 dark:text-blue-400 shadow-sm dark:shadow-dark-sm'
                  : 'text-gray-600 dark:text-dark-500 hover:text-gray-900 dark:hover:text-dark-300'
              }`}
            >
              {status === 'all' ? 'All' : status.replace('_', ' ').toUpperCase()}
            </button>
          ))}
        </div>
      )}

      {/* Rides List */}
      <div className="space-y-4">
        {rides.map((ride) => (
          <div
            key={ride._id}
            className="bg-white dark:bg-dark-card rounded-xl p-6 shadow-sm dark:shadow-dark-md border border-gray-100 dark:border-dark-border hover:shadow-md dark:hover:shadow-dark-lg transition-all duration-200"
          >
            <div className="flex justify-between items-start mb-4">
              <div className="flex-1">
                <div className="flex items-center space-x-3 mb-2">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-dark-800">
                    {ride.rideId}
                  </h3>
                  {getStatusBadge(ride.status)}
                  {ride.priority !== 'normal' && getPriorityBadge(ride.priority)}
                </div>

                <div className="flex items-center text-sm text-gray-600 dark:text-dark-500 mb-2">
                  <Calendar className="w-4 h-4 mr-1" />
                  {scheduledRideService.formatScheduleTime(ride.scheduledDateTime)}
                  <span className="mx-2">•</span>
                  <Clock className="w-4 h-4 mr-1" />
                  {scheduledRideService.getTimeUntilScheduled(ride.scheduledDateTime)}
                </div>

                {ride.recurrence.type !== 'none' && (
                  <div className="flex items-center text-sm text-purple-600 dark:text-purple-400 mb-2">
                    <span className="mr-1">🔄</span>
                    {scheduledRideService.getRecurrenceText(ride.recurrence)}
                  </div>
                )}
              </div>

              <div className="relative">
                <button
                  onClick={() => setShowActions(showActions === ride._id ? null : ride._id)}
                  className="p-2 hover:bg-gray-100 dark:hover:bg-dark-100 rounded-lg transition-colors"
                >
                  <MoreVertical className="w-5 h-5 text-gray-500 dark:text-dark-500" />
                </button>

                {showActions === ride._id && (
                  <div className="absolute right-0 top-10 bg-white dark:bg-dark-card rounded-xl shadow-lg dark:shadow-dark-lg border border-gray-200 dark:border-dark-border z-10 min-w-[150px]">
                    <div className="py-1">
                      <button
                        onClick={() => {
                          onViewRide?.(ride);
                          setShowActions(null);
                        }}
                        className="w-full px-4 py-2 text-left text-sm text-gray-700 dark:text-dark-600 hover:bg-gray-50 dark:hover:bg-dark-100 flex items-center"
                      >
                        <Eye className="w-4 h-4 mr-2" />
                        View Details
                      </button>
                      
                      {ride.canCancel && (
                        <button
                          onClick={() => {
                            onEditRide?.(ride);
                            setShowActions(null);
                          }}
                          className="w-full px-4 py-2 text-left text-sm text-gray-700 dark:text-dark-600 hover:bg-gray-50 dark:hover:bg-dark-100 flex items-center"
                        >
                          <Edit3 className="w-4 h-4 mr-2" />
                          Edit Ride
                        </button>
                      )}
                      
                      {ride.canCancel && (
                        <button
                          onClick={() => {
                            handleCancelRide(ride.rideId);
                            setShowActions(null);
                          }}
                          className="w-full px-4 py-2 text-left text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 flex items-center"
                        >
                          <Trash2 className="w-4 h-4 mr-2" />
                          Cancel Ride
                        </button>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Route Information */}
            <div className="space-y-3 mb-4">
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

            {/* Ride Details */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
              <div className="flex items-center space-x-2">
                <Car className="w-4 h-4 text-gray-500 dark:text-dark-500" />
                <span className="text-sm text-gray-600 dark:text-dark-500">
                  {scheduledRideService.getVehicleTypeIcon(ride.vehicleType)} {ride.vehicleType.toUpperCase()}
                </span>
              </div>
              
              <div className="flex items-center space-x-2">
                <Users className="w-4 h-4 text-gray-500 dark:text-dark-500" />
                <span className="text-sm text-gray-600 dark:text-dark-500">
                  {ride.passengerCount} passenger{ride.passengerCount !== 1 ? 's' : ''}
                </span>
              </div>
              
              <div className="flex items-center space-x-2">
                <DollarSign className="w-4 h-4 text-gray-500 dark:text-dark-500" />
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
              <div className="flex items-center space-x-3 p-3 bg-gray-50 dark:bg-dark-100 rounded-lg">
                <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-semibold">
                  {ride.driverId.name.charAt(0)}
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-900 dark:text-dark-800">{ride.driverId.name}</p>
                  <p className="text-xs text-gray-600 dark:text-dark-500">Driver assigned</p>
                </div>
                <div className="flex items-center">
                  <span className="text-yellow-500">⭐</span>
                  <span className="text-sm text-gray-600 dark:text-dark-500 ml-1">{ride.driverId.rating}</span>
                </div>
              </div>
            )}

            {/* Special Requests */}
            {ride.specialRequests && ride.specialRequests.length > 0 && (
              <div className="mt-3">
                <p className="text-sm font-medium text-gray-900 dark:text-dark-800 mb-2">Special Requests:</p>
                <div className="flex flex-wrap gap-2">
                  {ride.specialRequests.map((request, index) => (
                    <span
                      key={index}
                      className="px-2 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300 text-xs rounded-full"
                    >
                      {request.type.replace('_', ' ')}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Customer Notes */}
            {ride.customerNotes && (
              <div className="mt-3 p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
                <p className="text-sm text-yellow-800 dark:text-yellow-300">
                  <strong>Note:</strong> {ride.customerNotes}
                </p>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Pagination */}
      {pagination && pagination.totalPages > 1 && (
        <div className="flex items-center justify-between">
          <button
            onClick={() => setPage(page - 1)}
            disabled={!pagination.hasPrev}
            className="px-4 py-2 bg-white dark:bg-dark-card border border-gray-300 dark:border-dark-border rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 dark:hover:bg-dark-100 transition-colors"
          >
            Previous
          </button>
          
          <span className="text-sm text-gray-600 dark:text-dark-500">
            Page {pagination.currentPage} of {pagination.totalPages}
          </span>
          
          <button
            onClick={() => setPage(page + 1)}
            disabled={!pagination.hasNext}
            className="px-4 py-2 bg-white dark:bg-dark-card border border-gray-300 dark:border-dark-border rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 dark:hover:bg-dark-100 transition-colors"
          >
            Next
          </button>
        </div>
      )}

      {/* Click outside to close actions */}
      {showActions && (
        <div
          className="fixed inset-0 z-5"
          onClick={() => setShowActions(null)}
        />
      )}
    </div>
  );
};

export default ScheduledRidesList;
