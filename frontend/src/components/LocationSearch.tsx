import React, { useState, useEffect, useRef } from 'react';
import { MapPin, Navigation2, Search, X, Loader } from 'lucide-react';
import useGoogleMaps from '../hooks/useGoogleMaps';

interface Location {
  address: string;
  coordinates: [number, number];
}

interface LocationSearchProps {
  label: string;
  placeholder: string;
  value: string;
  onChange: (location: Location) => void;
  onCurrentLocation?: () => void;
  type: 'pickup' | 'destination';
}

const LocationSearch: React.FC<LocationSearchProps> = ({
  label,
  placeholder,
  value,
  onChange,
  onCurrentLocation,
  type
}) => {
  const { isLoaded, loadError } = useGoogleMaps({ libraries: ['places'] });
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState(value);
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const autocompleteService = useRef<google.maps.places.AutocompleteService | null>(null);
  const placesService = useRef<google.maps.places.PlacesService | null>(null);
  const debounceTimer = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    setQuery(value);
  }, [value]);

  useEffect(() => {
    // Initialize Google Places services when maps are loaded
    if (isLoaded && window.google && window.google.maps && window.google.maps.places) {
      autocompleteService.current = new google.maps.places.AutocompleteService();
      // Create a dummy map for PlacesService (required by Google Maps API)
      const dummyMap = new google.maps.Map(document.createElement('div'));
      placesService.current = new google.maps.places.PlacesService(dummyMap);
    }
  }, [isLoaded]);

  const searchPlaces = async (searchQuery: string) => {
    if (!searchQuery.trim() || !autocompleteService.current || !isLoaded) return;

    setIsLoading(true);

    try {
      autocompleteService.current.getPlacePredictions(
        {
          input: searchQuery,
          componentRestrictions: { country: 'IN' }, // Restrict to India
          types: ['establishment', 'geocode'],
          fields: ['place_id', 'formatted_address', 'geometry', 'name'],
          bounds: new google.maps.LatLngBounds(
            new google.maps.LatLng(31.0, 77.0), // Southwest bounds (Shimla area)
            new google.maps.LatLng(31.2, 77.3)  // Northeast bounds
          )
        },
        (predictions, status) => {
          setIsLoading(false);
          if (status === google.maps.places.PlacesServiceStatus.OK && predictions) {
            setSuggestions(predictions.slice(0, 6)); // Limit to 6 suggestions
          } else {
            setSuggestions([]);
          }
        }
      );
    } catch (error) {
      setIsLoading(false);
      setSuggestions([]);
      console.warn('Places search error:', error);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newQuery = e.target.value;
    setQuery(newQuery);
    setIsOpen(true);

    // Clear existing timer
    if (debounceTimer.current) {
      clearTimeout(debounceTimer.current);
    }

    // Debounce search
    if (newQuery.length > 2) {
      debounceTimer.current = setTimeout(() => {
        searchPlaces(newQuery);
      }, 300);
    } else {
      setSuggestions([]);
      setIsLoading(false);
    }
  };

  const selectPlace = (prediction: google.maps.places.AutocompletePrediction) => {
    if (!placesService.current || !window.google) return;

    placesService.current.getDetails(
      { placeId: prediction.place_id },
      (place, status) => {
        if (status === google.maps.places.PlacesServiceStatus.OK && place && place.geometry) {
          const location: Location = {
            address: place.formatted_address || prediction.description,
            coordinates: [
              place.geometry.location?.lng() || 0,
              place.geometry.location?.lat() || 0
            ]
          };
          
          setQuery(location.address);
          setIsOpen(false);
          setSuggestions([]);
          onChange(location);
        }
      }
    );
  };

  const handleCurrentLocation = () => {
    if (navigator.geolocation && onCurrentLocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const location: Location = {
            address: 'Current Location',
            coordinates: [position.coords.longitude, position.coords.latitude]
          };
          
          setQuery('Current Location');
          onChange(location);
          
          // Reverse geocode to get actual address
          if (window.google && window.google.maps && window.google.maps.Geocoder) {
            const geocoder = new google.maps.Geocoder();
            geocoder.geocode(
              { location: { lat: position.coords.latitude, lng: position.coords.longitude } },
              (results, status) => {
                if (status === 'OK' && results && results[0]) {
                  const actualLocation: Location = {
                    address: results[0].formatted_address,
                    coordinates: [position.coords.longitude, position.coords.latitude]
                  };
                  setQuery(actualLocation.address);
                  onChange(actualLocation);
                }
              }
            );
          }
        },
        (error) => {
          console.error('Error getting current location:', error);
        }
      );
    }
  };

  const clearInput = () => {
    setQuery('');
    setIsOpen(false);
    setSuggestions([]);
    onChange({ address: '', coordinates: [0, 0] });
  };

  // Mock suggestions when Google Places is not available
  const mockSuggestions = query.length > 2 ? [
    { place_id: '1', description: `${query} - Popular Location`, structured_formatting: { main_text: query, secondary_text: 'Popular Location' } },
    { place_id: '2', description: `${query} - City Center`, structured_formatting: { main_text: query, secondary_text: 'City Center' } },
    { place_id: '3', description: `${query} - Mall Area`, structured_formatting: { main_text: query, secondary_text: 'Mall Area' } }
  ] : [];

  const displaySuggestions = window.google ? suggestions : mockSuggestions;

  return (
    <div className="relative">
      <label className="block text-sm font-semibold text-slate-700 mb-2">{label}</label>
      
      <div className="relative">
        <div className="relative">
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={handleInputChange}
            onFocus={() => setIsOpen(true)}
            placeholder={placeholder}
            className="w-full pl-12 pr-10 py-3 border border-slate-300 rounded-xl placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-300 bg-white/80"
          />
          
          {/* Location icon */}
          <div className="absolute left-4 top-3.5">
            <div className={`w-3 h-3 rounded-full ${type === 'pickup' ? 'bg-green-500' : 'bg-red-500'}`}></div>
          </div>
          
          {/* Clear button */}
          {query && (
            <button
              onClick={clearInput}
              className="absolute right-3 top-3.5 text-slate-400 hover:text-slate-600 transition-colors"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>

        {/* Current location button */}
        {type === 'pickup' && onCurrentLocation && (
          <button
            onClick={handleCurrentLocation}
            className="mt-3 flex items-center space-x-2 text-blue-600 hover:text-blue-700 text-sm font-medium transition-colors"
          >
            <Navigation2 className="h-4 w-4" />
            <span>Use current location</span>
          </button>
        )}

        {/* Suggestions dropdown */}
        {isOpen && (query.length > 2 || displaySuggestions.length > 0) && (
          <div className="absolute z-50 w-full mt-1 bg-white border border-slate-200 rounded-xl shadow-lg max-h-60 overflow-y-auto">
            {isLoading ? (
              <div className="p-4 text-center">
                <div className="inline-block animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
                <p className="text-sm text-slate-600 mt-2">Searching...</p>
              </div>
            ) : displaySuggestions.length > 0 ? (
              displaySuggestions.map((prediction, index) => (
                <button
                  key={prediction.place_id || index}
                  onClick={() => {
                    if (window.google) {
                      selectPlace(prediction);
                    } else {
                      // Mock selection for demo
                      const location: Location = {
                        address: prediction.description,
                        coordinates: [77.1734 + Math.random() * 0.1, 31.1048 + Math.random() * 0.1]
                      };
                      setQuery(location.address);
                      setIsOpen(false);
                      setSuggestions([]);
                      onChange(location);
                    }
                  }}
                  className="w-full text-left px-4 py-3 hover:bg-slate-50 border-b border-slate-100 last:border-b-0 transition-colors"
                >
                  <div className="flex items-center space-x-3">
                    <MapPin className="h-4 w-4 text-slate-400 flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-slate-900 truncate">
                        {prediction.structured_formatting?.main_text || prediction.description.split(',')[0]}
                      </div>
                      <div className="text-sm text-slate-500 truncate">
                        {prediction.structured_formatting?.secondary_text || 
                         prediction.description.split(',').slice(1).join(',').trim()}
                      </div>
                    </div>
                  </div>
                </button>
              ))
            ) : query.length > 2 && (
              <div className="p-4 text-center text-slate-500">
                <Search className="h-6 w-6 mx-auto mb-2 text-slate-400" />
                <p className="text-sm">No locations found</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default LocationSearch;
