import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useBooking } from '../../contexts/BookingContext';
import Navigation from '../../components/Navigation';
import { Car, MapPin, Clock, Star, Plus, ArrowRight, Receipt } from 'lucide-react';

const API_URL = (import.meta as any).env?.VITE_API_URL || 'https://chamba-taxi-service-2.onrender.com';

const CustomerDashboard: React.FC = () => {
  const { user } = useAuth();
  const { currentBooking, bookings } = useBooking();

  const userBookings = bookings.filter(booking => booking.customerId === user?.id);
  const recentBookings = userBookings.slice(0, 3);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/50">
      <Navigation />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Welcome Section */}
        <div className="mb-10">
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-8 shadow-lg border border-gray-100">
            <h1 className="text-3xl font-bold bg-gradient-to-r from-slate-900 to-slate-700 bg-clip-text text-transparent mb-2">
              Welcome back, {user?.name}!
            </h1>
            <p className="text-slate-600 text-lg">Where would you like to go today?</p>
          </div>
        </div>

        {/* Current Booking */}
        {currentBooking && (
          <div className="bg-gradient-to-r from-blue-600 to-blue-700 rounded-2xl p-8 mb-10 text-white shadow-2xl">
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
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8 mb-12">
          <Link to="/customer/book-ride" className="group bg-white/80 backdrop-blur-sm p-8 rounded-2xl shadow-xl border border-gray-100 hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2">
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
            <div className="divide-y divide-gray-200">
              {recentBookings.map((booking) => (
                <div key={booking.id} className="p-6">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="space-y-2">
                        <div className="flex items-center space-x-2"><div className="w-2 h-2 bg-green-500 rounded-full"></div><span className="text-sm text-gray-700">{booking.pickup.address}</span></div>
                        <div className="flex items-center space-x-2"><div className="w-2 h-2 bg-red-500 rounded-full"></div><span className="text-sm text-gray-700">{booking.destination.address}</span></div>
                      </div>
                      <div className="mt-2 flex items-center space-x-4 text-xs text-gray-500"><span>{new Date(booking.createdAt).toLocaleDateString()}</span><span className="capitalize">{booking.vehicleType}</span><span className={`capitalize ${booking.status === 'completed' ? 'text-green-600' : booking.status === 'cancelled' ? 'text-red-600' : 'text-yellow-600'}`}>{booking.status}</span>{booking.paymentStatus && (<span>Payment: <b className="capitalize">{booking.paymentStatus}</b></span>)}</div>
                    </div>
                    <div className="text-right ml-4"><div className="font-semibold text-gray-900">₹{booking.fare.actual || booking.fare.estimated}</div>{booking.rating && (<div className="flex items-center space-x-1 mt-1"><Star className="h-3 w-3 text-yellow-400 fill-current" /><span className="text-xs text-gray-600">{booking.rating}</span></div>)}{booking.paymentId && (<div className="mt-2"><a href={`${API_URL}/api/payments/receipt/${booking.paymentId}.pdf`} target="_blank" className="text-blue-600 text-xs">Receipt</a></div>)}</div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-12 text-center"><Car className="h-12 w-12 text-gray-400 mx-auto mb-4" /><h3 className="text-lg font-medium text-gray-900 mb-2">No rides yet</h3><p className="text-gray-600 mb-4">Book your first ride to get started!</p><Link to="/customer/book-ride" className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"><Plus className="h-4 w-4 mr-2" />Book a Ride</Link></div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CustomerDashboard;
