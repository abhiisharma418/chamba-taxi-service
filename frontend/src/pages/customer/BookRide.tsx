import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useBooking } from '../../contexts/BookingContext';
import Navigation from '../../components/Navigation';
import { animations, cardVariants, buttonVariants, getStaggerDelay } from '../../utils/animations';
import FreeMapComponent from '../../components/FreeMapComponent';
import { getEstimateForTrip, formatFareBreakdown, FareBreakdown } from '../../utils/fareCalculation';
import LocationSearch from '../../components/LocationSearch';
import PaymentMethod from '../../components/PaymentMethod';
import WhatsAppNotification from '../../components/WhatsAppNotification';
import PromoCodeInterface from '../../components/PromoCodeInterface';
import { Car, Clock, CreditCard, Bike, Users, Zap, ArrowLeft, CheckCircle, Loader2, AlertCircle, Gift } from 'lucide-react';
import { PromoCode } from '../../services/promoCodeService';
import { RidesAPI, PaymentAPI } from '../../lib/api';
import { io } from 'socket.io-client';

interface Location {
  address: string;
  coordinates: [number, number];
}

const BookRide: React.FC = () => {
  const { user } = useAuth();
  const { createBooking } = useBooking();
  const navigate = useNavigate();

  const [pickupLocation, setPickupLocation] = useState<Location>({ address: '', coordinates: [0, 0] });
  const [destinationLocation, setDestinationLocation] = useState<Location>({ address: '', coordinates: [0, 0] });
  const [vehicleType, setVehicleType] = useState<'car' | 'bike'>('car');
  const [isBooking, setIsBooking] = useState(false);
  const [fareEstimate, setFareEstimate] = useState<number | null>(null);
  const [estimateInfo, setEstimateInfo] = useState<any>(null);
  const [fareBreakdown, setFareBreakdown] = useState<FareBreakdown | null>(null);
  const [estimateLoading, setEstimateLoading] = useState(false);
  const [estimateError, setEstimateError] = useState<string | null>(null);
  const [currentStep, setCurrentStep] = useState<'details' | 'payment' | 'confirmation'>('details');
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<any>(null);
  const [paymentProcessing, setPaymentProcessing] = useState(false);
  const [bookingData, setBookingData] = useState<any>(null);
  const [whatsappEnabled, setWhatsappEnabled] = useState(true);
  const [whatsappPhone, setWhatsappPhone] = useState(user?.phone || '');
  const [selectedPromo, setSelectedPromo] = useState<PromoCode | null>(null);
  const [showPromoCodeInterface, setShowPromoCodeInterface] = useState(false);
  const [originalFare, setOriginalFare] = useState<number | null>(null);

  useEffect(() => {
    if (!user) return;
    const sock = io((import.meta as any).env?.VITE_API_URL || 'https://chamba-taxi-service-2.onrender.com', { auth: { userId: user.id } });
    return () => { sock.disconnect(); };
  }, [user]);

  // Auto-estimate when both locations are set
  useEffect(() => {
    if (pickupLocation.address && destinationLocation.address && !estimateLoading) {
      const timer = setTimeout(() => {
        handleEstimate();
      }, 1000); // Debounce for 1 second

      return () => clearTimeout(timer);
    }
  }, [pickupLocation.address, destinationLocation.address, vehicleType]);

  const handleCurrentLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setPickupLocation({
            address: 'Current Location',
            coordinates: [position.coords.longitude, position.coords.latitude]
          });
        },
        (error) => {
          console.error('Error getting current location:', error);
          // Fallback to default location
          setPickupLocation({
            address: 'Current Location',
            coordinates: [77.1734, 31.1048]
          });
        }
      );
    }
  };

  const handleEstimate = async () => {
    if (!pickupLocation.address || !destinationLocation.address) return;

    setEstimateLoading(true);
    setEstimateError(null);
    setFareEstimate(null);
    setEstimateInfo(null);
    setFareBreakdown(null);

    try {
      // First try to get accurate estimate from backend
      const payload = {
        pickup: pickupLocation,
        destination: destinationLocation,
        vehicleType,
        regionType: 'city',
      };

      try {
        const res = await RidesAPI.estimate(payload);

        if (res.success) {
          setFareEstimate(res.data.estimated || res.data.price);
          setEstimateInfo(res.data);

          // Also calculate fare breakdown
          const breakdown = getEstimateForTrip(
            pickupLocation.address,
            destinationLocation.address,
            vehicleType,
            res.data.distanceKm,
            res.data.durationMin
          );
          setFareBreakdown(breakdown);
        } else {
          throw new Error('Backend estimation failed');
        }
      } catch (backendError) {
        console.log('Backend estimation failed, using local calculation:', backendError);

        // Fallback to local calculation
        const breakdown = getEstimateForTrip(
          pickupLocation.address,
          destinationLocation.address,
          vehicleType
        );

        setFareEstimate(breakdown.totalFare);
        setFareBreakdown(breakdown);
        setEstimateInfo({
          estimated: breakdown.totalFare,
          distanceKm: 5.2, // Default estimate
          durationMin: 12, // Default estimate
          surge: breakdown.surgeMultiplier
        });
      }
    } catch (error: any) {
      console.error('Fare estimation failed:', error);
      setEstimateError(error.message || 'Unable to calculate fare. Please try again.');
    } finally {
      setEstimateLoading(false);
    }
  };

  const handleContinueToPayment = () => {
    if (!pickupLocation.address || !destinationLocation.address || !fareEstimate) return;
    setCurrentStep('payment');
  };

  const handleBackToDetails = () => {
    setCurrentStep('details');
  };

  const handlePaymentMethodSelect = (method: any) => {
    setSelectedPaymentMethod(method);
  };

  const handlePaymentComplete = async (paymentData: any) => {
    setPaymentProcessing(true);

    try {
      // Create booking with payment info
      const bookingPayload = {
        pickup: pickupLocation,
        destination: destinationLocation,
        vehicleType,
        regionType: 'city',
        paymentMethod: paymentData.method,
        paymentStatus: paymentData.status,
        amount: fareEstimate,
        transactionId: paymentData.transactionId,
        customerId: user?.id
      };

      // Use RidesAPI directly instead of context for real API call
      const response = await RidesAPI.create(bookingPayload);

      if (response.success) {
        const booking = response.data;
        setBookingData({ ...booking, payment: paymentData });
        setCurrentStep('confirmation');

        // Send WhatsApp notification if enabled
        if (whatsappEnabled && whatsappPhone) {
          try {
            const { WhatsAppAPI } = await import('../../lib/api');
            await WhatsAppAPI.sendBookingConfirmation({
              customerPhone: whatsappPhone,
              bookingData: {
                customerName: user?.name || 'Customer',
                bookingId: booking.id || booking._id || 'N/A',
                vehicleType: vehicleType,
                pickupLocation: pickupLocation.address,
                destination: destinationLocation.address,
                fare: fareEstimate || 0
              }
            });
          } catch (whatsappError) {
            console.log('WhatsApp notification failed:', whatsappError);
            // Don't fail the booking for WhatsApp errors
          }
        }

        // If COD, show success message longer
        if (paymentData.method === 'cod') {
          setTimeout(() => {
            navigate('/customer/dashboard');
          }, 3000);
        }
      } else {
        throw new Error('Booking creation failed');
      }
    } catch (error: any) {
      console.error('Booking error:', error);
      setEstimateError(error.message || 'Booking failed. Please try again.');
      setCurrentStep('details'); // Go back to details step
    } finally {
      setPaymentProcessing(false);
    }
  };

  const handleProceedToDashboard = () => {
    navigate('/customer/dashboard');
  };

  const handlePromoSelected = (promo: PromoCode) => {
    setSelectedPromo(promo);
    if (!originalFare && fareEstimate) {
      setOriginalFare(fareEstimate);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/50">
      <Navigation />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-10">
          <div className={`bg-white/80 backdrop-blur-sm rounded-2xl p-8 shadow-lg border border-gray-100 ${animations.fadeInDown} ${animations.hoverLift}`}>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-slate-900 to-slate-700 bg-clip-text text-transparent mb-2">
              Book Your Ride
            </h1>
            <p className="text-slate-600 text-lg">Where would you like to go today?</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
          {/* Booking Form */}
          <div className="lg:col-span-3 space-y-8">
            {/* Location Inputs */}
            <div className={`bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl border border-gray-100 p-8 ${cardVariants.interactive}`} {...getStaggerDelay(0)}>
              <h2 className="text-2xl font-bold text-slate-900 mb-6">Trip Details</h2>

              <div className="space-y-6">
                <LocationSearch
                  label="Pickup Location"
                  placeholder="Where are you?"
                  value={pickupLocation.address}
                  onChange={setPickupLocation}
                  onCurrentLocation={handleCurrentLocation}
                  type="pickup"
                />

                <LocationSearch
                  label="Destination"
                  placeholder="Where to?"
                  value={destinationLocation.address}
                  onChange={setDestinationLocation}
                  type="destination"
                />
              </div>
            </div>

            {/* Vehicle Selection */}
            <div className={`bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl border border-gray-100 p-8 ${cardVariants.interactive}`} {...getStaggerDelay(1)}>
              <h2 className="text-2xl font-bold text-slate-900 mb-6">Choose Vehicle</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {[
                  { type: 'car', icon: Car, name: 'RideWithUs Car', subtitle: 'Comfortable & Safe', price: 'Starting ₹50', features: ['AC', '4 Seats', 'Luggage Space'] },
                  { type: 'bike', icon: Bike, name: 'RideWithUs Bike', subtitle: 'Quick & Affordable', price: 'Starting ₹25', features: ['Fast', '2 Wheeler', 'Traffic Free'] }
                ].map((vehicle) => {
                  const IconComponent = vehicle.icon;
                  return (
                    <div
                      key={vehicle.type}
                      onClick={() => setVehicleType(vehicle.type as 'car' | 'bike')}
                      className={`group p-6 border-2 rounded-2xl cursor-pointer transition-all duration-300 ${
                        vehicleType === vehicle.type
                          ? 'border-blue-500 bg-gradient-to-br from-blue-50 to-blue-100 shadow-lg transform scale-105'
                          : 'border-slate-200 hover:border-slate-300 hover:shadow-lg bg-white/50'
                      }`}
                    >
                      <div className="flex items-start justify-between mb-4">
                        <div className={`p-3 rounded-xl transition-all duration-300 ${
                          vehicleType === vehicle.type ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-600 group-hover:bg-slate-200'
                        }`}>
                          <IconComponent className="h-8 w-8" />
                        </div>
                        <div className={`text-lg font-bold ${
                          vehicleType === vehicle.type ? 'text-blue-600' : 'text-slate-500'
                        }`}>
                          {vehicle.price}
                        </div>
                      </div>
                      <h3 className="text-xl font-bold text-slate-900 mb-1">{vehicle.name}</h3>
                      <p className="text-slate-600 mb-3">{vehicle.subtitle}</p>
                      <div className="flex flex-wrap gap-2">
                        {vehicle.features.map((feature, index) => (
                          <span key={index} className={`px-3 py-1 rounded-full text-xs font-medium ${
                            vehicleType === vehicle.type ? 'bg-blue-100 text-blue-700' : 'bg-slate-100 text-slate-600'
                          }`}>
                            {feature}
                          </span>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* WhatsApp Notifications */}
            {currentStep === 'details' && (
              <WhatsAppNotification
                isEnabled={whatsappEnabled}
                phoneNumber={whatsappPhone}
                onToggle={setWhatsappEnabled}
                onPhoneUpdate={setWhatsappPhone}
              />
            )}

            {/* Error display */}
            {estimateError && (
              <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-center gap-3">
                <AlertCircle className="h-5 w-5 text-red-500 flex-shrink-0" />
                <p className="text-red-700">{estimateError}</p>
                <button
                  onClick={() => setEstimateError(null)}
                  className="ml-auto text-red-400 hover:text-red-600"
                >
                  ×
                </button>
              </div>
            )}

            {currentStep === 'details' && (
              <div className="flex gap-4">
                <button
                  onClick={handleEstimate}
                  disabled={!pickupLocation.address || !destinationLocation.address || estimateLoading}
                  className={`flex-1 bg-slate-200 hover:bg-slate-300 disabled:bg-slate-100 text-slate-900 font-semibold py-4 px-6 rounded-xl disabled:cursor-not-allowed ${buttonVariants.secondary}`}
                >
                  {estimateLoading ? (
                    <Loader2 className="h-5 w-5 inline mr-2 animate-spin" />
                  ) : (
                    <Zap className="h-5 w-5 inline mr-2" />
                  )}
                  {estimateLoading ? 'Calculating...' : 'Get Estimate'}
                </button>
                <button
                  onClick={handleContinueToPayment}
                  disabled={!fareEstimate}
                  className={`flex-1 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 disabled:from-slate-400 disabled:to-slate-500 text-white font-semibold py-4 px-6 rounded-xl disabled:cursor-not-allowed disabled:transform-none ${buttonVariants.primary}`}
                >
                  <CreditCard className="h-5 w-5 inline mr-2" />
                  Continue to Payment
                </button>
              </div>
            )}

            {currentStep === 'payment' && (
              <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl border border-gray-100 p-8">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-2xl font-bold text-slate-900">Payment Method</h2>
                  <button
                    onClick={handleBackToDetails}
                    className="flex items-center space-x-2 text-slate-600 hover:text-slate-800 transition-colors"
                  >
                    <ArrowLeft className="h-5 w-5" />
                    <span>Back</span>
                  </button>
                </div>

                <PaymentMethod
                  amount={fareEstimate || 0}
                  onPaymentSelect={handlePaymentMethodSelect}
                  onPaymentComplete={handlePaymentComplete}
                />
              </div>
            )}

            {currentStep === 'confirmation' && (
              <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl border border-gray-100 p-8 text-center">
                <div className="mb-6">
                  <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
                  <h2 className="text-3xl font-bold text-slate-900 mb-2">Booking Confirmed!</h2>
                  <p className="text-slate-600 text-lg">Your ride has been booked successfully</p>
                </div>

                {bookingData && (
                  <div className="bg-slate-50 rounded-xl p-6 mb-6">
                    <div className="grid grid-cols-2 gap-4 text-left">
                      <div>
                        <span className="text-slate-500 text-sm">Booking ID</span>
                        <p className="font-semibold">{bookingData._id?.slice(-8) || 'N/A'}</p>
                      </div>
                      <div>
                        <span className="text-slate-500 text-sm">Payment Method</span>
                        <p className="font-semibold capitalize">{bookingData.payment?.method || 'N/A'}</p>
                      </div>
                      <div>
                        <span className="text-slate-500 text-sm">Amount</span>
                        <p className="font-semibold">₹{fareEstimate}</p>
                      </div>
                      <div>
                        <span className="text-slate-500 text-sm">Status</span>
                        <p className="font-semibold text-green-600">Confirmed</p>
                      </div>
                    </div>
                  </div>
                )}

                <button
                  onClick={handleProceedToDashboard}
                  className="w-full bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-semibold py-4 px-6 rounded-xl transition-all duration-300 shadow-lg hover:shadow-xl"
                >
                  Go to Dashboard
                </button>
              </div>
            )}
          </div>

          {/* Map and Summary */}
          <div className="lg:col-span-2 space-y-8">
            <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl border border-gray-100 p-6">
              <h2 className="text-2xl font-bold text-slate-900 mb-6">Live Route</h2>
              <FreeMapComponent
                pickup={pickupLocation.address ? pickupLocation : undefined}
                destination={destinationLocation.address ? destinationLocation : undefined}
                onPickupChange={setPickupLocation}
                onDestinationChange={setDestinationLocation}
                showSearch={true}
                interactive={true}
                className="h-96 w-full"
              />
            </div>

            {fareEstimate && fareBreakdown && (
              <div className="bg-gradient-to-br from-green-600 to-green-700 rounded-2xl shadow-xl p-8 text-white">
                <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
                  <Zap className="h-6 w-6" />
                  Fare Estimate
                </h2>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-green-100">Distance</span>
                    <span className="font-semibold">{estimateInfo?.distanceKm?.toFixed(1) || '5.2'} km</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-green-100">Duration</span>
                    <span className="font-semibold">{estimateInfo?.durationMin || '12'} min</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-green-100">Vehicle</span>
                    <span className="font-semibold capitalize">{vehicleType}</span>
                  </div>
                  {fareBreakdown.surgeMultiplier > 1 && (
                    <div className="flex items-center justify-between">
                      <span className="text-green-100">Surge Pricing</span>
                      <span className="font-semibold text-yellow-200">{fareBreakdown.surgeMultiplier}x</span>
                    </div>
                  )}

                  {/* Fare Breakdown */}
                  <div className="border-t border-green-500 pt-4 space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-green-100">Base Fare</span>
                      <span>₹{fareBreakdown.baseAmount}</span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-green-100">Distance Charge</span>
                      <span>₹{fareBreakdown.distanceAmount}</span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-green-100">Time Charge</span>
                      <span>₹{fareBreakdown.timeAmount}</span>
                    </div>
                    {fareBreakdown.taxes > 0 && (
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-green-100">Taxes</span>
                        <span>₹{fareBreakdown.taxes}</span>
                      </div>
                    )}
                  </div>

                  {/* Promo Code Section */}
                  <div className="border-t border-green-500 pt-4">
                    {selectedPromo ? (
                      <div className="bg-green-800/30 rounded-xl p-4 mb-4">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center space-x-2">
                            <Gift className="h-4 w-4 text-green-200" />
                            <span className="text-green-100 font-medium">Promo Applied</span>
                          </div>
                          <button
                            onClick={() => setSelectedPromo(null)}
                            className="text-green-200 hover:text-white text-sm"
                          >
                            Remove
                          </button>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-green-200 font-mono">{selectedPromo.code}</span>
                          <span className="text-green-200">-₹{selectedPromo.discount?.savings || 0}</span>
                        </div>
                      </div>
                    ) : (
                      <button
                        onClick={() => setShowPromoCodeInterface(true)}
                        className="w-full bg-green-800/30 rounded-xl p-4 mb-4 border border-green-600 hover:bg-green-800/50 transition-colors"
                      >
                        <div className="flex items-center justify-center space-x-2 text-green-100">
                          <Gift className="h-5 w-5" />
                          <span>Apply Promo Code</span>
                        </div>
                      </button>
                    )}
                  </div>

                  <div className="border-t border-green-500 pt-4">
                    <div className="flex items-center justify-between text-2xl font-bold">
                      <span>Total Fare</span>
                      <span>₹{selectedPromo ? selectedPromo.discount?.finalAmount || fareEstimate : fareEstimate}</span>
                    </div>
                    {selectedPromo && (
                      <div className="flex items-center justify-between text-sm text-green-200 mt-1">
                        <span>Original Fare</span>
                        <span className="line-through">₹{fareEstimate}</span>
                      </div>
                    )}

                    {/* Commission Split Info */}
                    <div className="mt-4 bg-green-800/30 rounded-xl p-4">
                      <p className="text-green-100 text-sm font-medium mb-2">Fare Distribution:</p>
                      <div className="space-y-1 text-sm">
                        <div className="flex justify-between">
                          <span className="text-green-200">Driver Earning (75%)</span>
                          <span className="font-semibold">₹{fareBreakdown.driverEarning}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-green-200">Platform Fee (25%)</span>
                          <span className="font-semibold">₹{fareBreakdown.companyCommission}</span>
                        </div>
                      </div>
                      <p className="text-green-300 text-xs mt-2">*No additional booking fees</p>
                    </div>

                    {fareBreakdown.surgeMultiplier > 1 && (
                      <p className="text-green-200 text-sm mt-2">*Higher demand in your area</p>
                    )}
                  </div>

                  <div className="flex items-center justify-center space-x-2 text-green-100 bg-green-800/30 rounded-xl p-3">
                    <CreditCard className="h-5 w-5" />
                    <span>Multiple Payment Options Available</span>
                  </div>
                </div>
              </div>
            )}

            <div className="bg-gradient-to-r from-blue-600 to-blue-700 rounded-2xl p-8 text-white">
              <div className="flex items-center space-x-4">
                <div className="bg-white/20 p-3 rounded-xl">
                  <Clock className="h-8 w-8" />
                </div>
                <div>
                  <h3 className="text-xl font-bold mb-1">Live Tracking</h3>
                  <p className="text-blue-100">Track your driver in real-time after booking</p>
                  <p className="text-blue-200 text-sm mt-2">• Driver details • Live location • ETA updates</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Promo Code Interface */}
      <PromoCodeInterface
        isOpen={showPromoCodeInterface}
        onClose={() => setShowPromoCodeInterface(false)}
        orderAmount={fareEstimate || 0}
        vehicleType={vehicleType}
        city={pickupLocation.address.split(',').pop()?.trim()}
        onPromoSelected={handlePromoSelected}
        selectedPromo={selectedPromo}
      />
    </div>
  );
};

export default BookRide;
