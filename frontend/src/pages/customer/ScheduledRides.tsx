import React, { useState } from 'react';
import { Plus, Calendar } from 'lucide-react';
import Navigation from '../../components/Navigation';
import ScheduledRidesList from '../../components/ScheduledRidesList';
import ScheduleRideModal from '../../components/ScheduleRideModal';
import { ScheduledRide } from '../../services/scheduledRideService';
import { animations, cardVariants, getStaggerDelay } from '../../utils/animations';

const ScheduledRides: React.FC = () => {
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [selectedRide, setSelectedRide] = useState<ScheduledRide | null>(null);
  const [activeView, setActiveView] = useState<'upcoming' | 'all'>('upcoming');

  const handleScheduleSuccess = (rideId: string) => {
    // Refresh the list or show success message
    console.log('Ride scheduled successfully:', rideId);
  };

  const handleEditRide = (ride: ScheduledRide) => {
    setSelectedRide(ride);
    setShowScheduleModal(true);
  };

  const handleViewRide = (ride: ScheduledRide) => {
    // Navigate to ride details or show modal
    console.log('View ride:', ride);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/50 dark:from-dark-surface dark:via-dark-100 dark:to-dark-200 transition-colors duration-300">
      <Navigation />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header Section */}
        <div className="mb-10">
          <div className={`bg-white/80 dark:bg-dark-card/80 backdrop-blur-sm rounded-2xl p-8 shadow-lg dark:shadow-dark-lg border border-gray-100 dark:border-dark-border ${animations.fadeInDown}`}>
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold bg-gradient-to-r from-slate-900 to-slate-700 dark:from-dark-800 dark:to-dark-600 bg-clip-text text-transparent mb-2">
                  Scheduled Rides
                </h1>
                <p className="text-slate-600 dark:text-dark-500 text-lg">
                  Plan your future trips with scheduled rides
                </p>
              </div>
              
              <button
                onClick={() => setShowScheduleModal(true)}
                className={`flex items-center space-x-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white font-semibold rounded-xl hover:from-blue-700 hover:to-purple-700 transition-all duration-300 shadow-lg hover:shadow-xl ${cardVariants.interactive}`}
              >
                <Plus className="w-5 h-5" />
                <span>Schedule Ride</span>
              </button>
            </div>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className={`bg-white/80 dark:bg-dark-card/80 backdrop-blur-sm rounded-2xl p-6 shadow-lg dark:shadow-dark-lg border border-gray-100 dark:border-dark-border ${animations.slideInLeft}`} {...getStaggerDelay(0)}>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                  {/* This would be populated from API */}
                  12
                </p>
                <p className="text-sm text-gray-600 dark:text-dark-500">Upcoming Rides</p>
              </div>
              <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center">
                <Calendar className="w-6 h-6 text-white" />
              </div>
            </div>
          </div>

          <div className={`bg-white/80 dark:bg-dark-card/80 backdrop-blur-sm rounded-2xl p-6 shadow-lg dark:shadow-dark-lg border border-gray-100 dark:border-dark-border ${animations.slideInLeft}`} {...getStaggerDelay(1)}>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-2xl font-bold text-green-600 dark:text-green-400">
                  45
                </p>
                <p className="text-sm text-gray-600 dark:text-dark-500">Completed</p>
              </div>
              <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-green-600 rounded-xl flex items-center justify-center">
                <span className="text-xl">✓</span>
              </div>
            </div>
          </div>

          <div className={`bg-white/80 dark:bg-dark-card/80 backdrop-blur-sm rounded-2xl p-6 shadow-lg dark:shadow-dark-lg border border-gray-100 dark:border-dark-border ${animations.slideInLeft}`} {...getStaggerDelay(2)}>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                  $284
                </p>
                <p className="text-sm text-gray-600 dark:text-dark-500">Total Saved</p>
              </div>
              <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl flex items-center justify-center">
                <span className="text-xl">💰</span>
              </div>
            </div>
          </div>
        </div>

        {/* View Toggle */}
        <div className="mb-6">
          <div className="flex space-x-1 bg-white/60 dark:bg-dark-card/60 backdrop-blur-sm rounded-xl p-1 w-fit border border-gray-200 dark:border-dark-border">
            <button
              onClick={() => setActiveView('upcoming')}
              className={`px-6 py-2 rounded-lg font-semibold transition-all duration-300 ${
                activeView === 'upcoming'
                  ? 'bg-white dark:bg-dark-100 text-blue-600 dark:text-blue-400 shadow-sm dark:shadow-dark-sm'
                  : 'text-gray-600 dark:text-dark-500 hover:text-gray-900 dark:hover:text-dark-300'
              }`}
            >
              Upcoming Rides
            </button>
            <button
              onClick={() => setActiveView('all')}
              className={`px-6 py-2 rounded-lg font-semibold transition-all duration-300 ${
                activeView === 'all'
                  ? 'bg-white dark:bg-dark-100 text-blue-600 dark:text-blue-400 shadow-sm dark:shadow-dark-sm'
                  : 'text-gray-600 dark:text-dark-500 hover:text-gray-900 dark:hover:text-dark-300'
              }`}
            >
              All Rides
            </button>
          </div>
        </div>

        {/* Rides List */}
        <div className={`bg-white/80 dark:bg-dark-card/80 backdrop-blur-sm rounded-2xl p-8 shadow-lg dark:shadow-dark-lg border border-gray-100 dark:border-dark-border ${animations.fadeInUp}`}>
          <ScheduledRidesList
            upcoming={activeView === 'upcoming'}
            onEditRide={handleEditRide}
            onViewRide={handleViewRide}
          />
        </div>

        {/* Quick Tips */}
        <div className={`mt-8 bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 rounded-2xl p-6 border border-blue-200 dark:border-blue-800 ${animations.fadeInUp}`}>
          <h3 className="text-lg font-semibold text-blue-900 dark:text-blue-300 mb-3">💡 Scheduled Rides Tips</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-blue-800 dark:text-blue-200">
            <div className="flex items-start space-x-2">
              <span className="text-blue-500">•</span>
              <span>Schedule rides at least 30 minutes in advance</span>
            </div>
            <div className="flex items-start space-x-2">
              <span className="text-blue-500">•</span>
              <span>Recurring rides save you time and money</span>
            </div>
            <div className="flex items-start space-x-2">
              <span className="text-blue-500">•</span>
              <span>Cancel up to 24 hours before for free</span>
            </div>
            <div className="flex items-start space-x-2">
              <span className="text-blue-500">•</span>
              <span>High priority rides get better driver matching</span>
            </div>
          </div>
        </div>
      </div>

      {/* Schedule Ride Modal */}
      <ScheduleRideModal
        isOpen={showScheduleModal}
        onClose={() => {
          setShowScheduleModal(false);
          setSelectedRide(null);
        }}
        onSuccess={handleScheduleSuccess}
        initialData={selectedRide ? {
          pickupLocation: selectedRide.pickupLocation,
          destinationLocation: selectedRide.destinationLocation,
          vehicleType: selectedRide.vehicleType
        } : undefined}
      />
    </div>
  );
};

export default ScheduledRides;
