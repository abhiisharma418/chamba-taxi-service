import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useBooking } from '../../contexts/BookingContext';
import Navigation from '../../components/Navigation';
import { Car, MapPin, Clock, Star, Plus } from 'lucide-react';

const API_URL = (import.meta as any).env?.VITE_API_URL || 'https://chamba-taxi-service-2.onrender.com';

const CustomerDashboard: React.FC = () => {
  const { user } = useAuth();
  const { currentBooking, bookings } = useBooking();

  const userBookings = bookings.filter(booking => booking.customerId === user?.id);
  const recentBookings = userBookings.slice(0, 3);

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Welcome Section */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900">Welcome back, {user?.name}!</h1>
          <p className="text-gray-600">Ready for your next ride?</p>
        </div>

        {/* Current Booking */}
        {currentBooking && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-8">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold text-blue-900 mb-2">Current Ride</h3>
                <div className="space-y-2">
                  <div className="flex items-center space-x-2"><div className="w-2 h-2 bg-green-500 rounded-full"></div><span className="text-sm text-gray-700">{currentBooking.pickup.address}</span></div>
                  <div className="flex items-center space-x-2"><div className="w-2 h-2 bg-red-500 rounded-full"></div><span className="text-sm text-gray-700">{currentBooking.destination.address}</span></div>
                </div>
              </div>
              <div className="text-right">
                <div className="text-sm text-gray-500">Status</div>
                <div className={`font-semibold capitalize ${currentBooking.status === 'requested' ? 'text-yellow-600' : currentBooking.status === 'accepted' ? 'text-blue-600' : currentBooking.status === 'on-trip' ? 'text-green-600' : 'text-gray-600'}`}>{currentBooking.status === 'on-trip' ? 'On Trip' : currentBooking.status}</div>
                {currentBooking.paymentStatus && (
                  <div className="text-xs text-gray-600 mt-1">Payment: <span className="capitalize">{currentBooking.paymentStatus}</span></div>
                )}
                {currentBooking.paymentId && (
                  <div className="mt-2"><a href={`${API_URL}/api/payments/receipt/${currentBooking.paymentId}.pdf`} target="_blank" className="text-blue-600 text-sm">View Receipt</a></div>
                )}
              </div>
            </div>
            <div className="mt-4 pt-4 border-t border-blue-200">
              <div className="flex items-center justify-between"><span className="text-sm text-blue-700">Estimated Fare</span><span className="font-semibold text-blue-900">₹{currentBooking.fare.estimated}</span></div>
            </div>
          </div>
        )}

        {/* Quick Actions */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          <Link to="/customer/book-ride" className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-shadow duration-200 group">
            <div className="flex items-center"><div className="bg-blue-100 p-3 rounded-full group-hover:bg-blue-200 transition-colors duration-200"><Car className="h-6 w-6 text-blue-600" /></div><div className="ml-4"><h3 className="text-lg font-semibold text-gray-900">Book a Ride</h3><p className="text-gray-600">Get a ride in minutes</p></div></div>
          </Link>

          <Link to="/customer/history" className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-shadow duration-200 group">
            <div className="flex items-center"><div className="bg-emerald-100 p-3 rounded-full group-hover:bg-emerald-200 transition-colors duration-200"><Clock className="h-6 w-6 text-emerald-600" /></div><div className="ml-4"><h3 className="text-lg font-semibold text-gray-900">Ride History</h3><p className="text-gray-600">View past rides</p></div></div>
          </Link>

          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200"><div className="flex items-center"><div className="bg-purple-100 p-3 rounded-full"><Star className="h-6 w-6 text-purple-600" /></div><div className="ml-4"><h3 className="text-lg font-semibold text-gray-900">Your Rating</h3><div className="flex items-center space-x-1"><span className="text-2xl font-bold text-purple-600">4.8</span><div className="flex space-x-0.5">{[1, 2, 3, 4, 5].map((star) => (<Star key={star} className={`h-4 w-4 ${star <= 4 ? 'text-yellow-400 fill-current' : 'text-gray-300'}`} />))}</div></div></div></div></div>
        </div>

        {/* Recent Rides */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="p-6 border-b border-gray-200"><div className="flex items-center justify-between"><h2 className="text-xl font-semibold text-gray-900">Recent Rides</h2><Link to="/customer/history" className="text-blue-600 hover:text-blue-700 text-sm font-medium">View All</Link></div></div>
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