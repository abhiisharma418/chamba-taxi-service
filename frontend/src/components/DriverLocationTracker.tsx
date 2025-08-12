import React, { useState, useEffect, useRef } from 'react';
import { MapPin, Navigation, Power, Wifi, WifiOff, Clock } from 'lucide-react';
import { TrackingAPI } from '../lib/api';

interface DriverLocationTrackerProps {
  driverId: string;
  isOnline: boolean;
  activeRideId?: string;
  onLocationUpdate?: (location: { lat: number; lng: number }) => void;
}

interface LocationData {
  lat: number;
  lng: number;
  heading: number;
  speed: number;
  accuracy: number;
  timestamp: Date;
}

const DriverLocationTracker: React.FC<DriverLocationTrackerProps> = ({
  driverId,
  isOnline,
  activeRideId,
  onLocationUpdate
}) => {
  const [isTracking, setIsTracking] = useState(false);
  const [lastLocation, setLastLocation] = useState<LocationData | null>(null);
  const [locationError, setLocationError] = useState<string | null>(null);
  const [updateCount, setUpdateCount] = useState(0);
  const [batterySaving, setBatterySaving] = useState(false);
  
  const watchIdRef = useRef<number | null>(null);
  const lastUpdateRef = useRef<Date>(new Date());
  const locationBufferRef = useRef<LocationData[]>([]);

  // Start/stop tracking based on online status
  useEffect(() => {
    if (isOnline && !isTracking) {
      startLocationTracking();
    } else if (!isOnline && isTracking) {
      stopLocationTracking();
    }

    return () => {
      stopLocationTracking();
    };
  }, [isOnline]);

  // Start location tracking
  const startLocationTracking = () => {
    if (!navigator.geolocation) {
      setLocationError('Geolocation is not supported by this browser');
      return;
    }

    const options: PositionOptions = {
      enableHighAccuracy: true,
      timeout: 10000,
      maximumAge: 1000
    };

    const watchId = navigator.geolocation.watchPosition(
      handleLocationUpdate,
      handleLocationError,
      options
    );

    watchIdRef.current = watchId;
    setIsTracking(true);
    setLocationError(null);
    console.log('Started location tracking for driver:', driverId);
  };

  // Stop location tracking
  const stopLocationTracking = () => {
    if (watchIdRef.current !== null) {
      navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
    }
    setIsTracking(false);
    console.log('Stopped location tracking for driver:', driverId);
  };

  // Handle location updates
  const handleLocationUpdate = async (position: GeolocationPosition) => {
    const { latitude, longitude, heading, speed, accuracy } = position.coords;
    
    const locationData: LocationData = {
      lat: latitude,
      lng: longitude,
      heading: heading || 0,
      speed: (speed || 0) * 3.6, // Convert m/s to km/h
      accuracy: accuracy || 0,
      timestamp: new Date()
    };

    setLastLocation(locationData);
    onLocationUpdate?.({ lat: latitude, lng: longitude });

    // Update count for UI
    setUpdateCount(prev => prev + 1);

    // Determine update frequency based on context
    const now = new Date();
    const timeSinceLastUpdate = now.getTime() - lastUpdateRef.current.getTime();
    
    let shouldSendUpdate = false;
    
    if (activeRideId) {
      // During active ride: send updates more frequently
      shouldSendUpdate = timeSinceLastUpdate >= 5000; // Every 5 seconds
    } else {
      // When idle: send updates less frequently to save battery
      shouldSendUpdate = timeSinceLastUpdate >= 30000; // Every 30 seconds
    }

    if (shouldSendUpdate) {
      try {
        await TrackingAPI.updateLocation({
          lat: latitude,
          lng: longitude,
          heading: heading || 0,
          speed: (speed || 0) * 3.6,
          accuracy: accuracy || 0
        });
        
        lastUpdateRef.current = now;
        setLocationError(null);
      } catch (error) {
        console.error('Failed to update location:', error);
        
        // Buffer locations for batch update if single updates fail
        locationBufferRef.current.push(locationData);
        
        // Try batch update if buffer gets too large
        if (locationBufferRef.current.length >= 5) {
          tryBatchUpdate();
        }
      }
    }
  };

  // Handle location errors
  const handleLocationError = (error: GeolocationPositionError) => {
    let errorMessage = 'Location access denied';
    
    switch (error.code) {
      case error.PERMISSION_DENIED:
        errorMessage = 'Location access denied by user';
        break;
      case error.POSITION_UNAVAILABLE:
        errorMessage = 'Location information unavailable';
        break;
      case error.TIMEOUT:
        errorMessage = 'Location request timed out';
        break;
    }
    
    setLocationError(errorMessage);
    console.error('Location error:', error);
  };

  // Try batch location update
  const tryBatchUpdate = async () => {
    if (locationBufferRef.current.length === 0) return;

    try {
      await TrackingAPI.batchUpdateLocation({
        locations: locationBufferRef.current.map(loc => ({
          lat: loc.lat,
          lng: loc.lng,
          timestamp: loc.timestamp,
          heading: loc.heading,
          speed: loc.speed,
          accuracy: loc.accuracy
        }))
      });
      
      // Clear buffer on successful batch update
      locationBufferRef.current = [];
      setLocationError(null);
    } catch (error) {
      console.error('Batch location update failed:', error);
    }
  };

  // Toggle battery saving mode
  const toggleBatterySaving = () => {
    setBatterySaving(!batterySaving);
  };

  // Get signal strength indicator
  const getSignalStrength = () => {
    if (!lastLocation) return 'poor';
    
    const accuracy = lastLocation.accuracy;
    if (accuracy <= 10) return 'excellent';
    if (accuracy <= 20) return 'good';
    if (accuracy <= 50) return 'fair';
    return 'poor';
  };

  const signalStrength = getSignalStrength();

  return (
    <div className="bg-white rounded-lg shadow-md p-4">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-2">
          <div className={`p-2 rounded-full ${isTracking ? 'bg-green-100' : 'bg-gray-100'}`}>
            <MapPin className={`h-5 w-5 ${isTracking ? 'text-green-600' : 'text-gray-400'}`} />
          </div>
          <div>
            <h3 className="font-medium text-gray-900">Location Tracking</h3>
            <p className="text-sm text-gray-600">
              {isTracking ? 'Active' : 'Inactive'}
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          {/* Signal Strength */}
          <div className={`p-1 rounded ${
            signalStrength === 'excellent' ? 'bg-green-100' :
            signalStrength === 'good' ? 'bg-yellow-100' :
            signalStrength === 'fair' ? 'bg-orange-100' : 'bg-red-100'
          }`}>
            {isTracking ? (
              <Wifi className={`h-4 w-4 ${
                signalStrength === 'excellent' ? 'text-green-600' :
                signalStrength === 'good' ? 'text-yellow-600' :
                signalStrength === 'fair' ? 'text-orange-600' : 'text-red-600'
              }`} />
            ) : (
              <WifiOff className="h-4 w-4 text-gray-400" />
            )}
          </div>

          {/* Battery Saving Toggle */}
          <button
            onClick={toggleBatterySaving}
            className={`p-1 rounded ${batterySaving ? 'bg-blue-100' : 'bg-gray-100'}`}
          >
            <Power className={`h-4 w-4 ${batterySaving ? 'text-blue-600' : 'text-gray-400'}`} />
          </button>
        </div>
      </div>

      {/* Location Details */}
      {lastLocation && (
        <div className="grid grid-cols-2 gap-4 mb-4">
          <div className="bg-gray-50 rounded-lg p-3">
            <div className="text-xs text-gray-500 mb-1">Coordinates</div>
            <div className="text-sm font-mono">
              {lastLocation.lat.toFixed(6)}, {lastLocation.lng.toFixed(6)}
            </div>
          </div>
          
          <div className="bg-gray-50 rounded-lg p-3">
            <div className="text-xs text-gray-500 mb-1">Accuracy</div>
            <div className="text-sm font-medium">
              ±{Math.round(lastLocation.accuracy)}m
            </div>
          </div>
          
          <div className="bg-gray-50 rounded-lg p-3">
            <div className="text-xs text-gray-500 mb-1">Speed</div>
            <div className="text-sm font-medium">
              {Math.round(lastLocation.speed)} km/h
            </div>
          </div>
          
          <div className="bg-gray-50 rounded-lg p-3">
            <div className="text-xs text-gray-500 mb-1">Heading</div>
            <div className="text-sm font-medium">
              <Navigation className="h-3 w-3 inline mr-1" style={{ transform: `rotate(${lastLocation.heading}deg)` }} />
              {Math.round(lastLocation.heading)}°
            </div>
          </div>
        </div>
      )}

      {/* Status Information */}
      <div className="space-y-2 text-sm">
        <div className="flex justify-between">
          <span className="text-gray-600">Updates Sent:</span>
          <span className="font-medium">{updateCount}</span>
        </div>
        
        {lastLocation && (
          <div className="flex justify-between">
            <span className="text-gray-600">Last Update:</span>
            <span className="font-medium">
              {lastLocation.timestamp.toLocaleTimeString()}
            </span>
          </div>
        )}

        {activeRideId && (
          <div className="flex justify-between">
            <span className="text-gray-600">Active Ride:</span>
            <span className="font-medium text-green-600">
              {activeRideId.slice(-8)}
            </span>
          </div>
        )}

        {batterySaving && (
          <div className="flex items-center space-x-1 text-blue-600">
            <Power className="h-3 w-3" />
            <span className="text-xs">Battery saving mode enabled</span>
          </div>
        )}
      </div>

      {/* Error Display */}
      {locationError && (
        <div className="mt-4 bg-red-50 border border-red-200 rounded-lg p-3">
          <div className="flex items-center space-x-2">
            <WifiOff className="h-4 w-4 text-red-500" />
            <span className="text-red-700 text-sm">{locationError}</span>
          </div>
        </div>
      )}

      {/* Buffer Status */}
      {locationBufferRef.current.length > 0 && (
        <div className="mt-2 bg-yellow-50 border border-yellow-200 rounded-lg p-2">
          <div className="flex items-center space-x-2">
            <Clock className="h-4 w-4 text-yellow-600" />
            <span className="text-yellow-700 text-xs">
              {locationBufferRef.current.length} locations queued for sync
            </span>
          </div>
        </div>
      )}
    </div>
  );
};

export default DriverLocationTracker;
