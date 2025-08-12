import React, { useState, useRef, useEffect } from 'react';
import { MapPin, Navigation, Search, X } from 'lucide-react';

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
  type?: 'pickup' | 'destination';
}

const LocationSearch: React.FC<LocationSearchProps> = ({
  label,
  placeholder,
  value,
  onChange,
  onCurrentLocation,
  type = 'destination'
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState(value);
  const [suggestions, setSuggestions] = useState<Location[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Sample locations for demo - in real app, this would come from Google Places API
  const sampleLocations: Location[] = [
    { address: 'Shimla Railway Station, Shimla, HP', coordinates: [77.1734, 31.1048] },
    { address: 'Mall Road, Shimla, HP', coordinates: [77.1727, 31.1033] },
    { address: 'Kalka Railway Station, Kalka, HR', coordinates: [76.9366, 30.8406] },
    { address: 'Chandigarh Airport, Chandigarh', coordinates: [76.7884, 30.6735] },
    { address: 'Sector 17, Chandigarh', coordinates: [76.7794, 30.7411] },
    { address: 'PGI Hospital, Chandigarh', coordinates: [76.7689, 30.7614] },
    { address: 'Rock Garden, Chandigarh', coordinates: [76.8131, 30.7526] },
    { address: 'Sukhna Lake, Chandigarh', coordinates: [76.8131, 30.7420] },
    { address: 'Christ Church, Shimla, HP', coordinates: [77.1719, 31.1033] },
    { address: 'Jakhu Temple, Shimla, HP', coordinates: [77.1828, 31.1125] },
    { address: 'The Ridge, Shimla, HP', coordinates: [77.1719, 31.1040] },
    { address: 'Kufri, Shimla, HP', coordinates: [77.2648, 31.0976] },
    { address: 'Narkanda, Shimla, HP', coordinates: [77.3167, 31.2167] }
  ];

  useEffect(() => {
    setSearchQuery(value);
  }, [value]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const query = e.target.value;
    setSearchQuery(query);
    setIsOpen(true);

    if (query.length > 2) {
      setIsLoading(true);
      // Simulate API call delay
      setTimeout(() => {
        const filtered = sampleLocations.filter(location =>
          location.address.toLowerCase().includes(query.toLowerCase())
        );
        setSuggestions(filtered);
        setIsLoading(false);
      }, 300);
    } else {
      setSuggestions([]);
      setIsLoading(false);
    }
  };

  const handleSuggestionClick = (location: Location) => {
    setSearchQuery(location.address);
    onChange(location);
    setIsOpen(false);
    setSuggestions([]);
  };

  const handleCurrentLocationClick = () => {
    if (onCurrentLocation) {
      onCurrentLocation();
      setIsOpen(false);
    }
  };

  const handleClear = () => {
    setSearchQuery('');
    onChange({ address: '', coordinates: [0, 0] });
    setSuggestions([]);
    inputRef.current?.focus();
  };

  const handleInputFocus = () => {
    setIsOpen(true);
    if (searchQuery.length > 2) {
      const filtered = sampleLocations.filter(location =>
        location.address.toLowerCase().includes(searchQuery.toLowerCase())
      );
      setSuggestions(filtered);
    }
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <label className="block text-sm font-medium text-slate-700 mb-2">
        {label}
      </label>
      
      <div className="relative">
        <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400">
          {type === 'pickup' ? (
            <div className="w-3 h-3 bg-green-500 rounded-full border-2 border-white shadow-md"></div>
          ) : (
            <div className="w-3 h-3 bg-red-500 rounded-full border-2 border-white shadow-md"></div>
          )}
        </div>
        
        <input
          ref={inputRef}
          type="text"
          value={searchQuery}
          onChange={handleInputChange}
          onFocus={handleInputFocus}
          placeholder={placeholder}
          className="w-full pl-10 pr-20 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
        />
        
        <div className="absolute right-3 top-1/2 transform -translate-y-1/2 flex items-center space-x-2">
          {searchQuery && (
            <button
              onClick={handleClear}
              className="text-slate-400 hover:text-slate-600 transition-colors"
            >
              <X className="h-4 w-4" />
            </button>
          )}
          
          {type === 'pickup' && onCurrentLocation && (
            <button
              onClick={handleCurrentLocationClick}
              className="text-blue-500 hover:text-blue-600 transition-colors"
              title="Use current location"
            >
              <Navigation className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>

      {isOpen && (
        <div className="absolute z-50 w-full mt-2 bg-white border border-slate-200 rounded-lg shadow-lg max-h-64 overflow-y-auto">
          {type === 'pickup' && onCurrentLocation && (
            <button
              onClick={handleCurrentLocationClick}
              className="w-full text-left px-4 py-3 hover:bg-blue-50 flex items-center space-x-3 border-b border-slate-100"
            >
              <div className="p-2 bg-blue-100 rounded-lg">
                <Navigation className="h-4 w-4 text-blue-600" />
              </div>
              <div>
                <div className="font-medium text-slate-900">Use Current Location</div>
                <div className="text-sm text-slate-500">Detect your location automatically</div>
              </div>
            </button>
          )}

          {isLoading && (
            <div className="px-4 py-3 text-center text-slate-500">
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-500 mx-auto"></div>
              <span className="text-sm mt-2 block">Searching...</span>
            </div>
          )}

          {!isLoading && suggestions.length === 0 && searchQuery.length > 2 && (
            <div className="px-4 py-3 text-center text-slate-500">
              <Search className="h-5 w-5 mx-auto mb-2 opacity-50" />
              <span className="text-sm">No locations found</span>
            </div>
          )}

          {!isLoading && suggestions.map((location, index) => (
            <button
              key={index}
              onClick={() => handleSuggestionClick(location)}
              className="w-full text-left px-4 py-3 hover:bg-slate-50 flex items-center space-x-3 border-b border-slate-100 last:border-b-0"
            >
              <div className="p-2 bg-slate-100 rounded-lg">
                <MapPin className="h-4 w-4 text-slate-600" />
              </div>
              <div className="flex-1">
                <div className="font-medium text-slate-900">{location.address}</div>
                <div className="text-sm text-slate-500">
                  {location.coordinates[1].toFixed(4)}, {location.coordinates[0].toFixed(4)}
                </div>
              </div>
            </button>
          ))}
          
          {!isLoading && searchQuery.length <= 2 && (
            <div className="px-4 py-8 text-center">
              <Search className="h-8 w-8 text-slate-300 mx-auto mb-3" />
              <p className="text-slate-500 text-sm">
                Type at least 3 characters to search for locations
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default LocationSearch;
