import React, { useEffect, useRef, useState, useCallback } from 'react';
import { MapPin, Navigation, Clock, Phone, MessageCircle, AlertTriangle, Zap, Car } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { TrackingAPI } from '../lib/api';
import { io, Socket } from 'socket.io-client';

interface Location {
  lat: number;
  lng: number;
  address?: string;
  timestamp?: Date;
}

interface Driver {
  id: string;
  name: string;
  phone: string;
  rating: number;
  vehicleModel: string;
  vehicleNumber: string;
  photo?: string;
}

interface LiveTrackingMapProps {
  rideId: string;
  pickup: Location;
  destination: Location;
  driver?: Driver;
  onStatusUpdate?: (status: string) => void;
  className?: string;
}

const LiveTrackingMap: React.FC<LiveTrackingMapProps> = ({
  rideId,
  pickup,
  destination,
  driver,
  onStatusUpdate,
  className = ''
}) => {
  const { user } = useAuth();
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const driverMarkerRef = useRef<any>(null);
  const routeRendererRef = useRef<any>(null);
  const socketRef = useRef<Socket | null>(null);

  const [driverLocation, setDriverLocation] = useState<Location | null>(null);
  const [isMapLoaded, setIsMapLoaded] = useState(false);
  const [eta, setEta] = useState<number | null>(null);
  const [distance, setDistance] = useState<number | null>(null);
  const [rideStatus, setRideStatus] = useState('on_trip');
  const [speed, setSpeed] = useState<number>(0);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);
  const [connectionStatus, setConnectionStatus] = useState<'connecting' | 'connected' | 'disconnected'>('connecting');

  // Initialize WebSocket connection for real-time updates
  useEffect(() => {
    const API_URL = (import.meta as any).env?.VITE_API_URL || 'https://chamba-taxi-service-2.onrender.com';
    
    socketRef.current = io(API_URL, {
      auth: {
        userId: user?.id,
        rideId: rideId,
        userType: user?.role
      }
    });

    const socket = socketRef.current;

    socket.on('connect', () => {
      console.log('Connected to tracking socket');
      setConnectionStatus('connected');
      
      // Join ride tracking room
      socket.emit('join_ride_tracking', { rideId });
    });

    socket.on('disconnect', () => {
      console.log('Disconnected from tracking socket');
      setConnectionStatus('disconnected');
    });

    socket.on('driver_location_update', (data: any) => {
      console.log('Driver location update:', data);
      setDriverLocation({
        lat: data.lat,
        lng: data.lng,
        timestamp: new Date(data.timestamp)
      });
      setSpeed(data.speed || 0);
      setLastUpdate(new Date());
      
      // Update driver marker on map
      updateDriverMarker(data.lat, data.lng, data.heading || 0);
      
      // Calculate new ETA and distance
      calculateRouteInfo(data.lat, data.lng);
    });

    socket.on('ride_status_update', (data: any) => {
      console.log('Ride status update:', data);
      setRideStatus(data.status);
      if (onStatusUpdate) {
        onStatusUpdate(data.status);
      }
    });

    socket.on('eta_update', (data: any) => {
      setEta(data.eta);
      setDistance(data.distance);
    });

    return () => {
      if (socket) {
        socket.emit('leave_ride_tracking', { rideId });
        socket.disconnect();
      }
    };
  }, [rideId, user]);

  // Initialize Google Maps
  useEffect(() => {
    if (!mapRef.current) return;

    const initMap = () => {
      if (!window.google) {
        console.error('Google Maps not loaded');
        return;
      }

      const map = new window.google.maps.Map(mapRef.current, {
        zoom: 15,
        center: pickup,
        styles: [
          {
            featureType: 'poi',
            elementType: 'labels',
            stylers: [{ visibility: 'off' }]
          }
        ],
        disableDefaultUI: false,
        zoomControl: true,
        mapTypeControl: false,
        streetViewControl: false,
        fullscreenControl: true
      });

      mapInstanceRef.current = map;

      // Add pickup marker
      new window.google.maps.Marker({
        position: pickup,
        map: map,
        title: 'Pickup Location',
        icon: {
          path: window.google.maps.SymbolPath.CIRCLE,
          fillColor: '#10B981',
          fillOpacity: 1,
          strokeWeight: 2,
          strokeColor: '#FFFFFF',
          scale: 8
        }
      });

      // Add destination marker
      new window.google.maps.Marker({
        position: destination,
        map: map,
        title: 'Destination',
        icon: {
          path: window.google.maps.SymbolPath.CIRCLE,
          fillColor: '#EF4444',
          fillOpacity: 1,
          strokeWeight: 2,
          strokeColor: '#FFFFFF',
          scale: 8
        }
      });

      // Initialize route renderer
      routeRendererRef.current = new window.google.maps.DirectionsRenderer({
        suppressMarkers: false,
        polylineOptions: {
          strokeColor: '#3B82F6',
          strokeWeight: 4,
          strokeOpacity: 0.8
        }
      });
      routeRendererRef.current.setMap(map);

      setIsMapLoaded(true);

      // Initial route calculation if driver location is available
      if (driverLocation) {
        calculateRouteInfo(driverLocation.lat, driverLocation.lng);
      }
    };

    if (window.google) {
      initMap();
    } else {
      window.initMap = initMap;
    }
  }, [pickup, destination, driverLocation]);

  const updateDriverMarker = useCallback((lat: number, lng: number, heading: number = 0) => {
    if (!mapInstanceRef.current || !window.google) return;

    const position = { lat, lng };

    if (driverMarkerRef.current) {
      driverMarkerRef.current.setPosition(position);
      
      // Update heading if available
      if (heading > 0) {
        driverMarkerRef.current.setIcon({
          path: window.google.maps.SymbolPath.FORWARD_CLOSED_ARROW,
          fillColor: '#3B82F6',
          fillOpacity: 1,
          strokeWeight: 2,
          strokeColor: '#FFFFFF',
          scale: 6,
          rotation: heading
        });
      }
    } else {
      driverMarkerRef.current = new window.google.maps.Marker({
        position: position,
        map: mapInstanceRef.current,
        title: `Driver: ${driver?.name || 'Unknown'}`,
        icon: {
          path: window.google.maps.SymbolPath.FORWARD_CLOSED_ARROW,
          fillColor: '#3B82F6',
          fillOpacity: 1,
          strokeWeight: 2,
          strokeColor: '#FFFFFF',
          scale: 6,
          rotation: heading
        }
      });

      // Add info window
      const infoWindow = new window.google.maps.InfoWindow({
        content: `
          <div style="padding: 8px;">
            <strong>${driver?.name || 'Driver'}</strong><br/>
            ${driver?.vehicleModel || ''} (${driver?.vehicleNumber || ''})<br/>
            Speed: ${speed.toFixed(1)} km/h
          </div>
        `
      });

      driverMarkerRef.current.addListener('click', () => {
        infoWindow.open(mapInstanceRef.current, driverMarkerRef.current);
      });
    }

    // Center map on driver with some padding
    const bounds = new window.google.maps.LatLngBounds();
    bounds.extend(position);
    bounds.extend(destination);
    mapInstanceRef.current.fitBounds(bounds, { padding: 50 });
  }, [driver, speed, destination]);

  const calculateRouteInfo = useCallback(async (driverLat: number, driverLng: number) => {
    if (!window.google || !routeRendererRef.current) return;

    const directionsService = new window.google.maps.DirectionsService();
    
    try {
      const result = await new Promise((resolve, reject) => {
        directionsService.route({
          origin: { lat: driverLat, lng: driverLng },
          destination: destination,
          travelMode: window.google.maps.TravelMode.DRIVING,
          avoidHighways: false,
          avoidTolls: false
        }, (result: any, status: string) => {
          if (status === 'OK') {
            resolve(result);
          } else {
            reject(new Error(`Directions request failed: ${status}`));
          }
        });
      });

      routeRendererRef.current.setDirections(result);

      // Extract ETA and distance
      const route = (result as any).routes[0];
      const leg = route.legs[0];
      
      setEta(Math.round(leg.duration.value / 60)); // Convert to minutes
      setDistance(parseFloat((leg.distance.value / 1000).toFixed(1))); // Convert to km

    } catch (error) {
      console.error('Route calculation error:', error);
    }
  }, [destination]);

  const handleEmergency = async () => {
    try {
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(async (position) => {
          await TrackingAPI.triggerEmergency({
            rideId,
            location: {
              lat: position.coords.latitude,
              lng: position.coords.longitude
            },
            message: 'Emergency triggered by user'
          });
          
          alert('Emergency alert sent to authorities and ride support team');
        });
      }
    } catch (error) {
      console.error('Emergency trigger failed:', error);
      alert('Failed to trigger emergency alert');
    }
  };

  const shareLocation = async () => {
    try {
      await TrackingAPI.shareLiveLocation({
        rideId,
        customerId: user?.id || ''
      });
      
      alert('Live location shared successfully');
    } catch (error) {
      console.error('Location sharing failed:', error);
      alert('Failed to share location');
    }
  };

  const formatLastUpdate = (date: Date | null) => {
    if (!date) return 'Never';
    
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const seconds = Math.floor(diff / 1000);
    
    if (seconds < 10) return 'Just now';
    if (seconds < 60) return `${seconds}s ago`;
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
    
    return date.toLocaleTimeString();
  };

  return (
    <div className={`relative ${className}`}>
      {/* Connection Status */}
      <div className="absolute top-4 left-4 z-10">
        <div className={`px-3 py-1 rounded-full text-xs font-medium ${
          connectionStatus === 'connected' 
            ? 'bg-green-100 text-green-800' 
            : connectionStatus === 'connecting'
            ? 'bg-yellow-100 text-yellow-800'
            : 'bg-red-100 text-red-800'
        }`}>
          <div className="flex items-center space-x-1">
            <div className={`w-2 h-2 rounded-full ${
              connectionStatus === 'connected' ? 'bg-green-500' : 
              connectionStatus === 'connecting' ? 'bg-yellow-500' : 'bg-red-500'
            }`}></div>
            <span>
              {connectionStatus === 'connected' ? 'Live' : 
               connectionStatus === 'connecting' ? 'Connecting' : 'Disconnected'}
            </span>
          </div>
        </div>
      </div>

      {/* Map Container */}
      <div ref={mapRef} className="w-full h-full min-h-[400px] rounded-lg"></div>

      {/* Tracking Info Overlay */}
      <div className="absolute bottom-4 left-4 right-4 bg-white rounded-lg shadow-lg p-4 z-10">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
          {eta && (
            <div className="text-center">
              <Clock className="h-5 w-5 mx-auto mb-1 text-blue-600" />
              <div className="text-sm font-medium text-slate-900">{eta} min</div>
              <div className="text-xs text-slate-500">ETA</div>
            </div>
          )}
          
          {distance && (
            <div className="text-center">
              <Navigation className="h-5 w-5 mx-auto mb-1 text-green-600" />
              <div className="text-sm font-medium text-slate-900">{distance} km</div>
              <div className="text-xs text-slate-500">Distance</div>
            </div>
          )}
          
          <div className="text-center">
            <Zap className="h-5 w-5 mx-auto mb-1 text-orange-600" />
            <div className="text-sm font-medium text-slate-900">{speed.toFixed(1)} km/h</div>
            <div className="text-xs text-slate-500">Speed</div>
          </div>
          
          <div className="text-center">
            <Car className="h-5 w-5 mx-auto mb-1 text-purple-600" />
            <div className="text-sm font-medium text-slate-900 capitalize">{rideStatus.replace('_', ' ')}</div>
            <div className="text-xs text-slate-500">Status</div>
          </div>
        </div>

        {/* Driver Info */}
        {driver && (
          <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg mb-3">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center">
                <span className="text-white font-medium text-sm">
                  {driver.name.charAt(0).toUpperCase()}
                </span>
              </div>
              <div>
                <div className="font-medium text-slate-900">{driver.name}</div>
                <div className="text-sm text-slate-600">{driver.vehicleModel} • {driver.vehicleNumber}</div>
                <div className="text-xs text-slate-500">
                  Last update: {formatLastUpdate(lastUpdate)}
                </div>
              </div>
            </div>
            
            <div className="flex space-x-2">
              <button
                onClick={() => window.open(`tel:${driver.phone}`)}
                className="p-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
              >
                <Phone className="h-4 w-4" />
              </button>
              <button
                onClick={() => window.open(`https://wa.me/${driver.phone.replace(/\D/g, '')}`)}
                className="p-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors"
              >
                <MessageCircle className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex space-x-2">
          <button
            onClick={shareLocation}
            className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
          >
            Share Location
          </button>
          <button
            onClick={handleEmergency}
            className="px-4 py-2 bg-red-600 text-white rounded-lg text-sm font-medium hover:bg-red-700 transition-colors flex items-center space-x-1"
          >
            <AlertTriangle className="h-4 w-4" />
            <span>SOS</span>
          </button>
        </div>
      </div>

      {/* No GPS Signal Warning */}
      {lastUpdate && new Date().getTime() - lastUpdate.getTime() > 60000 && (
        <div className="absolute top-4 right-4 bg-amber-100 border border-amber-300 rounded-lg p-3 z-10">
          <div className="flex items-center space-x-2">
            <AlertTriangle className="h-5 w-5 text-amber-600" />
            <span className="text-amber-800 text-sm font-medium">GPS signal weak</span>
          </div>
        </div>
      )}
    </div>
  );
};

export default LiveTrackingMap;
