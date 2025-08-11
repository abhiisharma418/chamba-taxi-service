import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useBooking } from '../../contexts/BookingContext';
import Navigation from '../../components/Navigation';
import { MapPin, Navigation2, Car, Clock, CreditCard } from 'lucide-react';

const BookRide: React.FC = () => {
  const { user } = useAuth();
  const { createBooking } = useBooking();
  const navigate = useNavigate();
  
  const [formData, setFormData] = useState({
    pickup: '',
    destination: '',
    vehicleType: 'economy' as 'economy' | 'premium' | 'luxury'
  });
  const [isBooking, setIsBooking] = useState(false);
  const [fareEstimate, setFareEstimate] = useState<number | null>(null);

  const vehicleTypes = [
    {
      type: 'economy',
      name: 'RideEconomy',
      description: 'Affordable rides for daily commute',
      price: '₹8/km',
      eta: '2-5 mins',
      capacity: '4 seats'
    },
    {
      type: 'premium',
      name: 'RidePremium',
      description: 'Comfortable rides with premium cars',
      price: '₹12/km',
      eta: '3-7 mins',
      capacity: '4 seats'
    },
    {
      type: 'luxury',
      name: 'RideLuxury',
      description: 'Premium luxury experience',
      price: '₹20/km',
      eta: '5-10 mins',
      capacity: '4 seats'
    }
  ];

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    
    // Mock fare estimation when both addresses are filled
    if (formData.pickup && formData.destination && (name === 'pickup' || name === 'destination')) {
      const distance = Math.random() * 20 + 5; // Random distance between 5-25 km
      const baseRates = { economy: 8, premium: 12, luxury: 20 };
      const estimated = Math.round(distance * baseRates[formData.vehicleType] + 50);
      setFareEstimate(estimated);
    }
  };

  const handleVehicleSelect = (type: 'economy' | 'premium' | 'luxury') => {
    setFormData(prev => ({ ...prev, vehicleType: type }));
    
    if (formData.pickup && formData.destination) {
      const distance = Math.random() * 20 + 5;
      const baseRates = { economy: 8, premium: 12, luxury: 20 };
      const estimated = Math.round(distance * baseRates[type] + 50);
      setFareEstimate(estimated);
    }
  };

  const handleCurrentLocation = () => {
    // Mock getting current location
    setFormData(prev => ({ ...prev, pickup: 'Current Location - Connaught Place, New Delhi' }));
  };

  const handleBookRide = async () => {
    if (!formData.pickup || !formData.destination || !user) return;
    
    setIsBooking(true);
    
    // Mock booking process
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    createBooking({
      customerId: user.id,
      pickup: {
        address: formData.pickup,
        coordinates: [77.2167, 28.6333] // Mock coordinates
      },
      destination: {
        address: formData.destination,
        coordinates: [77.2295, 28.6129] // Mock coordinates
      },
      vehicleType: formData.vehicleType,
      fare: {
        estimated: fareEstimate || 150
      }
    });
    
    setIsBooking(false);
    navigate('/customer/dashboard');
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />
      
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900">Book a Ride</h1>
          <p className="text-gray-600">Where would you like to go?</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Booking Form */}
          <div className="lg:col-span-2 space-y-6">
            {/* Location Inputs */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Trip Details</h2>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Pickup Location
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      name="pickup"
                      value={formData.pickup}
                      onChange={handleInputChange}
                      placeholder="Enter pickup location"
                      className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                    <div className="absolute left-3 top-3.5">
                      <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                    </div>
                  </div>
                  <button
                    onClick={handleCurrentLocation}
                    className="mt-2 flex items-center space-x-2 text-blue-600 hover:text-blue-700 text-sm"
                  >
                    <Navigation2 className="h-4 w-4" />
                    <span>Use current location</span>
                  </button>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Destination
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      name="destination"
                      value={formData.destination}
                      onChange={handleInputChange}
                      placeholder="Enter destination"
                      className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                    <div className="absolute left-3 top-3.5">
                      <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Vehicle Selection */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Choose Vehicle</h2>
              
              <div className="space-y-3">
                {vehicleTypes.map((vehicle) => (
                  <div
                    key={vehicle.type}
                    onClick={() => handleVehicleSelect(vehicle.type)}
                    className={`p-4 border-2 rounded-lg cursor-pointer transition-all duration-200 ${
                      formData.vehicleType === vehicle.type
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4">
                        <Car className={`h-8 w-8 ${
                          formData.vehicleType === vehicle.type ? 'text-blue-600' : 'text-gray-400'
                        }`} />
                        <div>
                          <h3 className="font-semibold text-gray-900">{vehicle.name}</h3>
                          <p className="text-sm text-gray-600">{vehicle.description}</p>
                          <div className="flex items-center space-x-4 mt-1 text-xs text-gray-500">
                            <span>{vehicle.capacity}</span>
                            <span>{vehicle.eta}</span>
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-semibold text-gray-900">{vehicle.price}</div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Book Button */}
            <button
              onClick={handleBookRide}
              disabled={!formData.pickup || !formData.destination || isBooking}
              className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white font-semibold py-4 px-6 rounded-lg transition-colors duration-200 disabled:cursor-not-allowed"
            >
              {isBooking ? (
                <div className="flex items-center justify-center space-x-2">
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                  <span>Finding Driver...</span>
                </div>
              ) : (
                'Book Ride'
              )}
            </button>
          </div>

          {/* Map and Fare Summary */}
          <div className="space-y-6">
            {/* Mock Map */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Route</h2>
              <div className="h-64 bg-gray-100 rounded-lg flex items-center justify-center">
                <div className="text-center">
                  <MapPin className="h-12 w-12 text-gray-400 mx-auto mb-2" />
                  <p className="text-gray-600">Map will appear here</p>
                  <p className="text-sm text-gray-500">Route visualization coming soon</p>
                </div>
              </div>
            </div>

            {/* Fare Estimate */}
            {fareEstimate && (
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Fare Estimate</h2>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600">Base fare</span>
                    <span>₹50</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600">Distance</span>
                    <span>₹{fareEstimate - 50}</span>
                  </div>
                  <div className="border-t pt-3">
                    <div className="flex items-center justify-between font-semibold text-lg">
                      <span>Total</span>
                      <span className="text-green-600">₹{fareEstimate}</span>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2 text-sm text-gray-500">
                    <CreditCard className="h-4 w-4" />
                    <span>Cash payment</span>
                  </div>
                </div>
              </div>
            )}

            {/* ETA */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
              <div className="flex items-center space-x-3">
                <Clock className="h-6 w-6 text-blue-600" />
                <div>
                  <h3 className="font-semibold text-blue-900">Estimated Arrival</h3>
                  <p className="text-blue-700">2-5 minutes after booking</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BookRide;