import React, { useEffect, useRef, useState } from 'react';
import { MapPin, Navigation, Loader } from 'lucide-react';

interface Location {
  coordinates: [number, number]; // [lng, lat]
  address: string;
}

interface FreeMapComponentProps {
  pickup?: Location;
  destination?: Location;
  driverLocation?: [number, number];
  onMapReady?: () => void;
  onPickupChange?: (location: Location) => void;
  onDestinationChange?: (location: Location) => void;
  showSearch?: boolean;
  interactive?: boolean;
  className?: string;
}

// OpenStreetMap with Leaflet alternative to Google Maps
const FreeMapComponent: React.FC<FreeMapComponentProps> = ({
  pickup,
  destination,
  driverLocation,
  onMapReady,
  onPickupChange,
  onDestinationChange,
  showSearch = false,
  interactive = true,
  className = ''
}) => {
  const mapRef = useRef<HTMLDivElement>(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [map, setMap] = useState<any>(null);
  const [pickupSearch, setPickupSearch] = useState('');
  const [destinationSearch, setDestinationSearch] = useState('');
  const [searchResults, setSearchResults] = useState<Location[]>([]);
  const [activeSearch, setActiveSearch] = useState<'pickup' | 'destination' | null>(null);
  const [pickupMarker, setPickupMarker] = useState<any>(null);
  const [destinationMarker, setDestinationMarker] = useState<any>(null);

  // Load Leaflet CSS and JS
  useEffect(() => {
    // Add Leaflet CSS
    if (!document.querySelector('link[href*="leaflet"]')) {
      const leafletCSS = document.createElement('link');
      leafletCSS.rel = 'stylesheet';
      leafletCSS.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
      document.head.appendChild(leafletCSS);
    }

    // Load Leaflet JS
    if (!window.L) {
      const script = document.createElement('script');
      script.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
      script.onload = () => {
        setIsLoaded(true);
        onMapReady?.();
      };
      script.onerror = () => {
        setError('Failed to load map library');
      };
      document.head.appendChild(script);
    } else {
      setIsLoaded(true);
      onMapReady?.();
    }
  }, [onMapReady]);

  // Initialize map
  useEffect(() => {
    if (!isLoaded || !mapRef.current || map) return;

    try {
      // Default center (Delhi, India)
      const defaultCenter: [number, number] = [28.6139, 77.2090];
      
      // Initialize Leaflet map
      const leafletMap = window.L.map(mapRef.current).setView(defaultCenter, 11);

      // Add OpenStreetMap tiles (free)
      window.L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap contributors',
        maxZoom: 19
      }).addTo(leafletMap);

      // Add click event listener for interactive mode
      if (interactive) {
        leafletMap.on('click', handleMapClick);
      }

      setMap(leafletMap);

      // Expose map methods to parent
      if (onMapReady) {
        const mapInstance = {
          updatePickupLocation: (location: Location) => {
            if (pickupMarker) {
              leafletMap.removeLayer(pickupMarker);
            }

            const marker = window.L.marker(location.coordinates)
              .addTo(leafletMap)
              .bindPopup(`📍 Pickup: ${location.address}`)
              .openPopup();

            setPickupMarker(marker);
            leafletMap.setView(location.coordinates, 14);
          },

          updateDestinationLocation: (location: Location) => {
            if (destinationMarker) {
              leafletMap.removeLayer(destinationMarker);
            }

            const marker = window.L.marker(location.coordinates)
              .addTo(leafletMap)
              .bindPopup(`🎯 Destination: ${location.address}`)
              .openPopup();

            setDestinationMarker(marker);

            // If both pickup and destination exist, fit bounds
            if (pickupMarker) {
              const group = window.L.featureGroup([pickupMarker, marker]);
              leafletMap.fitBounds(group.getBounds().pad(0.1));
            } else {
              leafletMap.setView(location.coordinates, 14);
            }
          }
        };

        onMapReady(mapInstance);
      }
    } catch (err) {
      console.error('Error initializing map:', err);
      setError('Error loading map');
    }
  }, [isLoaded, map, pickupMarker, destinationMarker]);

  // Search location function using Nominatim (OpenStreetMap's geocoding service)
  const searchLocation = async (query: string) => {
    if (!query || query.length < 3) {
      setSearchResults([]);
      return;
    }

    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=5&addressdetails=1`
      );
      const data = await response.json();

      const results: Location[] = data.map((item: any) => ({
        coordinates: [parseFloat(item.lon), parseFloat(item.lat)],
        address: item.display_name
      }));

      setSearchResults(results);
    } catch (error) {
      console.error('Search error:', error);
      setSearchResults([]);
    }
  };

  // Handle search input changes
  const handleSearchChange = (value: string, type: 'pickup' | 'destination') => {
    if (type === 'pickup') {
      setPickupSearch(value);
    } else {
      setDestinationSearch(value);
    }
    setActiveSearch(type);
    searchLocation(value);
  };

  // Handle location selection from search results
  const handleLocationSelect = (location: Location, type: 'pickup' | 'destination') => {
    if (type === 'pickup') {
      setPickupSearch(location.address);
      onPickupChange?.(location);
    } else {
      setDestinationSearch(location.address);
      onDestinationChange?.(location);
    }
    setSearchResults([]);
    setActiveSearch(null);
  };

  // Handle map click to set location
  const handleMapClick = (e: any) => {
    if (!interactive || !map) return;

    const { lat, lng } = e.latlng;
    const location: Location = {
      coordinates: [lng, lat],
      address: `${lat.toFixed(6)}, ${lng.toFixed(6)}`
    };

    if (activeSearch === 'pickup') {
      onPickupChange?.(location);
      setPickupSearch(location.address);
    } else if (activeSearch === 'destination') {
      onDestinationChange?.(location);
      setDestinationSearch(location.address);
    }
  };

  // Add markers and route
  useEffect(() => {
    if (!map || !window.L) return;

    // Clear existing layers
    map.eachLayer((layer: any) => {
      if (layer instanceof window.L.Marker || layer instanceof window.L.Polyline) {
        map.removeLayer(layer);
      }
    });

    const bounds = window.L.latLngBounds([]);

    // Add pickup marker
    if (pickup) {
      const pickupIcon = window.L.divIcon({
        html: `<div style="background: #10B981; color: white; border-radius: 50%; width: 20px; height: 20px; display: flex; align-items: center; justify-content: center; font-size: 12px; font-weight: bold;">P</div>`,
        iconSize: [20, 20],
        className: 'custom-icon'
      });

      const pickupMarker = window.L.marker([pickup.coordinates[1], pickup.coordinates[0]], {
        icon: pickupIcon
      }).addTo(map);

      pickupMarker.bindPopup(`<strong>Pickup</strong><br/>${pickup.address}`);
      bounds.extend([pickup.coordinates[1], pickup.coordinates[0]]);
    }

    // Add destination marker
    if (destination) {
      const destIcon = window.L.divIcon({
        html: `<div style="background: #EF4444; color: white; border-radius: 50%; width: 20px; height: 20px; display: flex; align-items: center; justify-content: center; font-size: 12px; font-weight: bold;">D</div>`,
        iconSize: [20, 20],
        className: 'custom-icon'
      });

      const destMarker = window.L.marker([destination.coordinates[1], destination.coordinates[0]], {
        icon: destIcon
      }).addTo(map);

      destMarker.bindPopup(`<strong>Destination</strong><br/>${destination.address}`);
      bounds.extend([destination.coordinates[1], destination.coordinates[0]]);
    }

    // Add driver marker
    if (driverLocation) {
      const driverIcon = window.L.divIcon({
        html: `<div style="background: #3B82F6; color: white; border-radius: 50%; width: 25px; height: 25px; display: flex; align-items: center; justify-content: center; font-size: 14px; font-weight: bold;">🚗</div>`,
        iconSize: [25, 25],
        className: 'custom-icon'
      });

      const driverMarker = window.L.marker([driverLocation[1], driverLocation[0]], {
        icon: driverIcon
      }).addTo(map);

      driverMarker.bindPopup('<strong>Driver Location</strong>');
      bounds.extend([driverLocation[1], driverLocation[0]]);
    }

    // Draw simple route line if both pickup and destination exist
    if (pickup && destination) {
      const routeLine = window.L.polyline([
        [pickup.coordinates[1], pickup.coordinates[0]],
        [destination.coordinates[1], destination.coordinates[0]]
      ], {
        color: '#3B82F6',
        weight: 4,
        opacity: 0.7
      }).addTo(map);

      bounds.extend(routeLine.getBounds());
    }

    // Fit map to show all markers
    if (bounds.isValid()) {
      map.fitBounds(bounds, { padding: [20, 20] });
    }
  }, [map, pickup, destination, driverLocation]);

  if (error) {
    return (
      <div className={`bg-slate-100 rounded-lg p-8 text-center ${className}`}>
        <MapPin className="h-12 w-12 text-slate-400 mx-auto mb-4" />
        <p className="text-slate-500">{error}</p>
        <p className="text-sm text-slate-400 mt-2">Free map service unavailable</p>
      </div>
    );
  }

  if (!isLoaded) {
    return (
      <div className={`bg-slate-50 rounded-lg p-8 text-center ${className}`}>
        <Loader className="h-8 w-8 animate-spin text-blue-500 mx-auto mb-4" />
        <p className="text-slate-500">Loading Free Map...</p>
      </div>
    );
  }

  return (
    <div className={`relative ${className}`}>
      {/* Search Interface */}
      {showSearch && (
        <div className="absolute top-4 left-4 right-4 z-10 space-y-2">
          {/* Pickup Search */}
          <div className="relative">
            <input
              type="text"
              value={pickupSearch}
              onChange={(e) => handleSearchChange(e.target.value, 'pickup')}
              placeholder="Enter pickup location..."
              className="w-full px-4 py-3 bg-white rounded-lg shadow-lg border border-gray-200 focus:ring-2 focus:ring-green-500 focus:border-transparent"
            />
            <MapPin className="absolute right-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-green-500" />
          </div>

          {/* Destination Search */}
          <div className="relative">
            <input
              type="text"
              value={destinationSearch}
              onChange={(e) => handleSearchChange(e.target.value, 'destination')}
              placeholder="Enter destination..."
              className="w-full px-4 py-3 bg-white rounded-lg shadow-lg border border-gray-200 focus:ring-2 focus:ring-red-500 focus:border-transparent"
            />
            <Navigation className="absolute right-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-red-500" />
          </div>

          {/* Search Results */}
          {searchResults.length > 0 && activeSearch && (
            <div className="bg-white rounded-lg shadow-lg border border-gray-200 max-h-48 overflow-y-auto">
              {searchResults.map((result, index) => (
                <button
                  key={index}
                  onClick={() => handleLocationSelect(result, activeSearch)}
                  className="w-full text-left px-4 py-3 hover:bg-gray-50 border-b border-gray-100 last:border-b-0"
                >
                  <div className="flex items-center space-x-2">
                    <MapPin className={`h-4 w-4 ${activeSearch === 'pickup' ? 'text-green-500' : 'text-red-500'}`} />
                    <span className="text-sm text-gray-900 truncate">{result.address}</span>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      <div ref={mapRef} className="w-full h-full rounded-lg" />
      
      {/* Map attribution */}
      <div className="absolute bottom-2 right-2 bg-white bg-opacity-90 px-2 py-1 text-xs text-slate-600 rounded">
        Free OpenStreetMap
      </div>
      
      {/* Legend */}
      <div className="absolute top-2 left-2 bg-white bg-opacity-90 p-2 rounded shadow-sm">
        <div className="flex flex-col space-y-1 text-xs">
          {pickup && (
            <div className="flex items-center space-x-1">
              <div className="w-3 h-3 bg-green-500 rounded-full"></div>
              <span>Pickup</span>
            </div>
          )}
          {destination && (
            <div className="flex items-center space-x-1">
              <div className="w-3 h-3 bg-red-500 rounded-full"></div>
              <span>Drop</span>
            </div>
          )}
          {driverLocation && (
            <div className="flex items-center space-x-1">
              <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
              <span>Driver</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default FreeMapComponent;
