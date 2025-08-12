import React, { useEffect, useRef, useState, useCallback } from 'react';
import useGoogleMaps from '../hooks/useGoogleMaps';
import { MapPin, Navigation, Route } from 'lucide-react';

interface Location {
  address: string;
  coordinates: [number, number];
}

interface MapComponentProps {
  pickup?: Location;
  destination?: Location;
  onLocationSelect?: (type: 'pickup' | 'destination', location: Location) => void;
  height?: string;
  showRoute?: boolean;
  className?: string;
}

const MapComponent: React.FC<MapComponentProps> = ({
  pickup,
  destination,
  onLocationSelect,
  height = '400px',
  showRoute = true,
  className = ''
}) => {
  const mapRef = useRef<HTMLDivElement>(null);
  const { isLoaded, loadError } = useGoogleMaps({ libraries: ['places'] });
  
  const [map, setMap] = useState<google.maps.Map | null>(null);
  const [directionsService, setDirectionsService] = useState<google.maps.DirectionsService | null>(null);
  const [directionsRenderer, setDirectionsRenderer] = useState<google.maps.DirectionsRenderer | null>(null);
  const [pickupMarker, setPickupMarker] = useState<google.maps.Marker | null>(null);
  const [destinationMarker, setDestinationMarker] = useState<google.maps.Marker | null>(null);
  const [routeInfo, setRouteInfo] = useState<{ distance: string; duration: string } | null>(null);

  // Initialize map when Google Maps is loaded
  const initializeMap = useCallback(() => {
    if (!mapRef.current || !window.google || !isLoaded) return;

    const mapInstance = new google.maps.Map(mapRef.current, {
      center: { lat: 31.1048, lng: 77.1734 }, // Default to Shimla, India
      zoom: 13,
      mapTypeControl: false,
      streetViewControl: false,
      fullscreenControl: false,
      styles: [
        {
          featureType: 'poi.business',
          elementType: 'labels',
          stylers: [{ visibility: 'off' }]
        },
        {
          featureType: 'transit',
          elementType: 'labels',
          stylers: [{ visibility: 'off' }]
        }
      ]
    });

    const directionsServiceInstance = new google.maps.DirectionsService();
    const directionsRendererInstance = new google.maps.DirectionsRenderer({
      draggable: false,
      suppressMarkers: true,
      polylineOptions: {
        strokeColor: '#2563eb',
        strokeWeight: 5,
        strokeOpacity: 0.9
      }
    });

    directionsRendererInstance.setMap(mapInstance);

    setMap(mapInstance);
    setDirectionsService(directionsServiceInstance);
    setDirectionsRenderer(directionsRendererInstance);

    // Add click listener for location selection
    if (onLocationSelect) {
      mapInstance.addListener('click', (event: google.maps.MapMouseEvent) => {
        const lat = event.latLng?.lat();
        const lng = event.latLng?.lng();
        
        if (lat && lng) {
          // Reverse geocoding to get address
          const geocoder = new google.maps.Geocoder();
          geocoder.geocode({ location: { lat, lng } }, (results, status) => {
            if (status === 'OK' && results && results[0]) {
              const location: Location = {
                address: results[0].formatted_address,
                coordinates: [lng, lat]
              };
              
              const type = !pickup ? 'pickup' : 'destination';
              onLocationSelect(type, location);
            }
          });
        }
      });
    }
  }, [isLoaded, onLocationSelect, pickup]);

  useEffect(() => {
    if (isLoaded) {
      initializeMap();
    }
  }, [isLoaded, initializeMap]);

  // Update pickup marker
  useEffect(() => {
    if (!map || !pickup || !isLoaded) return;

    // Remove existing pickup marker
    if (pickupMarker) {
      pickupMarker.setMap(null);
    }

    // Create enhanced pickup marker
    const marker = new google.maps.Marker({
      position: { lat: pickup.coordinates[1], lng: pickup.coordinates[0] },
      map: map,
      title: 'Pickup Location',
      icon: {
        url: 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(`
          <svg width="40" height="40" viewBox="0 0 40 40" xmlns="http://www.w3.org/2000/svg">
            <circle cx="20" cy="20" r="18" fill="#10b981" stroke="white" stroke-width="4" filter="drop-shadow(0 4px 8px rgba(0,0,0,0.3))"/>
            <circle cx="20" cy="20" r="8" fill="white"/>
            <text x="20" y="25" text-anchor="middle" fill="#10b981" font-size="12" font-weight="bold">P</text>
          </svg>
        `),
        scaledSize: new google.maps.Size(40, 40),
        anchor: new google.maps.Point(20, 20)
      },
      animation: google.maps.Animation.DROP
    });

    // Add info window
    const infoWindow = new google.maps.InfoWindow({
      content: `<div class="p-2"><strong>Pickup Location</strong><br/>${pickup.address}</div>`
    });

    marker.addListener('click', () => {
      infoWindow.open(map, marker);
    });

    setPickupMarker(marker);
  }, [map, pickup, isLoaded]);

  // Update destination marker
  useEffect(() => {
    if (!map || !destination || !isLoaded) return;

    // Remove existing destination marker
    if (destinationMarker) {
      destinationMarker.setMap(null);
    }

    // Create enhanced destination marker
    const marker = new google.maps.Marker({
      position: { lat: destination.coordinates[1], lng: destination.coordinates[0] },
      map: map,
      title: 'Destination',
      icon: {
        url: 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(`
          <svg width="40" height="40" viewBox="0 0 40 40" xmlns="http://www.w3.org/2000/svg">
            <circle cx="20" cy="20" r="18" fill="#ef4444" stroke="white" stroke-width="4" filter="drop-shadow(0 4px 8px rgba(0,0,0,0.3))"/>
            <circle cx="20" cy="20" r="8" fill="white"/>
            <text x="20" y="25" text-anchor="middle" fill="#ef4444" font-size="12" font-weight="bold">D</text>
          </svg>
        `),
        scaledSize: new google.maps.Size(40, 40),
        anchor: new google.maps.Point(20, 20)
      },
      animation: google.maps.Animation.DROP
    });

    // Add info window
    const infoWindow = new google.maps.InfoWindow({
      content: `<div class="p-2"><strong>Destination</strong><br/>${destination.address}</div>`
    });

    marker.addListener('click', () => {
      infoWindow.open(map, marker);
    });

    setDestinationMarker(marker);
  }, [map, destination, isLoaded]);

  // Update route with enhanced information
  useEffect(() => {
    if (!map || !directionsService || !directionsRenderer || !pickup || !destination || !showRoute || !isLoaded) return;

    directionsService.route(
      {
        origin: { lat: pickup.coordinates[1], lng: pickup.coordinates[0] },
        destination: { lat: destination.coordinates[1], lng: destination.coordinates[0] },
        travelMode: google.maps.TravelMode.DRIVING,
        avoidHighways: false,
        avoidTolls: false
      },
      (result, status) => {
        if (status === 'OK' && result) {
          directionsRenderer.setDirections(result);
          
          // Extract route information
          const route = result.routes[0];
          if (route && route.legs[0]) {
            const leg = route.legs[0];
            setRouteInfo({
              distance: leg.distance?.text || 'Unknown',
              duration: leg.duration?.text || 'Unknown'
            });
          }
          
          // Fit map to show entire route with padding
          const bounds = new google.maps.LatLngBounds();
          bounds.extend({ lat: pickup.coordinates[1], lng: pickup.coordinates[0] });
          bounds.extend({ lat: destination.coordinates[1], lng: destination.coordinates[0] });
          map.fitBounds(bounds, { padding: 50 });
        } else {
          console.warn('Directions request failed:', status);
          setRouteInfo(null);
        }
      }
    );
  }, [map, directionsService, directionsRenderer, pickup, destination, showRoute, isLoaded]);

  // Loading state
  if (!isLoaded && !loadError) {
    return (
      <div className={`relative ${className}`} style={{ height }}>
        <div className="absolute inset-0 bg-gradient-to-br from-blue-50 to-indigo-100 rounded-xl flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <h3 className="text-lg font-semibold text-slate-900 mb-2">Loading Map</h3>
            <p className="text-slate-600 text-sm">Initializing Google Maps...</p>
          </div>
        </div>
      </div>
    );
  }

  // Error state or fallback
  if (loadError || !isLoaded) {
    return (
      <div className={`relative ${className}`} style={{ height }}>
        <div className="absolute inset-0 bg-gradient-to-br from-slate-100 to-blue-100 rounded-xl flex items-center justify-center">
          <div className="text-center">
            <div className="w-16 h-16 bg-blue-600 rounded-full flex items-center justify-center mx-auto mb-4">
              <MapPin className="w-8 h-8 text-white" />
            </div>
            <h3 className="text-lg font-semibold text-slate-900 mb-2">Interactive Map</h3>
            <p className="text-slate-600 text-sm mb-2">Google Maps integration</p>
            <p className="text-slate-500 text-xs">
              {loadError ? 'API key required for full functionality' : 'Loading...'}
            </p>
            {onLocationSelect && (
              <button 
                onClick={() => {
                  const demoLocation: Location = {
                    address: 'Demo Location, Shimla',
                    coordinates: [77.1734, 31.1048]
                  };
                  onLocationSelect('pickup', demoLocation);
                }}
                className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700 transition-colors"
              >
                Use Demo Location
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`relative ${className}`}>
      <div 
        ref={mapRef} 
        style={{ height, width: '100%' }}
        className="rounded-xl overflow-hidden shadow-lg"
      />
      
      {/* Route Info Overlay */}
      {routeInfo && (
        <div className="absolute top-4 left-4 bg-white/95 backdrop-blur-sm rounded-lg shadow-lg p-3 border border-gray-200">
          <div className="flex items-center gap-3 text-sm">
            <div className="flex items-center gap-1">
              <Route className="h-4 w-4 text-blue-600" />
              <span className="font-semibold text-slate-700">{routeInfo.distance}</span>
            </div>
            <div className="flex items-center gap-1">
              <Navigation className="h-4 w-4 text-green-600" />
              <span className="font-semibold text-slate-700">{routeInfo.duration}</span>
            </div>
          </div>
        </div>
      )}
      
      {/* Click to select instruction */}
      {onLocationSelect && (
        <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 bg-white/95 backdrop-blur-sm rounded-lg shadow-lg px-4 py-2 border border-gray-200">
          <p className="text-xs text-slate-600 text-center">
            📍 Click on map to select {!pickup ? 'pickup' : 'destination'} location
          </p>
        </div>
      )}
    </div>
  );
};

export default MapComponent;
