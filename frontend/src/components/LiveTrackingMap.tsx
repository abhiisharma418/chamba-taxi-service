import React, { useState, useEffect, useRef } from 'react';
import { MapPin, Navigation, Clock, Phone, MessageCircle, AlertTriangle, Car } from 'lucide-react';
import { useGoogleMaps } from '../hooks/useGoogleMaps';
import { io, Socket } from 'socket.io-client';

interface LiveTrackingMapProps {
  rideId: string;
  customerId?: string;
  driverId?: string;
  pickupLocation?: { lat: number; lng: number; address?: string };
  destinationLocation?: { lat: number; lng: number; address?: string };
  height?: string;
  onDriverContact?: () => void;
  onEmergency?: () => void;
}

interface DriverLocation {
  lat: number;
  lng: number;
  heading: number;
  speed: number;
  timestamp: Date;
  eta?: {
    distanceKm: number;
    etaMinutes: number;
    estimatedArrival: Date;
  };
}

const LiveTrackingMap: React.FC<LiveTrackingMapProps> = ({
  rideId,
  customerId,
  driverId,
  pickupLocation,
  destinationLocation,
  height = '400px',
  onDriverContact,
  onEmergency
}) => {
  const { isLoaded, loadError } = useGoogleMaps();
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<google.maps.Map | null>(null);
  const driverMarkerRef = useRef<google.maps.Marker | null>(null);
  const pickupMarkerRef = useRef<google.maps.Marker | null>(null);
  const destinationMarkerRef = useRef<google.maps.Marker | null>(null);
  const routeRendererRef = useRef<google.maps.DirectionsRenderer | null>(null);
  const socketRef = useRef<Socket | null>(null);

  const [driverLocation, setDriverLocation] = useState<DriverLocation | null>(null);
  const [isTracking, setIsTracking] = useState(false);
  const [trackingStatus, setTrackingStatus] = useState<'connecting' | 'active' | 'inactive'>('connecting');
  const [eta, setEta] = useState<any>(null);

  // Initialize socket connection
  useEffect(() => {
    if (!rideId) return;

    const socket = io(import.meta.env?.VITE_API_URL || 'https://chamba-taxi-service-2.onrender.com', {
      auth: { userId: customerId || driverId }
    });

    socketRef.current = socket;

    // Join ride room
    socket.emit('ride:join', rideId);

    // Listen for tracking events
    socket.on('tracking:started', (data) => {
      console.log('Tracking started:', data);
      setIsTracking(true);
      setTrackingStatus('active');
    });

    socket.on('tracking:ended', (data) => {
      console.log('Tracking ended:', data);
      setIsTracking(false);
      setTrackingStatus('inactive');
    });

    socket.on('driver:location', (data) => {
      console.log('Driver location update:', data);
      setDriverLocation({
        lat: data.location.lat,
        lng: data.location.lng,
        heading: data.heading || 0,
        speed: data.speed || 0,
        timestamp: new Date(data.timestamp),
        eta: data.eta
      });
      setEta(data.eta);
      updateDriverMarker(data.location, data.heading);
    });

    socket.on('geofence:alert', (alert) => {
      console.log('Geofence alert:', alert);
      // Handle geofence alerts (driver arrived at pickup/destination)
      if (alert.type === 'arrived_pickup') {
        // Show notification that driver arrived
      } else if (alert.type === 'arrived_destination') {
        // Show notification that ride is ending
      }
    });

    socket.on('emergency:triggered', (data) => {
      console.log('Emergency triggered:', data);
      // Handle emergency alerts
    });

    return () => {
      socket.disconnect();
    };
  }, [rideId, customerId, driverId]);

  // Initialize map
  useEffect(() => {
    if (!isLoaded || !mapRef.current) return;

    const map = new google.maps.Map(mapRef.current, {
      zoom: 15,
      center: pickupLocation || { lat: 31.1048, lng: 77.1734 },
      mapTypeId: google.maps.MapTypeId.ROADMAP,
      styles: [
        {
          featureType: 'poi',
          elementType: 'labels',
          stylers: [{ visibility: 'off' }]
        }
      ]
    });

    mapInstanceRef.current = map;

    // Initialize route renderer
    const directionsRenderer = new google.maps.DirectionsRenderer({
      suppressMarkers: true,
      polylineOptions: {
        strokeColor: '#2563eb',
        strokeWeight: 4,
        strokeOpacity: 0.8
      }
    });
    directionsRenderer.setMap(map);
    routeRendererRef.current = directionsRenderer;

    // Add pickup marker
    if (pickupLocation) {
      const pickupMarker = new google.maps.Marker({
        position: pickupLocation,
        map,
        title: 'Pickup Location',
        icon: {
          url: 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(`
            <svg width="32" height="32" viewBox="0 0 32 32" xmlns="http://www.w3.org/2000/svg">
              <circle cx="16" cy="16" r="12" fill="#10b981" stroke="white" stroke-width="3"/>
              <circle cx="16" cy="16" r="4" fill="white"/>
            </svg>
          `),
          scaledSize: new google.maps.Size(32, 32),
          anchor: new google.maps.Point(16, 16)
        }
      });
      pickupMarkerRef.current = pickupMarker;
    }

    // Add destination marker
    if (destinationLocation) {
      const destinationMarker = new google.maps.Marker({
        position: destinationLocation,
        map,
        title: 'Destination',
        icon: {
          url: 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(`
            <svg width="32" height="32" viewBox="0 0 32 32" xmlns="http://www.w3.org/2000/svg">
              <circle cx="16" cy="16" r="12" fill="#dc2626" stroke="white" stroke-width="3"/>
              <circle cx="16" cy="16" r="4" fill="white"/>
            </svg>
          `),
          scaledSize: new google.maps.Size(32, 32),
          anchor: new google.maps.Point(16, 16)
        }
      });
      destinationMarkerRef.current = destinationMarker;
    }

    // Show route if both locations are available
    if (pickupLocation && destinationLocation) {
      showRoute(pickupLocation, destinationLocation);
    }

  }, [isLoaded, pickupLocation, destinationLocation]);

  const updateDriverMarker = (location: { lat: number; lng: number }, heading: number = 0) => {
    if (!mapInstanceRef.current) return;

    // Remove existing driver marker
    if (driverMarkerRef.current) {
      driverMarkerRef.current.setMap(null);
    }

    // Create new driver marker with car icon
    const driverMarker = new google.maps.Marker({
      position: location,
      map: mapInstanceRef.current,
      title: 'Driver Location',
      icon: {
        url: 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(`
          <svg width="40" height="40" viewBox="0 0 40 40" xmlns="http://www.w3.org/2000/svg">
            <g transform="rotate(${heading} 20 20)">
              <circle cx="20" cy="20" r="18" fill="#2563eb" stroke="white" stroke-width="3"/>
              <path d="M12 20 L20 14 L28 20 L20 26 Z" fill="white"/>
            </g>
          </svg>
        `),
        scaledSize: new google.maps.Size(40, 40),
        anchor: new google.maps.Point(20, 20)
      }
    });

    driverMarkerRef.current = driverMarker;

    // Center map on driver location
    mapInstanceRef.current.panTo(location);
  };

  const showRoute = (start: { lat: number; lng: number }, end: { lat: number; lng: number }) => {
    if (!mapInstanceRef.current || !routeRendererRef.current) return;

    const directionsService = new google.maps.DirectionsService();

    directionsService.route({
      origin: start,
      destination: end,
      travelMode: google.maps.TravelMode.DRIVING,
      avoidTolls: false,
      avoidHighways: false
    }, (result, status) => {
      if (status === google.maps.DirectionsStatus.OK && result) {
        routeRendererRef.current?.setDirections(result);
      }
    });
  };

  const handleEmergency = () => {
    if (socketRef.current && driverLocation) {
      socketRef.current.emit('trigger:emergency', {
        rideId,
        location: { lat: driverLocation.lat, lng: driverLocation.lng },
        message: 'Emergency triggered by user'
      });
    }
    onEmergency?.();
  };

  if (loadError) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <p className="text-red-700">Error loading map. Please refresh the page.</p>
      </div>
    );
  }

  if (!isLoaded) {
    return (
      <div className="bg-gray-100 rounded-lg p-8 flex items-center justify-center" style={{ height }}>
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
          <p className="text-gray-600">Loading live tracking...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-lg overflow-hidden">
      {/* Status Bar */}
      <div className={`px-4 py-3 text-white text-sm font-medium ${
        trackingStatus === 'active' ? 'bg-green-600' : 
        trackingStatus === 'connecting' ? 'bg-yellow-600' : 'bg-gray-600'
      }`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className={`w-2 h-2 rounded-full ${
              trackingStatus === 'active' ? 'bg-white animate-pulse' : 'bg-white/50'
            }`}></div>
            <span>
              {trackingStatus === 'active' ? 'Live Tracking Active' : 
               trackingStatus === 'connecting' ? 'Connecting...' : 'Tracking Inactive'}
            </span>
          </div>
          
          {eta && (
            <div className="text-right">
              <div className="text-xs opacity-80">ETA</div>
              <div className="font-bold">{eta.etaMinutes} min</div>
            </div>
          )}
        </div>
      </div>

      {/* Map Container */}
      <div 
        ref={mapRef}
        style={{ height }}
        className="w-full"
      />

      {/* Driver Info Panel */}
      {driverLocation && (
        <div className="border-t border-gray-200 p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="bg-blue-100 p-2 rounded-full">
                <Car className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="font-semibold text-gray-900">Driver Location</p>
                <p className="text-sm text-gray-600">
                  Speed: {Math.round(driverLocation.speed || 0)} km/h • 
                  Updated: {driverLocation.timestamp.toLocaleTimeString()}
                </p>
              </div>
            </div>

            <div className="flex space-x-2">
              {onDriverContact && (
                <button
                  onClick={onDriverContact}
                  className="p-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                >
                  <Phone className="h-4 w-4" />
                </button>
              )}
              
              <button
                onClick={handleEmergency}
                className="p-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
              >
                <AlertTriangle className="h-4 w-4" />
              </button>
            </div>
          </div>

          {eta && (
            <div className="mt-3 grid grid-cols-3 gap-4 text-center">
              <div className="bg-gray-50 rounded-lg p-2">
                <div className="text-xs text-gray-500">Distance</div>
                <div className="font-semibold">{eta.distanceKm} km</div>
              </div>
              <div className="bg-gray-50 rounded-lg p-2">
                <div className="text-xs text-gray-500">ETA</div>
                <div className="font-semibold">{eta.etaMinutes} min</div>
              </div>
              <div className="bg-gray-50 rounded-lg p-2">
                <div className="text-xs text-gray-500">Arrival</div>
                <div className="font-semibold text-xs">
                  {new Date(eta.estimatedArrival).toLocaleTimeString()}
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default LiveTrackingMap;
