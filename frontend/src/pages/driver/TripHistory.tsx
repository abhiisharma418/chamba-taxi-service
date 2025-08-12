import React, { useState, useMemo } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import Navigation from '../../components/Navigation';
import { 
  Calendar, MapPin, Clock, DollarSign, Star, Filter,
  Search, Download, Eye, MoreHorizontal, Navigation as NavigationIcon,
  TrendingUp, BarChart3, Users, Target, Phone, MessageSquare
} from 'lucide-react';

interface TripData {
  id: string;
  date: string;
  time: string;
  pickup: {
    address: string;
    coordinates: [number, number];
  };
  destination: {
    address: string;
    coordinates: [number, number];
  };
  customer: {
    name: string;
    phone: string;
    rating: number;
  };
  distance: number;
  duration: number;
  fare: {
    base: number;
    distance: number;
    time: number;
    surge: number;
    total: number;
    driverEarning: number;
    commission: number;
  };
  status: 'completed' | 'cancelled' | 'no-show';
  rating: number;
  feedback: string;
  paymentMethod: 'cash' | 'card' | 'upi' | 'wallet';
  vehicleType: 'hatchback' | 'sedan' | 'suv' | 'auto';
}

const DriverTripHistory: React.FC = () => {
  const { user } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [selectedMonth, setSelectedMonth] = useState<string>(new Date().toISOString().slice(0, 7));
  const [sortBy, setSortBy] = useState<'date' | 'fare' | 'rating'>('date');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [selectedTrip, setSelectedTrip] = useState<TripData | null>(null);

  // Mock trip data - in real app, this would come from API
  const trips: TripData[] = useMemo(() => [
    {
      id: '1',
      date: '2024-01-15',
      time: '09:30',
      pickup: {
        address: 'Connaught Place, New Delhi',
        coordinates: [77.2167, 28.6269]
      },
      destination: {
        address: 'India Gate, New Delhi',
        coordinates: [77.2295, 28.6129]
      },
      customer: {
        name: 'Priya Sharma',
        phone: '+91 9876543210',
        rating: 4.8
      },
      distance: 3.2,
      duration: 18,
      fare: {
        base: 40,
        distance: 96,
        time: 18,
        surge: 0,
        total: 154,
        driverEarning: 116,
        commission: 38
      },
      status: 'completed',
      rating: 5,
      feedback: 'Great driver, very polite and drove safely.',
      paymentMethod: 'upi',
      vehicleType: 'hatchback'
    },
    {
      id: '2',
      date: '2024-01-15',
      time: '14:45',
      pickup: {
        address: 'Karol Bagh Metro Station',
        coordinates: [77.1924, 28.6507]
      },
      destination: {
        address: 'Rajouri Garden Metro Station',
        coordinates: [77.1208, 28.6469]
      },
      customer: {
        name: 'Rajesh Kumar',
        phone: '+91 9876543211',
        rating: 4.2
      },
      distance: 8.5,
      duration: 35,
      fare: {
        base: 40,
        distance: 255,
        time: 35,
        surge: 30,
        total: 360,
        driverEarning: 270,
        commission: 90
      },
      status: 'completed',
      rating: 4,
      feedback: 'Good service, but took a longer route.',
      paymentMethod: 'cash',
      vehicleType: 'sedan'
    },
    {
      id: '3',
      date: '2024-01-14',
      time: '19:20',
      pickup: {
        address: 'DLF Cyber City, Gurgaon',
        coordinates: [77.0886, 28.4950]
      },
      destination: {
        address: 'IGI Airport Terminal 3',
        coordinates: [77.1025, 28.5562]
      },
      customer: {
        name: 'Sarah Johnson',
        phone: '+91 9876543212',
        rating: 4.9
      },
      distance: 12.8,
      duration: 45,
      fare: {
        base: 60,
        distance: 384,
        time: 45,
        surge: 50,
        total: 539,
        driverEarning: 404,
        commission: 135
      },
      status: 'completed',
      rating: 5,
      feedback: 'Excellent service! Reached on time for my flight.',
      paymentMethod: 'card',
      vehicleType: 'sedan'
    },
    {
      id: '4',
      date: '2024-01-14',
      time: '11:15',
      pickup: {
        address: 'Lajpat Nagar Market',
        coordinates: [77.2436, 28.5673]
      },
      destination: {
        address: 'Select City Walk Mall',
        coordinates: [77.2264, 28.5245]
      },
      customer: {
        name: 'Amit Patel',
        phone: '+91 9876543213',
        rating: 3.8
      },
      distance: 0,
      duration: 0,
      fare: {
        base: 0,
        distance: 0,
        time: 0,
        surge: 0,
        total: 0,
        driverEarning: 0,
        commission: 0
      },
      status: 'cancelled',
      rating: 0,
      feedback: 'Customer cancelled after 10 minutes',
      paymentMethod: 'upi',
      vehicleType: 'hatchback'
    }
  ], []);

  const filteredTrips = useMemo(() => {
    return trips
      .filter(trip => {
        const matchesSearch = trip.pickup.address.toLowerCase().includes(searchTerm.toLowerCase()) ||
                             trip.destination.address.toLowerCase().includes(searchTerm.toLowerCase()) ||
                             trip.customer.name.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesStatus = selectedStatus === 'all' || trip.status === selectedStatus;
        const matchesMonth = trip.date.startsWith(selectedMonth);
        return matchesSearch && matchesStatus && matchesMonth;
      })
      .sort((a, b) => {
        let comparison = 0;
        switch (sortBy) {
          case 'date':
            comparison = new Date(a.date + ' ' + a.time).getTime() - new Date(b.date + ' ' + b.time).getTime();
            break;
          case 'fare':
            comparison = a.fare.total - b.fare.total;
            break;
          case 'rating':
            comparison = a.rating - b.rating;
            break;
        }
        return sortOrder === 'asc' ? comparison : -comparison;
      });
  }, [trips, searchTerm, selectedStatus, selectedMonth, sortBy, sortOrder]);

  const stats = useMemo(() => {
    const completedTrips = filteredTrips.filter(t => t.status === 'completed');
    const totalEarnings = completedTrips.reduce((sum, trip) => sum + trip.fare.driverEarning, 0);
    const totalDistance = completedTrips.reduce((sum, trip) => sum + trip.distance, 0);
    const avgRating = completedTrips.length > 0 ? 
      completedTrips.reduce((sum, trip) => sum + trip.rating, 0) / completedTrips.length : 0;
    
    return {
      totalTrips: filteredTrips.length,
      completedTrips: completedTrips.length,
      cancelledTrips: filteredTrips.filter(t => t.status === 'cancelled').length,
      totalEarnings,
      totalDistance,
      avgRating,
      avgFare: completedTrips.length > 0 ? totalEarnings / completedTrips.length : 0
    };
  }, [filteredTrips]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'text-green-600 bg-green-100';
      case 'cancelled': return 'text-red-600 bg-red-100';
      case 'no-show': return 'text-yellow-600 bg-yellow-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const TripCard: React.FC<{ trip: TripData }> = ({ trip }) => (
    <div className="bg-white rounded-lg border border-gray-200 p-6 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          <div className="flex items-center space-x-2 mb-2">
            <span className="text-sm font-medium text-gray-900">Trip #{trip.id}</span>
            <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(trip.status)}`}>
              {trip.status.charAt(0).toUpperCase() + trip.status.slice(1)}
            </span>
          </div>
          
          <div className="space-y-2 text-sm">
            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              <span className="text-gray-700">{trip.pickup.address}</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 bg-red-500 rounded-full"></div>
              <span className="text-gray-700">{trip.destination.address}</span>
            </div>
          </div>
        </div>

        <div className="text-right">
          <div className="text-lg font-bold text-gray-900">₹{trip.fare.driverEarning}</div>
          <div className="text-sm text-gray-500">Your earning</div>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4 text-sm">
        <div>
          <div className="text-gray-500">Date & Time</div>
          <div className="font-medium">{new Date(trip.date + ' ' + trip.time).toLocaleDateString()}</div>
          <div className="text-xs text-gray-500">{trip.time}</div>
        </div>
        
        <div>
          <div className="text-gray-500">Distance</div>
          <div className="font-medium">{trip.distance} km</div>
          <div className="text-xs text-gray-500">{trip.duration} min</div>
        </div>
        
        <div>
          <div className="text-gray-500">Customer</div>
          <div className="font-medium">{trip.customer.name}</div>
          <div className="flex items-center space-x-1 text-xs">
            <Star className="h-3 w-3 text-yellow-500 fill-current" />
            <span>{trip.customer.rating}</span>
          </div>
        </div>
        
        <div>
          <div className="text-gray-500">Payment</div>
          <div className="font-medium capitalize">{trip.paymentMethod}</div>
          {trip.status === 'completed' && trip.rating > 0 && (
            <div className="flex items-center space-x-1 text-xs">
              <Star className="h-3 w-3 text-yellow-500 fill-current" />
              <span>Rated {trip.rating}/5</span>
            </div>
          )}
        </div>
      </div>

      <div className="flex items-center justify-between pt-4 border-t border-gray-100">
        <div className="flex space-x-2">
          <button
            onClick={() => setSelectedTrip(trip)}
            className="flex items-center space-x-1 px-3 py-1.5 text-sm text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
          >
            <Eye className="h-4 w-4" />
            <span>Details</span>
          </button>
          
          {trip.status === 'completed' && (
            <>
              <button className="flex items-center space-x-1 px-3 py-1.5 text-sm text-green-600 hover:bg-green-50 rounded-lg transition-colors">
                <NavigationIcon className="h-4 w-4" />
                <span>Route</span>
              </button>
              
              <button className="flex items-center space-x-1 px-3 py-1.5 text-sm text-purple-600 hover:bg-purple-50 rounded-lg transition-colors">
                <Download className="h-4 w-4" />
                <span>Receipt</span>
              </button>
            </>
          )}
        </div>

        <div className="flex items-center space-x-2">
          {trip.status === 'completed' && (
            <>
              <button className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors">
                <Phone className="h-4 w-4" />
              </button>
              <button className="p-1.5 text-gray-400 hover:text-green-600 hover:bg-green-50 rounded transition-colors">
                <MessageSquare className="h-4 w-4" />
              </button>
            </>
          )}
          <button className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-50 rounded transition-colors">
            <MoreHorizontal className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/50">
      <Navigation />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl border border-gray-100 p-8 mb-8">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-slate-900 to-slate-700 bg-clip-text text-transparent">
                Trip History
              </h1>
              <p className="text-slate-600 text-lg">View and analyze your ride history</p>
            </div>

            <button className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
              <Download className="h-4 w-4" />
              <span>Export Data</span>
            </button>
          </div>

          {/* Filters */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Search</label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search trips..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
              <select
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="all">All Status</option>
                <option value="completed">Completed</option>
                <option value="cancelled">Cancelled</option>
                <option value="no-show">No Show</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Month</label>
              <input
                type="month"
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Sort By</label>
              <div className="flex space-x-2">
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as any)}
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="date">Date</option>
                  <option value="fare">Fare</option>
                  <option value="rating">Rating</option>
                </select>
                <button
                  onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
                  className="px-3 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  {sortOrder === 'asc' ? '↑' : '↓'}
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-gradient-to-br from-blue-600 to-blue-700 rounded-2xl shadow-xl p-6 text-white">
            <div className="flex items-center justify-between mb-4">
              <Target className="h-8 w-8" />
              <div className="text-right">
                <div className="text-3xl font-bold">{stats.totalTrips}</div>
                <div className="text-blue-100">Total Trips</div>
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-green-600 to-green-700 rounded-2xl shadow-xl p-6 text-white">
            <div className="flex items-center justify-between mb-4">
              <DollarSign className="h-8 w-8" />
              <div className="text-right">
                <div className="text-3xl font-bold">₹{stats.totalEarnings.toLocaleString()}</div>
                <div className="text-green-100">Total Earnings</div>
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-purple-600 to-purple-700 rounded-2xl shadow-xl p-6 text-white">
            <div className="flex items-center justify-between mb-4">
              <MapPin className="h-8 w-8" />
              <div className="text-right">
                <div className="text-3xl font-bold">{stats.totalDistance.toFixed(1)}</div>
                <div className="text-purple-100">KM Driven</div>
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-yellow-600 to-yellow-700 rounded-2xl shadow-xl p-6 text-white">
            <div className="flex items-center justify-between mb-4">
              <Star className="h-8 w-8" />
              <div className="text-right">
                <div className="text-3xl font-bold">{stats.avgRating.toFixed(1)}</div>
                <div className="text-yellow-100">Avg Rating</div>
              </div>
            </div>
          </div>
        </div>

        {/* Trip List */}
        <div className="space-y-4">
          {filteredTrips.length > 0 ? (
            filteredTrips.map(trip => (
              <TripCard key={trip.id} trip={trip} />
            ))
          ) : (
            <div className="bg-white rounded-lg border border-gray-200 p-12 text-center">
              <MapPin className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No trips found</h3>
              <p className="text-gray-600">Try adjusting your search criteria or date range.</p>
            </div>
          )}
        </div>
      </div>

      {/* Trip Detail Modal */}
      {selectedTrip && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold text-gray-900">Trip Details</h2>
                <button
                  onClick={() => setSelectedTrip(null)}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <X className="h-6 w-6 text-gray-400" />
                </button>
              </div>
            </div>

            <div className="p-6 space-y-6">
              {/* Trip Info */}
              <div>
                <h3 className="font-semibold text-gray-900 mb-3">Trip Information</h3>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-gray-500">Trip ID:</span>
                    <span className="ml-2 font-medium">#{selectedTrip.id}</span>
                  </div>
                  <div>
                    <span className="text-gray-500">Status:</span>
                    <span className={`ml-2 px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(selectedTrip.status)}`}>
                      {selectedTrip.status.charAt(0).toUpperCase() + selectedTrip.status.slice(1)}
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-500">Date:</span>
                    <span className="ml-2 font-medium">{new Date(selectedTrip.date).toLocaleDateString()}</span>
                  </div>
                  <div>
                    <span className="text-gray-500">Time:</span>
                    <span className="ml-2 font-medium">{selectedTrip.time}</span>
                  </div>
                  <div>
                    <span className="text-gray-500">Distance:</span>
                    <span className="ml-2 font-medium">{selectedTrip.distance} km</span>
                  </div>
                  <div>
                    <span className="text-gray-500">Duration:</span>
                    <span className="ml-2 font-medium">{selectedTrip.duration} minutes</span>
                  </div>
                </div>
              </div>

              {/* Route */}
              <div>
                <h3 className="font-semibold text-gray-900 mb-3">Route</h3>
                <div className="space-y-3">
                  <div className="flex items-center space-x-3">
                    <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                    <div>
                      <div className="font-medium">Pickup</div>
                      <div className="text-sm text-gray-600">{selectedTrip.pickup.address}</div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-3">
                    <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                    <div>
                      <div className="font-medium">Destination</div>
                      <div className="text-sm text-gray-600">{selectedTrip.destination.address}</div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Customer Info */}
              <div>
                <h3 className="font-semibold text-gray-900 mb-3">Customer</h3>
                <div className="flex items-center space-x-4">
                  <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                    <Users className="h-6 w-6 text-blue-600" />
                  </div>
                  <div>
                    <div className="font-medium">{selectedTrip.customer.name}</div>
                    <div className="text-sm text-gray-600">{selectedTrip.customer.phone}</div>
                    <div className="flex items-center space-x-1 text-sm">
                      <Star className="h-4 w-4 text-yellow-500 fill-current" />
                      <span>Customer rating: {selectedTrip.customer.rating}/5</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Fare Breakdown */}
              <div>
                <h3 className="font-semibold text-gray-900 mb-3">Fare Breakdown</h3>
                <div className="bg-gray-50 rounded-lg p-4 space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span>Base fare:</span>
                    <span>₹{selectedTrip.fare.base}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Distance ({selectedTrip.distance} km):</span>
                    <span>₹{selectedTrip.fare.distance}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Time ({selectedTrip.duration} min):</span>
                    <span>₹{selectedTrip.fare.time}</span>
                  </div>
                  {selectedTrip.fare.surge > 0 && (
                    <div className="flex justify-between">
                      <span>Surge pricing:</span>
                      <span>₹{selectedTrip.fare.surge}</span>
                    </div>
                  )}
                  <hr className="my-2" />
                  <div className="flex justify-between font-medium">
                    <span>Total fare:</span>
                    <span>₹{selectedTrip.fare.total}</span>
                  </div>
                  <div className="flex justify-between text-green-600">
                    <span>Your earning (75%):</span>
                    <span>₹{selectedTrip.fare.driverEarning}</span>
                  </div>
                  <div className="flex justify-between text-gray-600">
                    <span>Platform fee (25%):</span>
                    <span>₹{selectedTrip.fare.commission}</span>
                  </div>
                </div>
              </div>

              {/* Rating & Feedback */}
              {selectedTrip.status === 'completed' && selectedTrip.rating > 0 && (
                <div>
                  <h3 className="font-semibold text-gray-900 mb-3">Customer Feedback</h3>
                  <div className="bg-blue-50 rounded-lg p-4">
                    <div className="flex items-center space-x-2 mb-2">
                      <div className="flex items-center space-x-1">
                        {[...Array(5)].map((_, i) => (
                          <Star
                            key={i}
                            className={`h-4 w-4 ${i < selectedTrip.rating ? 'text-yellow-500 fill-current' : 'text-gray-300'}`}
                          />
                        ))}
                      </div>
                      <span className="font-medium">{selectedTrip.rating}/5</span>
                    </div>
                    {selectedTrip.feedback && (
                      <p className="text-gray-700 text-sm">{selectedTrip.feedback}</p>
                    )}
                  </div>
                </div>
              )}
            </div>

            <div className="p-6 border-t border-gray-200 flex justify-end space-x-3">
              <button
                onClick={() => setSelectedTrip(null)}
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Close
              </button>
              {selectedTrip.status === 'completed' && (
                <>
                  <button className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors">
                    View Route
                  </button>
                  <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
                    Download Receipt
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DriverTripHistory;
