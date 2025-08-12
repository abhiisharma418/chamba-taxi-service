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

              // Determine if this should be pickup or destination
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
    if (!map || !pickup) return;

    // Remove existing pickup marker
    if (pickupMarker) {
      pickupMarker.setMap(null);
    }

    // Create new pickup marker
    const marker = new google.maps.Marker({
      position: { lat: pickup.coordinates[1], lng: pickup.coordinates[0] },
      map: map,
      title: 'Pickup Location',
      icon: {
        url: 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(`
          <svg width="32" height="32" viewBox="0 0 32 32" xmlns="http://www.w3.org/2000/svg">
            <circle cx="16" cy="16" r="14" fill="#22C55E" stroke="white" stroke-width="4"/>
            <circle cx="16" cy="16" r="6" fill="white"/>
          </svg>
        `),
        scaledSize: new google.maps.Size(32, 32),
        anchor: new google.maps.Point(16, 16)
      }
    });

    setPickupMarker(marker);
  }, [map, pickup]);

  // Update destination marker
  useEffect(() => {
    if (!map || !destination) return;

    // Remove existing destination marker
    if (destinationMarker) {
      destinationMarker.setMap(null);
    }

    // Create new destination marker
    const marker = new google.maps.Marker({
      position: { lat: destination.coordinates[1], lng: destination.coordinates[0] },
      map: map,
      title: 'Destination',
      icon: {
        url: 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(`
          <svg width="32" height="32" viewBox="0 0 32 32" xmlns="http://www.w3.org/2000/svg">
            <circle cx="16" cy="16" r="14" fill="#EF4444" stroke="white" stroke-width="4"/>
            <circle cx="16" cy="16" r="6" fill="white"/>
          </svg>
        `),
        scaledSize: new google.maps.Size(32, 32),
        anchor: new google.maps.Point(16, 16)
      }
    });

    setDestinationMarker(marker);
  }, [map, destination]);

  // Update route
  useEffect(() => {
    if (!map || !directionsService || !directionsRenderer || !pickup || !destination || !showRoute) return;

    directionsService.route(
      {
        origin: { lat: pickup.coordinates[1], lng: pickup.coordinates[0] },
        destination: { lat: destination.coordinates[1], lng: destination.coordinates[0] },
        travelMode: google.maps.TravelMode.DRIVING,
      },
      (result, status) => {
        if (status === 'OK' && result) {
          directionsRenderer.setDirections(result);
          
          // Fit map to show entire route
          const bounds = new google.maps.LatLngBounds();
          bounds.extend({ lat: pickup.coordinates[1], lng: pickup.coordinates[0] });
          bounds.extend({ lat: destination.coordinates[1], lng: destination.coordinates[0] });
          map.fitBounds(bounds);
        }
      }
    );
  }, [map, directionsService, directionsRenderer, pickup, destination, showRoute]);

  return (
    <div className="relative">
      <div 
        ref={mapRef} 
        style={{ height, width: '100%' }}
        className="rounded-xl overflow-hidden shadow-lg"
      />
      {!window.google && (
        <div 
          className="absolute inset-0 bg-gradient-to-br from-slate-100 to-blue-100 rounded-xl flex items-center justify-center"
          style={{ height }}
        >
          <div className="text-center">
            <div className="w-16 h-16 bg-blue-600 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-slate-900 mb-2">Interactive Map</h3>
            <p className="text-slate-600 text-sm">Google Maps integration ready</p>
            <p className="text-slate-500 text-xs mt-1">Add Google Maps API key to enable</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default MapComponent;
