import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useBooking } from '../../contexts/BookingContext';
import Navigation from '../../components/Navigation';
import { MapPin, Navigation2, Car, Clock, CreditCard } from 'lucide-react';
import { RidesAPI } from '../../lib/api';
import { io } from 'socket.io-client';

const BookRide: React.FC = () => {
  const { user } = useAuth();
  const { createBooking } = useBooking();
  const navigate = useNavigate();
  
  const [formData, setFormData] = useState({
    pickup: '',
    destination: '',
    vehicleType: 'car' as 'car' | 'bike',
    pickupLng: 77.1734,
    pickupLat: 31.1048,
    destLng: 77.2673,
    destLat: 31.0976,
  });
  const [isBooking, setIsBooking] = useState(false);
  const [fareEstimate, setFareEstimate] = useState<number | null>(null);
  const [estimateInfo, setEstimateInfo] = useState<any>(null);

  useEffect(() => {
    if (!user) return;
    const sock = io((import.meta as any).env?.VITE_API_URL || 'https://chamba-taxi-service-2.onrender.com', { auth: { userId: user.id } });
    return () => { sock.disconnect(); };
  }, [user]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target as any;
    setFormData(prev => ({ ...prev, [name]: name.includes('Lng') || name.includes('Lat') ? Number(value) : value }));
  };

  const handleCurrentLocation = () => {
    // Navigator geolocation could be used; for now keep as is
    setFormData(prev => ({ ...prev, pickup: 'Current Location', pickupLng: 77.1734, pickupLat: 31.1048 }));
  };

  const handleEstimate = async () => {
    if (!formData.pickup || !formData.destination) return;
    const payload = {
      pickup: { address: formData.pickup, coordinates: [formData.pickupLng, formData.pickupLat] as [number, number] },
      destination: { address: formData.destination, coordinates: [formData.destLng, formData.destLat] as [number, number] },
      vehicleType: formData.vehicleType,
      regionType: 'city',
    };
    const res = await RidesAPI.estimate(payload);
    setFareEstimate(res.data.estimated);
    setEstimateInfo(res.data);
  };

  const handleBookRide = async () => {
    if (!formData.pickup || !formData.destination || !user) return;
    setIsBooking(true);
    const payload = {
      pickup: { address: formData.pickup, coordinates: [formData.pickupLng, formData.pickupLat] as [number, number] },
      destination: { address: formData.destination, coordinates: [formData.destLng, formData.destLat] as [number, number] },
      vehicleType: formData.vehicleType,
      regionType: 'city',
    };
    await createBooking(payload as any);
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
                  <label className="block text-sm font-medium text-gray-700 mb-2">Pickup Location</label>
                  <div className="relative">
                    <input type="text" name="pickup" value={formData.pickup} onChange={handleInputChange} placeholder="Enter pickup location" className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500" />
                    <div className="absolute left-3 top-3.5"><div className="w-3 h-3 bg-green-500 rounded-full"></div></div>
                  </div>
                  <div className="grid grid-cols-2 gap-3 mt-2">
                    <input type="number" name="pickupLng" value={formData.pickupLng} onChange={handleInputChange} placeholder="Pickup Lng" className="border rounded px-3 py-2" />
                    <input type="number" name="pickupLat" value={formData.pickupLat} onChange={handleInputChange} placeholder="Pickup Lat" className="border rounded px-3 py-2" />
                  </div>
                  <button onClick={handleCurrentLocation} className="mt-2 flex items-center space-x-2 text-blue-600 hover:text-blue-700 text-sm">
                    <Navigation2 className="h-4 w-4" />
                    <span>Use current location</span>
                  </button>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Destination</label>
                  <div className="relative">
                    <input type="text" name="destination" value={formData.destination} onChange={handleInputChange} placeholder="Enter destination" className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500" />
                    <div className="absolute left-3 top-3.5"><div className="w-3 h-3 bg-red-500 rounded-full"></div></div>
                  </div>
                  <div className="grid grid-cols-2 gap-3 mt-2">
                    <input type="number" name="destLng" value={formData.destLng} onChange={handleInputChange} placeholder="Dest Lng" className="border rounded px-3 py-2" />
                    <input type="number" name="destLat" value={formData.destLat} onChange={handleInputChange} placeholder="Dest Lat" className="border rounded px-3 py-2" />
                  </div>
                </div>
              </div>
            </div>

            {/* Vehicle Selection */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Choose Vehicle</h2>
              <div className="space-y-3">
                {(['car','bike'] as const).map((type) => (
                  <div key={type} onClick={() => setFormData(prev=>({...prev, vehicleType: type}))} className={`p-4 border-2 rounded-lg cursor-pointer transition-all duration-200 ${formData.vehicleType === type ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:border-gray-300'}`}>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4"><Car className={`h-8 w-8 ${formData.vehicleType === type ? 'text-blue-600' : 'text-gray-400'}`} /><div><h3 className="font-semibold text-gray-900">{type.toUpperCase()}</h3><p className="text-sm text-gray-600">Select {type}</p></div></div>
                      <div className="text-right"><div className="font-semibold text-gray-900">{type==='car'?'Car':'Bike'}</div></div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex gap-3">
              <button onClick={handleEstimate} disabled={!formData.pickup || !formData.destination} className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-900 font-semibold py-3 px-6 rounded-lg">Estimate Fare</button>
              <button onClick={handleBookRide} disabled={!formData.pickup || !formData.destination || isBooking} className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white font-semibold py-3 px-6 rounded-lg disabled:cursor-not-allowed">{isBooking? 'Finding Driver...' : 'Book Ride'}</button>
            </div>
          </div>

          {/* Summary */}
          <div className="space-y-6">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Route</h2>
              <div className="h-64 bg-gray-100 rounded-lg flex items-center justify-center"><div className="text-center"><MapPin className="h-12 w-12 text-gray-400 mx-auto mb-2" /><p className="text-gray-600">Map will appear here</p><p className="text-sm text-gray-500">Route visualization coming soon</p></div></div>
            </div>

            {fareEstimate && (
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Fare Estimate</h2>
                <div className="space-y-3">
                  <div className="flex items-center justify-between"><span className="text-gray-600">Region</span><span className="capitalize">{estimateInfo?.regionType}</span></div>
                  <div className="flex items-center justify-between"><span className="text-gray-600">Distance</span><span>{estimateInfo?.distanceKm} km</span></div>
                  <div className="flex items-center justify-between"><span className="text-gray-600">Duration</span><span>{estimateInfo?.durationMin} min</span></div>
                  <div className="border-t pt-3"><div className="flex items-center justify-between font-semibold text-lg"><span>Total</span><span className="text-green-600">₹{fareEstimate}</span></div></div>
                  <div className="flex items-center space-x-2 text-sm text-gray-500"><CreditCard className="h-4 w-4" /><span>Cash payment</span></div>
                </div>
              </div>
            )}

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-6"><div className="flex items-center space-x-3"><Clock className="h-6 w-6 text-blue-600" /><div><h3 className="font-semibold text-blue-900">Estimated Arrival</h3><p className="text-blue-700">After booking, track status live</p></div></div></div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BookRide;