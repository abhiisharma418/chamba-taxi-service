import React, { useState, useEffect } from 'react';
import { X, Calendar, Clock, MapPin, Car, Users, DollarSign, Plus, Trash2 } from 'lucide-react';
import { scheduledRideService, ScheduledRideRequest, Location, SpecialRequest } from '../services/scheduledRideService';
import LocationSearch from './LocationSearch';
import PaymentMethod from './PaymentMethod';

interface ScheduleRideModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: (rideId: string) => void;
  initialData?: {
    pickupLocation?: Location;
    destinationLocation?: Location;
    vehicleType?: 'car' | 'bike' | 'premium' | 'xl';
  };
}

const ScheduleRideModal: React.FC<ScheduleRideModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  initialData
}) => {
  const [formData, setFormData] = useState<ScheduledRideRequest>({
    vehicleType: initialData?.vehicleType || 'car',
    pickupLocation: initialData?.pickupLocation || {
      address: '',
      coordinates: { latitude: 0, longitude: 0 }
    },
    destinationLocation: initialData?.destinationLocation || {
      address: '',
      coordinates: { latitude: 0, longitude: 0 }
    },
    scheduledDateTime: '',
    paymentMethod: { type: 'cash' },
    passengerCount: 1,
    priority: 'normal',
    specialRequests: [],
    recurrence: { type: 'none' }
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [step, setStep] = useState(1);
  const [fareEstimate, setFareEstimate] = useState<any>(null);

  const vehicleTypes = [
    { id: 'car', name: 'Car', icon: '🚗', description: 'Standard 4-seater' },
    { id: 'bike', name: 'Bike', icon: '🏍️', description: 'Quick & economical' },
    { id: 'premium', name: 'Premium', icon: '🚙', description: 'Luxury experience' },
    { id: 'xl', name: 'XL', icon: '🚐', description: 'Up to 8 passengers' }
  ];

  const specialRequestTypes = [
    { id: 'child_seat', name: 'Child Seat', icon: '👶' },
    { id: 'wheelchair_accessible', name: 'Wheelchair Accessible', icon: '♿' },
    { id: 'pet_friendly', name: 'Pet Friendly', icon: '🐕' },
    { id: 'extra_luggage', name: 'Extra Luggage', icon: '🧳' },
    { id: 'quiet_ride', name: 'Quiet Ride', icon: '🤫' },
    { id: 'music_preference', name: 'Music Preference', icon: '🎵' }
  ];

  useEffect(() => {
    if (isOpen) {
      setStep(1);
      setError('');
      setFareEstimate(null);
    }
  }, [isOpen]);

  const handleNext = () => {
    setError('');
    
    if (step === 1) {
      // Validate locations
      if (!formData.pickupLocation.address || !formData.destinationLocation.address) {
        setError('Please select both pickup and destination locations');
        return;
      }
    }
    
    if (step === 2) {
      // Validate date/time
      const scheduledDate = new Date(formData.scheduledDateTime);
      if (!scheduledRideService.isValidScheduleTime(scheduledDate)) {
        setError('Scheduled time must be at least 30 minutes in the future');
        return;
      }
    }
    
    setStep(step + 1);
  };

  const handleBack = () => {
    setStep(step - 1);
  };

  const handleSubmit = async () => {
    setLoading(true);
    setError('');

    try {
      const response = await scheduledRideService.createScheduledRide(formData);
      
      if (response.success) {
        onSuccess?.(response.data.rideId);
        onClose();
      } else {
        setError(response.message || 'Failed to schedule ride');
      }
    } catch (error: any) {
      setError(error.message || 'Failed to schedule ride');
    } finally {
      setLoading(false);
    }
  };

  const addSpecialRequest = () => {
    setFormData(prev => ({
      ...prev,
      specialRequests: [
        ...(prev.specialRequests || []),
        { type: 'child_seat', description: '' }
      ]
    }));
  };

  const removeSpecialRequest = (index: number) => {
    setFormData(prev => ({
      ...prev,
      specialRequests: prev.specialRequests?.filter((_, i) => i !== index) || []
    }));
  };

  const updateSpecialRequest = (index: number, updates: Partial<SpecialRequest>) => {
    setFormData(prev => ({
      ...prev,
      specialRequests: prev.specialRequests?.map((req, i) => 
        i === index ? { ...req, ...updates } : req
      ) || []
    }));
  };

  const getMinDateTime = () => {
    const min = scheduledRideService.calculateMinScheduleTime();
    return min.toISOString().slice(0, 16);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 dark:bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-dark-card rounded-3xl shadow-2xl dark:shadow-dark-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-dark-border">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-dark-800">Schedule a Ride</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 dark:hover:bg-dark-100 rounded-xl transition-colors"
          >
            <X className="w-6 h-6 text-gray-500 dark:text-dark-500" />
          </button>
        </div>

        {/* Progress Indicator */}
        <div className="px-6 py-4 border-b border-gray-200 dark:border-dark-border">
          <div className="flex items-center justify-between">
            {[1, 2, 3, 4].map((num) => (
              <div key={num} className="flex items-center">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold transition-colors ${
                  step >= num 
                    ? 'bg-blue-600 text-white' 
                    : 'bg-gray-200 dark:bg-dark-200 text-gray-500 dark:text-dark-500'
                }`}>
                  {num}
                </div>
                {num < 4 && (
                  <div className={`w-12 h-1 mx-2 transition-colors ${
                    step > num ? 'bg-blue-600' : 'bg-gray-200 dark:bg-dark-200'
                  }`} />
                )}
              </div>
            ))}
          </div>
          <div className="flex justify-between mt-2 text-xs text-gray-500 dark:text-dark-500">
            <span>Locations</span>
            <span>Schedule</span>
            <span>Options</span>
            <span>Payment</span>
          </div>
        </div>

        {/* Content */}
        <div className="p-6">
          {error && (
            <div className="mb-4 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl">
              <p className="text-red-600 dark:text-red-400 text-sm">{error}</p>
            </div>
          )}

          {/* Step 1: Locations */}
          {step === 1 && (
            <div className="space-y-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-dark-800 flex items-center">
                <MapPin className="w-5 h-5 mr-2" />
                Trip Details
              </h3>
              
              <LocationSearch
                label="Pickup Location"
                placeholder="Where are you?"
                value={formData.pickupLocation.address}
                onChange={(location) => setFormData(prev => ({ ...prev, pickupLocation: location }))}
                type="pickup"
              />
              
              <LocationSearch
                label="Destination"
                placeholder="Where to?"
                value={formData.destinationLocation.address}
                onChange={(location) => setFormData(prev => ({ ...prev, destinationLocation: location }))}
                type="destination"
              />

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-dark-600 mb-3">Vehicle Type</label>
                <div className="grid grid-cols-2 gap-3">
                  {vehicleTypes.map((vehicle) => (
                    <button
                      key={vehicle.id}
                      type="button"
                      onClick={() => setFormData(prev => ({ ...prev, vehicleType: vehicle.id as any }))}
                      className={`p-4 rounded-xl border-2 transition-all ${
                        formData.vehicleType === vehicle.id
                          ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                          : 'border-gray-200 dark:border-dark-border hover:border-gray-300 dark:hover:border-dark-300'
                      }`}
                    >
                      <div className="text-2xl mb-2">{vehicle.icon}</div>
                      <div className="text-sm font-semibold text-gray-900 dark:text-dark-800">{vehicle.name}</div>
                      <div className="text-xs text-gray-500 dark:text-dark-500">{vehicle.description}</div>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Step 2: Schedule */}
          {step === 2 && (
            <div className="space-y-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-dark-800 flex items-center">
                <Calendar className="w-5 h-5 mr-2" />
                Schedule Details
              </h3>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-dark-600 mb-2">
                  Date & Time
                </label>
                <input
                  type="datetime-local"
                  value={formData.scheduledDateTime}
                  min={getMinDateTime()}
                  onChange={(e) => setFormData(prev => ({ ...prev, scheduledDateTime: e.target.value }))}
                  className="w-full px-4 py-3 border border-gray-300 dark:border-dark-border rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-dark-100 text-gray-900 dark:text-dark-800"
                />
                <p className="text-xs text-gray-500 dark:text-dark-500 mt-1">
                  Rides must be scheduled at least 30 minutes in advance
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-dark-600 mb-2">
                  Priority
                </label>
                <select
                  value={formData.priority}
                  onChange={(e) => setFormData(prev => ({ ...prev, priority: e.target.value as any }))}
                  className="w-full px-4 py-3 border border-gray-300 dark:border-dark-border rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-dark-100 text-gray-900 dark:text-dark-800"
                >
                  <option value="normal">Normal</option>
                  <option value="high">High Priority (+$5)</option>
                  <option value="urgent">Urgent (+$10)</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-dark-600 mb-3">
                  Repeat Schedule
                </label>
                <div className="space-y-3">
                  <select
                    value={formData.recurrence?.type || 'none'}
                    onChange={(e) => setFormData(prev => ({
                      ...prev,
                      recurrence: { ...prev.recurrence, type: e.target.value as any }
                    }))}
                    className="w-full px-4 py-3 border border-gray-300 dark:border-dark-border rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-dark-100 text-gray-900 dark:text-dark-800"
                  >
                    <option value="none">One-time ride</option>
                    <option value="daily">Daily</option>
                    <option value="weekly">Weekly</option>
                    <option value="monthly">Monthly</option>
                  </select>

                  {formData.recurrence?.type !== 'none' && (
                    <input
                      type="date"
                      placeholder="End date (optional)"
                      value={formData.recurrence?.endDate || ''}
                      onChange={(e) => setFormData(prev => ({
                        ...prev,
                        recurrence: { ...prev.recurrence, endDate: e.target.value }
                      }))}
                      className="w-full px-4 py-3 border border-gray-300 dark:border-dark-border rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-dark-100 text-gray-900 dark:text-dark-800"
                    />
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Step 3: Options */}
          {step === 3 && (
            <div className="space-y-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-dark-800 flex items-center">
                <Users className="w-5 h-5 mr-2" />
                Ride Options
              </h3>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-dark-600 mb-2">
                  Number of Passengers
                </label>
                <select
                  value={formData.passengerCount}
                  onChange={(e) => setFormData(prev => ({ ...prev, passengerCount: parseInt(e.target.value) }))}
                  className="w-full px-4 py-3 border border-gray-300 dark:border-dark-border rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-dark-100 text-gray-900 dark:text-dark-800"
                >
                  {[1, 2, 3, 4, 5, 6, 7, 8].map(num => (
                    <option key={num} value={num}>{num} passenger{num !== 1 ? 's' : ''}</option>
                  ))}
                </select>
              </div>

              <div>
                <div className="flex items-center justify-between mb-3">
                  <label className="block text-sm font-medium text-gray-700 dark:text-dark-600">
                    Special Requests
                  </label>
                  <button
                    type="button"
                    onClick={addSpecialRequest}
                    className="flex items-center text-blue-600 dark:text-blue-400 text-sm hover:text-blue-700 dark:hover:text-blue-300"
                  >
                    <Plus className="w-4 h-4 mr-1" />
                    Add Request
                  </button>
                </div>

                <div className="space-y-3">
                  {formData.specialRequests?.map((request, index) => (
                    <div key={index} className="flex items-center space-x-3 p-3 border border-gray-200 dark:border-dark-border rounded-xl">
                      <select
                        value={request.type}
                        onChange={(e) => updateSpecialRequest(index, { type: e.target.value as any })}
                        className="flex-1 px-3 py-2 border border-gray-300 dark:border-dark-border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-dark-100 text-gray-900 dark:text-dark-800"
                      >
                        {specialRequestTypes.map(type => (
                          <option key={type.id} value={type.id}>
                            {type.icon} {type.name}
                          </option>
                        ))}
                      </select>
                      <button
                        type="button"
                        onClick={() => removeSpecialRequest(index)}
                        className="p-2 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-dark-600 mb-2">
                  Additional Notes
                </label>
                <textarea
                  value={formData.customerNotes || ''}
                  onChange={(e) => setFormData(prev => ({ ...prev, customerNotes: e.target.value }))}
                  placeholder="Any special instructions for the driver..."
                  rows={3}
                  className="w-full px-4 py-3 border border-gray-300 dark:border-dark-border rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-dark-100 text-gray-900 dark:text-dark-800 resize-none"
                />
              </div>
            </div>
          )}

          {/* Step 4: Payment */}
          {step === 4 && (
            <div className="space-y-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-dark-800 flex items-center">
                <DollarSign className="w-5 h-5 mr-2" />
                Payment & Summary
              </h3>

              <PaymentMethod
                selectedMethod={formData.paymentMethod}
                onMethodChange={(method) => setFormData(prev => ({ ...prev, paymentMethod: method }))}
              />

              {/* Ride Summary */}
              <div className="bg-gray-50 dark:bg-dark-100 rounded-xl p-4">
                <h4 className="font-semibold text-gray-900 dark:text-dark-800 mb-3">Ride Summary</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-dark-500">From:</span>
                    <span className="text-gray-900 dark:text-dark-800 font-medium">{formData.pickupLocation.address}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-dark-500">To:</span>
                    <span className="text-gray-900 dark:text-dark-800 font-medium">{formData.destinationLocation.address}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-dark-500">Vehicle:</span>
                    <span className="text-gray-900 dark:text-dark-800 font-medium">
                      {vehicleTypes.find(v => v.id === formData.vehicleType)?.name}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-dark-500">Scheduled:</span>
                    <span className="text-gray-900 dark:text-dark-800 font-medium">
                      {formData.scheduledDateTime ? scheduledRideService.formatScheduleTime(formData.scheduledDateTime) : 'Not set'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-dark-500">Passengers:</span>
                    <span className="text-gray-900 dark:text-dark-800 font-medium">{formData.passengerCount}</span>
                  </div>
                  {formData.recurrence?.type !== 'none' && (
                    <div className="flex justify-between">
                      <span className="text-gray-600 dark:text-dark-500">Repeat:</span>
                      <span className="text-gray-900 dark:text-dark-800 font-medium">
                        {scheduledRideService.getRecurrenceText(formData.recurrence!)}
                      </span>
                    </div>
                  )}
                </div>
              </div>

              <div className="bg-blue-50 dark:bg-blue-900/20 rounded-xl p-4 border border-blue-200 dark:border-blue-800">
                <p className="text-blue-800 dark:text-blue-300 text-sm">
                  <strong>Note:</strong> Final fare will be calculated based on actual distance and time. 
                  Scheduled rides have a 20% surcharge and can be cancelled free of charge up to 24 hours before the scheduled time.
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex items-center justify-between p-6 border-t border-gray-200 dark:border-dark-border">
          <button
            onClick={step === 1 ? onClose : handleBack}
            className="px-6 py-3 text-gray-600 dark:text-dark-500 hover:text-gray-800 dark:hover:text-dark-300 font-semibold transition-colors"
          >
            {step === 1 ? 'Cancel' : 'Back'}
          </button>

          <button
            onClick={step === 4 ? handleSubmit : handleNext}
            disabled={loading}
            className="px-8 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-semibold rounded-xl transition-colors flex items-center"
          >
            {loading ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Scheduling...
              </>
            ) : step === 4 ? (
              'Schedule Ride'
            ) : (
              'Next'
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ScheduleRideModal;
