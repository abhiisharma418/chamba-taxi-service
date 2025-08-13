import React, { useEffect, useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useBooking } from '../../contexts/BookingContext';
import Navigation from '../../components/Navigation';
import { Car, Power, MapPin, Clock, DollarSign, Star, Bell, MessageCircle, HelpCircle } from 'lucide-react';
import { LiveAPI, RidesAPI } from '../../lib/api';
import { io } from 'socket.io-client';
import ChatInterface from '../../components/ChatInterface';
import SupportInterface from '../../components/SupportInterface';

const DriverDashboard: React.FC = () => {
  const { user } = useAuth();
  const { bookings, updateBookingStatus, getBookingHistory } = useBooking();
  const [isOnline, setIsOnline] = useState(true);
  const [offer, setOffer] = useState<{ rideId: string; pickup: any; destination: any } | null>(null);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [isSupportOpen, setIsSupportOpen] = useState(false);

  useEffect(() => {
    if (!user) return;
    let hbTimer: any;
    const startHb = async () => {
      try { await LiveAPI.setAvailability(true); } catch {}
      hbTimer = setInterval(() => { LiveAPI.heartbeat(77.1734, 31.1048).catch(()=>{}); }, 10000);
    };
    const stopHb = async () => {
      try { await LiveAPI.setAvailability(false); } catch {}
      if (hbTimer) clearInterval(hbTimer);
    };
    if (isOnline) startHb(); else stopHb();
    return () => { stopHb(); };
  }, [isOnline, user]);

  useEffect(() => { getBookingHistory().catch(()=>{}); }, []);

  useEffect(() => {
    if (!user) return;

    const sock = io((import.meta as any).env?.VITE_API_URL || 'https://chamba-taxi-service-2.onrender.com', { auth: { driverId: user.id } });
    sock.on('dispatch:offer', (payload: any) => { setOffer({ rideId: payload.rideId, pickup: payload.pickup, destination: payload.destination }); });
    return () => { sock.disconnect(); };
  }, [user]);

  const driverBookings = bookings.filter(booking => booking.driverId === user?.id);
  const pendingRequests = bookings.filter(booking => booking.status === 'requested');
  const activeRide = driverBookings.find(booking => ['accepted', 'on-trip'].includes(booking.status));

  const todayEarnings = driverBookings
    .filter(booking =>
      booking.status === 'completed' &&
      new Date(booking.completedAt!).toDateString() === new Date().toDateString()
    )
    .reduce((sum, booking) => {
      const totalFare = booking.fare.actual || booking.fare.estimated;
      const driverShare = Math.round(totalFare * 0.75); // Driver gets 75%
      return sum + driverShare;
    }, 0);

  const totalTodayFares = driverBookings
    .filter(booking =>
      booking.status === 'completed' &&
      new Date(booking.completedAt!).toDateString() === new Date().toDateString()
    )
    .reduce((sum, booking) => sum + (booking.fare.actual || booking.fare.estimated), 0);

  const companyCommission = totalTodayFares - todayEarnings;

  const handleAcceptRide = async (bookingId: string) => {
    await RidesAPI.updateStatus(bookingId, 'accepted');
    await getBookingHistory();
  };

  const handleStatusUpdate = async (bookingId: string, status: 'on-trip' | 'completed') => {
    await RidesAPI.updateStatus(bookingId, status);
    await getBookingHistory();
  };

  const handleOfferResponse = async (accept: boolean) => {
    if (!offer) return;
    await LiveAPI.respondOffer(offer.rideId, accept);
    setOffer(null);
    await getBookingHistory();
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Offer Modal */}
        {offer && (
          <div className="mb-6 p-4 border border-amber-300 bg-amber-50 rounded">
            <div className="flex items-center justify-between">
              <div>
                <div className="font-semibold text-amber-800">New Ride Offer</div>
                <div className="text-sm text-amber-700">From: {offer.pickup?.address || 'Pickup'} → To: {offer.destination?.address || 'Destination'}</div>
              </div>
              <div className="flex items-center gap-2">
                <button onClick={() => handleOfferResponse(false)} className="px-3 py-1.5 border border-gray-300 rounded text-gray-700 hover:bg-gray-50 text-sm">Decline</button>
                <button onClick={() => handleOfferResponse(true)} className="px-3 py-1.5 bg-green-600 hover:bg-green-700 text-white rounded text-sm">Accept</button>
              </div>
            </div>
          </div>
        )}

        {/* Status Toggle */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Welcome, {user?.name}!</h1>
              <p className="text-gray-600">You are currently <span className={isOnline ? 'text-green-600' : 'text-red-600'}>{isOnline ? 'ONLINE' : 'OFFLINE'}</span></p>
            </div>
            <button onClick={() => setIsOnline(!isOnline)} className={`flex items-center space-x-2 px-6 py-3 rounded-lg font-semibold transition-colors duration-200 ${isOnline ? 'bg-red-600 hover:bg-red-700 text-white' : 'bg-green-600 hover:bg-green-700 text-white'}`}>
              <Power className="h-5 w-5" />
              <span>{isOnline ? 'Go Offline' : 'Go Online'}</span>
            </button>
          </div>
        </div>

        {/* Active Ride */}
        {activeRide && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-8">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="text-lg font-semibold text-blue-900 mb-2">{activeRide.status === 'accepted' ? 'Accepted Ride' : 'Current Trip'}</h3>
                <div className="space-y-2">
                  <div className="flex items-center space-x-2"><div className="w-2 h-2 bg-green-500 rounded-full"></div><span className="text-sm text-gray-700">{activeRide.pickup.address}</span></div>
                  <div className="flex items-center space-x-2"><div className="w-2 h-2 bg-red-500 rounded-full"></div><span className="text-sm text-gray-700">{activeRide.destination.address}</span></div>
                </div>
                <div className="mt-4 flex items-center space-x-4"><span className="text-sm text-blue-700">Fare: ₹{activeRide.fare.estimated}</span><span className="text-sm text-blue-700 capitalize">{activeRide.vehicleType}</span></div>
              </div>
              <div className="flex flex-col space-y-2">
                {activeRide.status === 'accepted' && (
                  <button onClick={() => handleStatusUpdate(activeRide.id, 'on-trip')} className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white text-sm font-medium rounded-lg transition-colors duration-200">Start Trip</button>
                )}
                {activeRide.status === 'on-trip' && (
                  <button onClick={() => handleStatusUpdate(activeRide.id, 'completed')} className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-colors duration-200">Complete Trip</button>
                )}
                <button
                  onClick={() => setIsChatOpen(true)}
                  className="px-4 py-2 bg-blue-500 text-white text-sm font-medium rounded-lg hover:bg-blue-600 transition-colors duration-200 flex items-center space-x-2"
                >
                  <MessageCircle className="h-4 w-4" />
                  <span>Chat</span>
                </button>
                <button className="px-4 py-2 border border-blue-300 text-blue-700 text-sm font-medium rounded-lg hover:bg-blue-50 transition-colors duration-200">Navigate</button>
              </div>
            </div>
          </div>
        )}

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center">
              <div className="bg-green-100 p-3 rounded-full">
                <DollarSign className="h-6 w-6 text-green-600" />
              </div>
              <div className="ml-4">
                <div className="text-2xl font-bold text-gray-900">₹{todayEarnings}</div>
                <div className="text-gray-600">Your Earning (75%)</div>
                {totalTodayFares > 0 && (
                  <div className="text-sm text-gray-500 mt-1">
                    Total: ₹{totalTodayFares} • Commission: ₹{companyCommission}
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center">
              <div className="bg-blue-100 p-3 rounded-full">
                <Car className="h-6 w-6 text-blue-600" />
              </div>
              <div className="ml-4">
                <div className="text-2xl font-bold text-gray-900">
                  {driverBookings.filter(b => b.status === 'completed').length}
                </div>
                <div className="text-gray-600">Completed Rides</div>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center">
              <div className="bg-purple-100 p-3 rounded-full">
                <Star className="h-6 w-6 text-purple-600" />
              </div>
              <div className="ml-4">
                <div className="text-2xl font-bold text-gray-900">4.9</div>
                <div className="text-gray-600">Rating</div>
              </div>
            </div>
          </div>

          <button
            onClick={() => setIsSupportOpen(true)}
            className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition-all group text-left w-full"
          >
            <div className="flex items-center">
              <div className="bg-orange-100 p-3 rounded-full group-hover:scale-110 transition-transform">
                <HelpCircle className="h-6 w-6 text-orange-600" />
              </div>
              <div className="ml-4">
                <div className="text-lg font-bold text-gray-900">Get Support</div>
                <div className="text-gray-600">Need help?</div>
              </div>
            </div>
          </button>
        </div>

        {/* Pending Requests */}
        {isOnline && pendingRequests.length > 0 && !activeRide && (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 mb-8">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center space-x-2">
                <Bell className="h-5 w-5 text-amber-600" />
                <h2 className="text-xl font-semibold text-gray-900">New Ride Requests</h2>
                <span className="bg-red-100 text-red-800 text-xs font-medium px-2.5 py-0.5 rounded-full">
                  {pendingRequests.length}
                </span>
              </div>
            </div>
            
            <div className="divide-y divide-gray-200">
              {pendingRequests.map((booking) => (
                <div key={booking.id} className="p-6">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="space-y-2">
                        <div className="flex items-center space-x-2">
                          <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                          <span className="text-sm text-gray-700">{booking.pickup.address}</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                          <span className="text-sm text-gray-700">{booking.destination.address}</span>
                        </div>
                      </div>
                      <div className="mt-2 flex items-center space-x-4 text-xs text-gray-500">
                        <span>{new Date(booking.createdAt).toLocaleTimeString()}</span>
                        <span className="capitalize">{booking.vehicleType}</span>
                        <span>₹{booking.fare.estimated}</span>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2 ml-4">
                      <button className="px-4 py-2 border border-gray-300 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-50 transition-colors duration-200" onClick={() => handleOfferResponse(false)}>Decline</button>
                      <button onClick={() => handleAcceptRide(booking.id)} className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white text-sm font-medium rounded-lg transition-colors duration-200">Accept</button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* No Requests State */}
        {isOnline && pendingRequests.length === 0 && !activeRide && (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12 text-center">
            <MapPin className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Looking for rides...</h3>
            <p className="text-gray-600">Stay online and we'll notify you when new ride requests come in.</p>
          </div>
        )}

        {/* Fare Split Information */}
        <div className="bg-gradient-to-r from-green-50 to-blue-50 rounded-lg border border-green-200 p-6 mb-8">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <DollarSign className="h-5 w-5 mr-2 text-green-600" />
            RideWithUs Fare Structure
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white rounded-lg p-4 border border-green-100">
              <div className="flex items-center justify-between mb-2">
                <span className="text-gray-700 font-medium">Your Share</span>
                <span className="text-2xl font-bold text-green-600">75%</span>
              </div>
              <p className="text-sm text-gray-600">You keep 75% of every fare</p>
            </div>
            <div className="bg-white rounded-lg p-4 border border-blue-100">
              <div className="flex items-center justify-between mb-2">
                <span className="text-gray-700 font-medium">Platform Fee</span>
                <span className="text-2xl font-bold text-blue-600">25%</span>
              </div>
              <p className="text-sm text-gray-600">Platform maintenance & support</p>
            </div>
          </div>
          <div className="mt-4 bg-white rounded-lg p-4 border">
            <div className="flex items-center space-x-2 text-green-700">
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              <span className="text-sm font-medium">No Hidden Charges</span>
            </div>
            <p className="text-sm text-gray-600 mt-1">
              No booking fees, subscription charges, or additional deductions. Simple 75-25 split on all rides.
            </p>
          </div>
        </div>

        {/* Offline State */}
        {!isOnline && (
          <div className="bg-gray-100 rounded-lg border-2 border-dashed border-gray-300 p-12 text-center">
            <Power className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">You're offline</h3>
            <p className="text-gray-600 mb-4">Go online to start receiving ride requests.</p>
            <button onClick={() => setIsOnline(true)} className="px-6 py-2 bg-green-600 hover:bg-green-700 text-white font-medium rounded-lg transition-colors duration-200">Go Online</button>
          </div>
        )}
      </div>

      {/* Chat Interface */}
      {activeRide && (
        <ChatInterface
          rideId={activeRide.id}
          isOpen={isChatOpen}
          onClose={() => setIsChatOpen(false)}
          otherParty={{
            id: activeRide.customerId || '',
            name: activeRide.customerName || 'Customer',
            type: 'customer'
          }}
        />
      )}
    </div>
  );
};

export default DriverDashboard;
