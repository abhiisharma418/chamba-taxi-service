import React, { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useBooking } from '../../contexts/BookingContext';
import Navigation from '../../components/Navigation';
import { Car, Star, Calendar, Filter, MapPin } from 'lucide-react';

const CustomerHistory: React.FC = () => {
  const { user } = useAuth();
  const { bookings } = useBooking();
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'date' | 'fare'>('date');

  const userBookings = bookings.filter(booking => booking.customerId === user?.id);

  const filteredBookings = userBookings.filter(booking => {
    if (filterStatus === 'all') return true;
    return booking.status === filterStatus;
  });

  const sortedBookings = [...filteredBookings].sort((a, b) => {
    if (sortBy === 'date') {
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    } else {
      const aFare = a.fare.actual || a.fare.estimated;
      const bFare = b.fare.actual || b.fare.estimated;
      return bFare - aFare;
    }
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'text-green-600 bg-green-50';
      case 'cancelled':
        return 'text-red-600 bg-red-50';
      case 'on-trip':
        return 'text-blue-600 bg-blue-50';
      case 'accepted':
        return 'text-emerald-600 bg-emerald-50';
      default:
        return 'text-yellow-600 bg-yellow-50';
    }
  };

  const getStatusText = (status: string) => {
    return status === 'on-trip' ? 'On Trip' : status.charAt(0).toUpperCase() + status.slice(1);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900">Ride History</h1>
          <p className="text-gray-600">View and track all your rides</p>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <Filter className="h-5 w-5 text-gray-400" />
                <span className="text-sm font-medium text-gray-700">Filter by status:</span>
              </div>
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="border border-gray-300 rounded-md px-3 py-1 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="all">All Rides</option>
                <option value="completed">Completed</option>
                <option value="cancelled">Cancelled</option>
                <option value="on-trip">On Trip</option>
                <option value="accepted">Accepted</option>
                <option value="requested">Requested</option>
              </select>
            </div>
            
            <div className="flex items-center space-x-2">
              <span className="text-sm font-medium text-gray-700">Sort by:</span>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as 'date' | 'fare')}
                className="border border-gray-300 rounded-md px-3 py-1 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="date">Date</option>
                <option value="fare">Fare</option>
              </select>
            </div>
          </div>
        </div>

        {/* Statistics */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center">
              <div className="bg-blue-100 p-3 rounded-full">
                <Car className="h-6 w-6 text-blue-600" />
              </div>
              <div className="ml-4">
                <div className="text-2xl font-bold text-gray-900">{userBookings.length}</div>
                <div className="text-gray-600">Total Rides</div>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center">
              <div className="bg-green-100 p-3 rounded-full">
                <Calendar className="h-6 w-6 text-green-600" />
              </div>
              <div className="ml-4">
                <div className="text-2xl font-bold text-gray-900">
                  {userBookings.filter(b => b.status === 'completed').length}
                </div>
                <div className="text-gray-600">Completed</div>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center">
              <div className="bg-purple-100 p-3 rounded-full">
                <Star className="h-6 w-6 text-purple-600" />
              </div>
              <div className="ml-4">
                <div className="text-2xl font-bold text-gray-900">4.8</div>
                <div className="text-gray-600">Avg Rating</div>
              </div>
            </div>
          </div>
        </div>

        {/* Bookings List */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          {sortedBookings.length > 0 ? (
            <div className="divide-y divide-gray-200">
              {sortedBookings.map((booking) => (
                <div key={booking.id} className="p-6 hover:bg-gray-50 transition-colors duration-200">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-3">
                        <div className="bg-gray-100 p-2 rounded-full">
                          <Car className="h-5 w-5 text-gray-600" />
                        </div>
                        <div>
                          <div className="font-semibold text-gray-900 capitalize">
                            {booking.vehicleType} Ride
                          </div>
                          <div className="text-sm text-gray-500">
                            {new Date(booking.createdAt).toLocaleDateString('en-IN', {
                              day: 'numeric',
                              month: 'short',
                              year: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </div>
                        </div>
                      </div>
                      
                      <div className="space-y-2">
                        <div className="flex items-start space-x-3">
                          <div className="w-2 h-2 bg-green-500 rounded-full mt-2"></div>
                          <div className="flex-1">
                            <div className="text-sm text-gray-600">Pickup</div>
                            <div className="text-sm font-medium text-gray-900">
                              {booking.pickup.address}
                            </div>
                          </div>
                        </div>
                        
                        <div className="flex items-start space-x-3">
                          <div className="w-2 h-2 bg-red-500 rounded-full mt-2"></div>
                          <div className="flex-1">
                            <div className="text-sm text-gray-600">Destination</div>
                            <div className="text-sm font-medium text-gray-900">
                              {booking.destination.address}
                            </div>
                          </div>
                        </div>
                      </div>

                      {booking.rating && booking.status === 'completed' && (
                        <div className="mt-3 flex items-center space-x-2">
                          <span className="text-sm text-gray-600">Your rating:</span>
                          <div className="flex items-center space-x-1">
                            {[1, 2, 3, 4, 5].map((star) => (
                              <Star
                                key={star}
                                className={`h-4 w-4 ${
                                  star <= (booking.rating || 0) 
                                    ? 'text-yellow-400 fill-current' 
                                    : 'text-gray-300'
                                }`}
                              />
                            ))}
                            <span className="text-sm text-gray-600 ml-1">{booking.rating}</span>
                          </div>
                        </div>
                      )}
                    </div>

                    <div className="text-right ml-6">
                      <div className={`inline-flex px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(booking.status)}`}>
                        {getStatusText(booking.status)}
                      </div>
                      <div className="text-2xl font-bold text-gray-900 mt-2">
                        ₹{booking.fare.actual || booking.fare.estimated}
                      </div>
                      {booking.completedAt && (
                        <div className="text-sm text-gray-500 mt-1">
                          Completed at {new Date(booking.completedAt).toLocaleTimeString('en-IN', {
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-12 text-center">
              <Car className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                {filterStatus === 'all' ? 'No rides yet' : `No ${filterStatus} rides`}
              </h3>
              <p className="text-gray-600">
                {filterStatus === 'all' 
                  ? 'Start by booking your first ride!' 
                  : `You don't have any ${filterStatus} rides yet.`
                }
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CustomerHistory;