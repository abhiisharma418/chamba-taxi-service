import React, { useEffect, useRef, useState, useCallback } from 'react';
import { MapPin, Navigation, Loader, AlertCircle } from 'lucide-react';

// Declare Google Maps types
declare global {
  interface Window {
    google: any;
    initMap: () => void;
  }
}

interface Location {
  address: string;
  coordinates: [number, number];
}

interface GoogleMapComponentProps {
  pickup?: Location;
  destination?: Location;
  onPickupChange?: (location: Location) => void;
  onDestinationChange?: (location: Location) => void;
  height?: string;
  showRoute?: boolean;
  driverLocation?: [number, number];
  className?: string;
  interactive?: boolean;
}

const GoogleMapComponent: React.FC<GoogleMapComponentProps> = ({
  pickup,
  destination,
  onPickupChange,
  onDestinationChange,
  height = '400px',
  showRoute = false,
  driverLocation,
  className = '',
  interactive = true
}) => {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const pickupMarkerRef = useRef<any>(null);
  const destinationMarkerRef = useRef<any>(null);
  const driverMarkerRef = useRef<any>(null);
  const directionsRendererRef = useRef<any>(null);
  const directionsServiceRef = useRef<any>(null);
  
  const [isLoaded, setIsLoaded] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load Google Maps API
  useEffect(() => {
    if (window.google) {
      setIsLoaded(true);
      return;
    }

    const script = document.createElement('script');
    script.src = `https://maps.googleapis.com/maps/api/js?key=AIzaSyCYour_API_Key_Here&libraries=places&callback=initMap`;
    script.async = true;
    script.defer = true;
    
    window.initMap = () => {
      setIsLoaded(true);
    };
    
    script.onerror = () => {
      setError('Failed to load Google Maps. Using fallback map.');
      setIsLoaded(true);
    };

    document.head.appendChild(script);

    return () => {
      if (document.head.contains(script)) {
        document.head.removeChild(script);
      }
    };
  }, []);

  // Initialize map
  useEffect(() => {
    if (!isLoaded || !mapRef.current) return;

    try {
      // Check if Google Maps loaded successfully
      if (!window.google) {
        setError('Google Maps not available. Using fallback map.');
        return;
      }

      const defaultCenter = { lat: 31.1048, lng: 77.1734 }; // Shimla
      
      const map = new window.google.maps.Map(mapRef.current, {
        zoom: 12,
        center: defaultCenter,
        styles: [
          {
            featureType: 'poi',
            elementType: 'labels',
            stylers: [{ visibility: 'on' }]
          }
        ],
        mapTypeControl: true,
        streetViewControl: false,
        fullscreenControl: true,
        zoomControl: true,
      });

      mapInstanceRef.current = map;

      // Initialize directions service and renderer
      directionsServiceRef.current = new window.google.maps.DirectionsService();
      directionsRendererRef.current = new window.google.maps.DirectionsRenderer({
        suppressMarkers: true,
        polylineOptions: {
          strokeColor: '#3B82F6',
          strokeWeight: 4,
          strokeOpacity: 0.8
        }
      });
      directionsRendererRef.current.setMap(map);

      // Add click listener for location selection
      if (interactive) {
        map.addListener('click', (event: any) => {
          const lat = event.latLng.lat();
          const lng = event.latLng.lng();
          
          // Reverse geocoding to get address
          const geocoder = new window.google.maps.Geocoder();
          geocoder.geocode(
            { location: { lat, lng } },
            (results: any[], status: string) => {
              if (status === 'OK' && results[0]) {
                const address = results[0].formatted_address;
                const location: Location = {
                  address,
                  coordinates: [lng, lat]
                };

                // Determine if this should be pickup or destination
                if (!pickup && onPickupChange) {
                  onPickupChange(location);
                } else if (!destination && onDestinationChange) {
                  onDestinationChange(location);
                } else if (onDestinationChange) {
                  onDestinationChange(location);
                }
              }
            }
          );
        });
      }

    } catch (err) {
      console.error('Error initializing Google Map:', err);
      setError('Error loading map. Using fallback view.');
    }
  }, [isLoaded, interactive, pickup, destination, onPickupChange, onDestinationChange]);

  // Update pickup marker
  useEffect(() => {
    if (!mapInstanceRef.current || !window.google || !pickup) return;

    // Remove existing pickup marker
    if (pickupMarkerRef.current) {
      pickupMarkerRef.current.setMap(null);
    }

    // Create new pickup marker
    pickupMarkerRef.current = new window.google.maps.Marker({
      position: { lat: pickup.coordinates[1], lng: pickup.coordinates[0] },
      map: mapInstanceRef.current,
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

    // Add info window
    const infoWindow = new window.google.maps.InfoWindow({
      content: `<div style="padding: 8px;"><strong>Pickup</strong><br/>${pickup.address}</div>`
    });

    pickupMarkerRef.current.addListener('click', () => {
      infoWindow.open(mapInstanceRef.current, pickupMarkerRef.current);
    });

  }, [pickup]);

  // Update destination marker
  useEffect(() => {
    if (!mapInstanceRef.current || !window.google || !destination) return;

    // Remove existing destination marker
    if (destinationMarkerRef.current) {
      destinationMarkerRef.current.setMap(null);
    }

    // Create new destination marker
    destinationMarkerRef.current = new window.google.maps.Marker({
      position: { lat: destination.coordinates[1], lng: destination.coordinates[0] },
      map: mapInstanceRef.current,
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

    // Add info window
    const infoWindow = new window.google.maps.InfoWindow({
      content: `<div style="padding: 8px;"><strong>Destination</strong><br/>${destination.address}</div>`
    });

    destinationMarkerRef.current.addListener('click', () => {
      infoWindow.open(mapInstanceRef.current, destinationMarkerRef.current);
    });

  }, [destination]);

  // Update driver marker
  useEffect(() => {
    if (!mapInstanceRef.current || !window.google || !driverLocation) return;

    // Remove existing driver marker
    if (driverMarkerRef.current) {
      driverMarkerRef.current.setMap(null);
    }

    // Create new driver marker
    driverMarkerRef.current = new window.google.maps.Marker({
      position: { lat: driverLocation[1], lng: driverLocation[0] },
      map: mapInstanceRef.current,
      title: 'Driver Location',
      icon: {
        path: window.google.maps.SymbolPath.FORWARD_CLOSED_ARROW,
        fillColor: '#3B82F6',
        fillOpacity: 1,
        strokeWeight: 2,
        strokeColor: '#FFFFFF',
        scale: 6
      }
    });

  }, [driverLocation]);

  // Draw route
  useEffect(() => {
    if (!mapInstanceRef.current || !window.google || !directionsServiceRef.current || !directionsRendererRef.current) return;
    if (!showRoute || !pickup || !destination) {
      // Clear existing route
      directionsRendererRef.current.setDirections({ routes: [] });
      return;
    }

    const request = {
      origin: { lat: pickup.coordinates[1], lng: pickup.coordinates[0] },
      destination: { lat: destination.coordinates[1], lng: destination.coordinates[0] },
      travelMode: window.google.maps.TravelMode.DRIVING,
      unitSystem: window.google.maps.UnitSystem.METRIC,
      avoidHighways: false,
      avoidTolls: false
    };

    directionsServiceRef.current.route(request, (result: any, status: string) => {
      if (status === 'OK') {
        directionsRendererRef.current.setDirections(result);
        
        // Fit map to show entire route
        const bounds = new window.google.maps.LatLngBounds();
        bounds.extend(request.origin);
        bounds.extend(request.destination);
        mapInstanceRef.current.fitBounds(bounds);
      } else {
        console.error('Directions request failed:', status);
      }
    });

  }, [showRoute, pickup, destination]);

  // Fallback map when Google Maps fails
  const FallbackMap = () => (
    <div className="relative w-full h-full bg-gradient-to-br from-blue-50 to-green-50 rounded-lg overflow-hidden">
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="text-center p-8">
          <AlertCircle className="h-12 w-12 text-slate-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-slate-900 mb-2">Map Unavailable</h3>
          <p className="text-slate-500 mb-4">Using simplified location view</p>
          
          {pickup && (
            <div className="bg-white rounded-lg p-3 mb-2 border">
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                <span className="text-sm font-medium">Pickup: {pickup.address}</span>
              </div>
            </div>
          )}
          
          {destination && (
            <div className="bg-white rounded-lg p-3 border">
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                <span className="text-sm font-medium">Drop: {destination.address}</span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );

  if (error) {
    return (
      <div className={className} style={{ height }}>
        <FallbackMap />
      </div>
    );
  }

  return (
    <div className={`relative ${className}`} style={{ height }}>
      {!isLoaded && (
        <div className="absolute inset-0 flex items-center justify-center bg-slate-100 rounded-lg">
          <div className="text-center">
            <Loader className="h-8 w-8 animate-spin text-blue-500 mx-auto mb-4" />
            <p className="text-slate-500">Loading Google Maps...</p>
          </div>
        </div>
      )}
      
      <div ref={mapRef} className="w-full h-full rounded-lg" />
      
      {/* Instructions overlay */}
      {interactive && (!pickup || !destination) && (
        <div className="absolute top-4 left-4 bg-white rounded-lg shadow-lg p-4 max-w-64">
          <div className="flex items-start space-x-3">
            <MapPin className="h-5 w-5 text-blue-500 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-slate-900 mb-1">Select Locations</p>
              <p className="text-xs text-slate-600">
                Click on the map to set {!pickup ? 'pickup' : 'destination'} location
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default GoogleMapComponent;
