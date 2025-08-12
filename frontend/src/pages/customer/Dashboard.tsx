import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useBooking } from '../../contexts/BookingContext';
import Navigation from '../../components/Navigation';
import { StatsCardSkeleton, ListItemSkeleton, CardSkeleton } from '../../components/LoadingSkeletons';
import { responsive, touch, patterns } from '../../utils/responsive';
import { Car, MapPin, Clock, Star, Plus, ArrowRight, Receipt } from 'lucide-react';

const API_URL = (import.meta as any).env?.VITE_API_URL || 'https://chamba-taxi-service-2.onrender.com';

const CustomerDashboard: React.FC = () => {
  const { user } = useAuth();
  const { currentBooking, bookings } = useBooking();
  const [isLoading, setIsLoading] = useState(true);

  const userBookings = bookings.filter(booking => booking.customerId === user?.id);
  const recentBookings = userBookings.slice(0, 3);

  // Simulate initial loading
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 1500);
    return () => clearTimeout(timer);
  }, []);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/50 dark:from-dark-surface dark:via-dark-100 dark:to-dark-200 transition-colors duration-200">
        <Navigation />

        <div className={`${responsive.container} ${responsive.spacing.section}`}>
          {/* Welcome Section Skeleton */}
          <div className="mb-10">
            <CardSkeleton className="h-32" />
          </div>

          {/* Stats Grid Skeleton */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
            <StatsCardSkeleton />
            <StatsCardSkeleton />
            <StatsCardSkeleton />
            <StatsCardSkeleton />
          </div>

          {/* Recent Bookings Skeleton */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div className="space-y-6">
              <CardSkeleton className="h-16" />
              <ListItemSkeleton />
              <ListItemSkeleton />
              <ListItemSkeleton />
            </div>
            <div className="space-y-6">
              <CardSkeleton className="h-48" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/50 dark:from-dark-surface dark:via-dark-100 dark:to-dark-200 transition-colors duration-200">
      <Navigation />

      <div className={`${responsive.container} ${responsive.spacing.section}`}>
        {/* Welcome Section */}
        <div className="mb-10 animate-fadeInUp">
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-8 shadow-lg border border-gray-100 hover-lift">
            <h1 className="text-3xl font-bold bg-gradient-to-r from-slate-900 to-slate-700 bg-clip-text text-transparent mb-2">
              Welcome back, {user?.name}!
            </h1>
            <p className="text-slate-600 text-lg">Where would you like to go today?</p>
          </div>
        </div>

        {/* Current Booking */}
        {currentBooking && (
          <div className="bg-gradient-to-r from-blue-600 to-blue-700 rounded-2xl p-8 mb-10 text-white shadow-2xl animate-scaleIn hover-lift">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <h3 className="text-2xl font-bold mb-4 flex items-center gap-2">
                  <Car className="h-6 w-6" />
                  Active Ride
                </h3>
                <div className="space-y-3">
                  <div className="flex items-center space-x-3">
                    <div className="w-3 h-3 bg-green-400 rounded-full animate-pulse"></div>
                    <span className="text-blue-100 font-medium">{currentBooking.pickup.address}</span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <div className="w-3 h-3 bg-red-400 rounded-full"></div>
                    <span className="text-blue-100 font-medium">{currentBooking.destination.address}</span>
                  </div>
                </div>
              </div>
              <div className="text-right">
                <div className="bg-white/20 backdrop-blur-sm rounded-xl p-4">
                  <div className="text-blue-100 text-sm mb-1">Status</div>
                  <div className="font-bold text-lg capitalize text-white">
                    {currentBooking.status === 'on-trip' ? 'On Trip' : currentBooking.status}
                  </div>
                  <div className="text-3xl font-bold mt-2 text-white">₹{currentBooking.fare.estimated}</div>
                  {currentBooking.paymentId && (
                    <a href={`${API_URL}/api/payments/receipt/${currentBooking.paymentId}.pdf`} target="_blank"
                       className="inline-flex items-center gap-1 mt-3 text-blue-200 hover:text-white transition-colors">
                      <Receipt className="h-4 w-4" />
                      <span className="text-sm">Receipt</span>
                    </a>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Quick Actions */}
        <div className={`${responsive.grid.cols3} ${responsive.spacing.gap} mb-8 sm:mb-12`}>
          <Link to="/customer/book-ride" className={`group bg-white/80 backdrop-blur-sm ${responsive.card.default} shadow-xl border border-gray-100 hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2 animate-fadeInUp hover-lift ${touch.target}`} style={{ animationDelay: '0.2s' }}>
            <div className="flex items-center justify-between">
              <div>
                <div className="bg-gradient-to-br from-blue-600 to-blue-700 p-4 rounded-2xl group-hover:scale-110 transition-transform duration-300 mb-4">
                  <Car className="h-8 w-8 text-white" />
                </div>
                <h3 className="text-xl font-bold text-slate-900 mb-2">Book a Ride</h3>
                <p className="text-slate-600">Get a ride in minutes</p>
              </div>
              <ArrowRight className="h-6 w-6 text-blue-600 group-hover:translate-x-1 transition-transform duration-300" />
            </div>
          </Link>

          <Link to="/customer/history" className="group bg-white/80 backdrop-blur-sm p-8 rounded-2xl shadow-xl border border-gray-100 hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2">
            <div className="flex items-center justify-between">
              <div>
                <div className="bg-gradient-to-br from-emerald-600 to-emerald-700 p-4 rounded-2xl group-hover:scale-110 transition-transform duration-300 mb-4">
                  <Clock className="h-8 w-8 text-white" />
                </div>
                <h3 className="text-xl font-bold text-slate-900 mb-2">Ride History</h3>
                <p className="text-slate-600">View past rides</p>
              </div>
              <ArrowRight className="h-6 w-6 text-emerald-600 group-hover:translate-x-1 transition-transform duration-300" />
            </div>
          </Link>

          <div className="bg-white/80 backdrop-blur-sm p-8 rounded-2xl shadow-xl border border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <div className="bg-gradient-to-br from-purple-600 to-purple-700 p-4 rounded-2xl mb-4">
                  <Star className="h-8 w-8 text-white" />
                </div>
                <h3 className="text-xl font-bold text-slate-900 mb-2">Your Rating</h3>
                <div className="flex items-center space-x-2">
                  <span className="text-3xl font-bold text-purple-600">4.8</span>
                  <div className="flex space-x-1">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <Star key={star} className={`h-5 w-5 ${star <= 4 ? 'text-yellow-400 fill-current' : 'text-gray-300'}`} />
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Recent Rides */}
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl border border-gray-100">
          <div className="p-8 border-b border-gray-100">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold text-slate-900">Recent Rides</h2>
              <Link to="/customer/history" className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-700 font-semibold transition-colors duration-300">
                View All
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </div>
          {recentBookings.length > 0 ? (
            <div className="divide-y divide-gray-100">
              {recentBookings.map((booking) => (
                <div key={booking.id} className="p-8 hover:bg-slate-50/50 transition-colors duration-300">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="space-y-3">
                        <div className="flex items-center space-x-3">
                          <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                          <span className="text-slate-700 font-medium">{booking.pickup.address}</span>
                        </div>
                        <div className="flex items-center space-x-3">
                          <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                          <span className="text-slate-700 font-medium">{booking.destination.address}</span>
                        </div>
                      </div>
                      <div className="mt-4 flex items-center space-x-6 text-sm text-slate-500">
                        <span className="font-medium">{new Date(booking.createdAt).toLocaleDateString()}</span>
                        <span className="capitalize bg-slate-100 px-3 py-1 rounded-full">{booking.vehicleType}</span>
                        <span className={`capitalize font-semibold px-3 py-1 rounded-full ${
                          booking.status === 'completed' ? 'bg-green-100 text-green-700' :
                          booking.status === 'cancelled' ? 'bg-red-100 text-red-700' :
                          'bg-yellow-100 text-yellow-700'
                        }`}>{booking.status}</span>
                      </div>
                    </div>
                    <div className="text-right ml-6">
                      <div className="text-2xl font-bold text-slate-900 mb-2">₹{booking.fare.actual || booking.fare.estimated}</div>
                      {booking.rating && (
                        <div className="flex items-center justify-end space-x-1 mb-2">
                          <Star className="h-4 w-4 text-yellow-400 fill-current" />
                          <span className="text-sm font-medium text-slate-600">{booking.rating}</span>
                        </div>
                      )}
                      {booking.paymentId && (
                        <a href={`${API_URL}/api/payments/receipt/${booking.paymentId}.pdf`} target="_blank"
                           className="inline-flex items-center gap-1 text-blue-600 hover:text-blue-700 text-sm font-medium transition-colors">
                          <Receipt className="h-4 w-4" />
                          Receipt
                        </a>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-16 text-center">
              <div className="bg-gradient-to-br from-blue-100 to-blue-200 w-20 h-20 rounded-2xl flex items-center justify-center mx-auto mb-6">
                <Car className="h-10 w-10 text-blue-600" />
              </div>
              <h3 className="text-2xl font-bold text-slate-900 mb-3">No rides yet</h3>
              <p className="text-slate-600 mb-8 max-w-md mx-auto">Book your first ride with RideWithUs and experience premium transportation!</p>
              <Link to="/customer/book-ride"
                    className="inline-flex items-center gap-2 px-8 py-4 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-semibold rounded-xl transition-all duration-300 shadow-lg hover:shadow-xl transform hover:-translate-y-1">
                <Plus className="h-5 w-5" />
                Book Your First Ride
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CustomerDashboard;
