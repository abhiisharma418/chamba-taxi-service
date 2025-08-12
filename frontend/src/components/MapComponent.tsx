import React, { useEffect, useRef, useState } from 'react';
import { MapPin, Navigation, Zap, AlertCircle } from 'lucide-react';

interface Location {
  address: string;
  coordinates: [number, number];
}

interface MapComponentProps {
  pickup?: Location;
  destination?: Location;
  height?: string;
  showRoute?: boolean;
  driverLocation?: [number, number];
  className?: string;
}

const MapComponent: React.FC<MapComponentProps> = ({
  pickup,
  destination,
  height = '400px',
  showRoute = false,
  driverLocation,
  className = ''
}) => {
  const mapRef = useRef<HTMLDivElement>(null);
  const [mapError, setMapError] = useState(false);
  const [mapLoaded, setMapLoaded] = useState(false);

  // Mock route coordinates for demonstration
  const generateMockRoute = (start: [number, number], end: [number, number]) => {
    const steps = 10;
    const route = [];
    
    for (let i = 0; i <= steps; i++) {
      const ratio = i / steps;
      const lat = start[1] + (end[1] - start[1]) * ratio;
      const lng = start[0] + (end[0] - start[0]) * ratio;
      
      // Add some curve to make it look more realistic
      const offset = Math.sin(ratio * Math.PI) * 0.01;
      route.push([lng + offset, lat + offset * 0.5]);
    }
    
    return route;
  };

  const calculateBounds = () => {
    const points = [];
    if (pickup) points.push(pickup.coordinates);
    if (destination) points.push(destination.coordinates);
    if (driverLocation) points.push(driverLocation);
    
    if (points.length === 0) return null;
    
    const lngs = points.map(p => p[0]);
    const lats = points.map(p => p[1]);
    
    return {
      minLng: Math.min(...lngs),
      maxLng: Math.max(...lngs),
      minLat: Math.min(...lats),
      maxLat: Math.max(...lats)
    };
  };

  const getMapCenter = () => {
    if (pickup && destination) {
      return [
        (pickup.coordinates[0] + destination.coordinates[0]) / 2,
        (pickup.coordinates[1] + destination.coordinates[1]) / 2
      ];
    }
    if (pickup) return pickup.coordinates;
    if (destination) return destination.coordinates;
    return [77.1734, 31.1048]; // Default to Shimla
  };

  useEffect(() => {
    // Simulate map loading
    const timer = setTimeout(() => {
      setMapLoaded(true);
    }, 1000);

    return () => clearTimeout(timer);
  }, []);

  const mockRoute = pickup && destination && showRoute 
    ? generateMockRoute(pickup.coordinates, destination.coordinates)
    : [];

  if (mapError) {
    return (
      <div 
        className={`bg-slate-100 rounded-lg flex items-center justify-center ${className}`}
        style={{ height }}
      >
        <div className="text-center p-8">
          <AlertCircle className="h-12 w-12 text-slate-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-slate-900 mb-2">Map Unavailable</h3>
          <p className="text-slate-500">Unable to load map. Please check your connection.</p>
        </div>
      </div>
    );
  }

  return (
    <div 
      ref={mapRef}
      className={`relative bg-gradient-to-br from-blue-50 to-green-50 rounded-lg overflow-hidden ${className}`}
      style={{ height }}
    >
      {/* Loading State */}
      {!mapLoaded && (
        <div className="absolute inset-0 flex items-center justify-center bg-slate-100">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-4"></div>
            <p className="text-slate-500">Loading map...</p>
          </div>
        </div>
      )}

      {/* Mock Map Interface */}
      <div className="relative w-full h-full">
        {/* Map Grid Background */}
        <div className="absolute inset-0 opacity-20">
          <svg width="100%" height="100%" className="text-slate-300">
            <defs>
              <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
                <path d="M 40 0 L 0 0 0 40" fill="none" stroke="currentColor" strokeWidth="1"/>
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#grid)" />
          </svg>
        </div>

        {/* Mock roads */}
        <svg className="absolute inset-0 w-full h-full">
          <defs>
            <linearGradient id="roadGradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#e2e8f0" />
              <stop offset="100%" stopColor="#cbd5e1" />
            </linearGradient>
          </defs>
          
          {/* Main roads */}
          <path 
            d="M 0 50% L 100% 50%" 
            stroke="url(#roadGradient)" 
            strokeWidth="8" 
            fill="none"
          />
          <path 
            d="M 50% 0 L 50% 100%" 
            stroke="url(#roadGradient)" 
            strokeWidth="6" 
            fill="none"
          />
          
          {/* Route line */}
          {showRoute && mockRoute.length > 0 && (
            <path
              d={`M ${mockRoute.map((point, index) => {
                const x = ((point[0] - 76.5) * 10 + 1) * 40; // Convert to pixel coordinates
                const y = ((32 - point[1]) * 10 + 1) * 40;
                return `${x} ${y}`;
              }).join(' L ')}`}
              stroke="#3b82f6"
              strokeWidth="4"
              fill="none"
              strokeDasharray="0"
              className="animate-pulse"
            />
          )}
        </svg>

        {/* Location Markers */}
        {pickup && (
          <div 
            className="absolute transform -translate-x-1/2 -translate-y-full"
            style={{
              left: `${((pickup.coordinates[0] - 76.5) * 10 + 1) * 4}%`,
              top: `${((32 - pickup.coordinates[1]) * 10 + 1) * 4}%`
            }}
          >
            <div className="bg-green-500 text-white p-2 rounded-full shadow-lg">
              <MapPin className="h-4 w-4" />
            </div>
            <div className="bg-white rounded-lg shadow-lg p-2 mt-2 min-w-max border">
              <p className="text-xs font-medium text-slate-900">Pickup</p>
              <p className="text-xs text-slate-600">{pickup.address}</p>
            </div>
          </div>
        )}

        {destination && (
          <div 
            className="absolute transform -translate-x-1/2 -translate-y-full"
            style={{
              left: `${((destination.coordinates[0] - 76.5) * 10 + 1) * 4}%`,
              top: `${((32 - destination.coordinates[1]) * 10 + 1) * 4}%`
            }}
          >
            <div className="bg-red-500 text-white p-2 rounded-full shadow-lg">
              <MapPin className="h-4 w-4" />
            </div>
            <div className="bg-white rounded-lg shadow-lg p-2 mt-2 min-w-max border">
              <p className="text-xs font-medium text-slate-900">Destination</p>
              <p className="text-xs text-slate-600">{destination.address}</p>
            </div>
          </div>
        )}

        {driverLocation && (
          <div 
            className="absolute transform -translate-x-1/2 -translate-y-1/2"
            style={{
              left: `${((driverLocation[0] - 76.5) * 10 + 1) * 4}%`,
              top: `${((32 - driverLocation[1]) * 10 + 1) * 4}%`
            }}
          >
            <div className="bg-blue-500 text-white p-2 rounded-full shadow-lg animate-pulse">
              <Navigation className="h-4 w-4" />
            </div>
            <div className="bg-white rounded-lg shadow-lg p-2 mt-2 min-w-max border">
              <p className="text-xs font-medium text-slate-900">Driver</p>
              <p className="text-xs text-slate-600">On the way</p>
            </div>
          </div>
        )}

        {/* Map Controls */}
        <div className="absolute top-4 right-4 space-y-2">
          <button className="bg-white p-2 rounded-lg shadow-md hover:shadow-lg transition-shadow">
            <Zap className="h-4 w-4 text-slate-600" />
          </button>
          <button className="bg-white p-2 rounded-lg shadow-md hover:shadow-lg transition-shadow">
            <Navigation className="h-4 w-4 text-slate-600" />
          </button>
        </div>

        {/* Distance and Time Info */}
        {showRoute && pickup && destination && (
          <div className="absolute bottom-4 left-4 bg-white rounded-lg shadow-lg p-3 border">
            <div className="flex items-center space-x-4">
              <div className="text-center">
                <p className="text-xs text-slate-500">Distance</p>
                <p className="text-sm font-semibold text-slate-900">5.2 km</p>
              </div>
              <div className="text-center">
                <p className="text-xs text-slate-500">Time</p>
                <p className="text-sm font-semibold text-slate-900">12 min</p>
              </div>
            </div>
          </div>
        )}

        {/* No locations message */}
        {!pickup && !destination && (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="bg-white rounded-lg shadow-lg p-6 text-center">
              <MapPin className="h-12 w-12 text-slate-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-slate-900 mb-2">Set Your Route</h3>
              <p className="text-slate-500">Choose pickup and destination to see route</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default MapComponent;
