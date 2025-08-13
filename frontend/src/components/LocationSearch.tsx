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
  const [lastSearchTime, setLastSearchTime] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Enhanced sample locations for demo - in real app, this would come from Google Places API
  const sampleLocations: Location[] = [
    // Shimla & Himachal Pradesh
    { address: 'Shimla Railway Station, Shimla, HP', coordinates: [77.1734, 31.1048] },
    { address: 'Mall Road, Shimla, HP', coordinates: [77.1727, 31.1033] },
    { address: 'Christ Church, Shimla, HP', coordinates: [77.1719, 31.1033] },
    { address: 'Jakhu Temple, Shimla, HP', coordinates: [77.1828, 31.1125] },
    { address: 'The Ridge, Shimla, HP', coordinates: [77.1719, 31.1040] },
    { address: 'Kufri, Shimla, HP', coordinates: [77.2648, 31.0976] },
    { address: 'Narkanda, Shimla, HP', coordinates: [77.3167, 31.2167] },
    { address: 'Chail Palace, Chail, HP', coordinates: [77.1833, 30.8944] },
    { address: 'Kasauli, Himachal Pradesh', coordinates: [76.9609, 30.8978] },

    // Chandigarh & Punjab
    { address: 'Chandigarh Airport, Chandigarh', coordinates: [76.7884, 30.6735] },
    { address: 'Sector 17, Chandigarh', coordinates: [76.7794, 30.7411] },
    { address: 'PGI Hospital, Chandigarh', coordinates: [76.7689, 30.7614] },
    { address: 'Rock Garden, Chandigarh', coordinates: [76.8131, 30.7526] },
    { address: 'Sukhna Lake, Chandigarh', coordinates: [76.8131, 30.7420] },
    { address: 'Kalka Railway Station, Kalka, HR', coordinates: [76.9366, 30.8406] },
    { address: 'Panchkula, Haryana', coordinates: [76.8512, 30.6942] },
    { address: 'Mohali Stadium, Mohali, Punjab', coordinates: [76.7323, 30.6908] },

    // Delhi NCR
    { address: 'Delhi Airport, Terminal 3, Delhi', coordinates: [77.1025, 28.5562] },
    { address: 'Connaught Place, New Delhi', coordinates: [77.2167, 28.6289] },
    { address: 'India Gate, Delhi', coordinates: [77.2295, 28.6129] },
    { address: 'Red Fort, Delhi', coordinates: [77.2410, 28.6562] },
    { address: 'Gurgaon Cyber City, Haryana', coordinates: [77.0892, 28.4089] },
    { address: 'Noida Sector 18, UP', coordinates: [77.3178, 28.5706] },

    // Popular tourist destinations
    { address: 'Manali, Himachal Pradesh', coordinates: [77.1892, 32.2432] },
    { address: 'Dharamshala, Himachal Pradesh', coordinates: [76.3234, 32.2190] },
    { address: 'Rishikesh, Uttarakhand', coordinates: [78.2676, 30.0869] },
    { address: 'Haridwar, Uttarakhand', coordinates: [78.1642, 29.9457] },

    // Local areas
    { address: 'Bus Stand, Shimla', coordinates: [77.1820, 31.1033] },
    { address: 'IGMC Hospital, Shimla', coordinates: [77.1695, 31.1089] },
    { address: 'Himachal University, Shimla', coordinates: [77.1145, 31.0775] },
    { address: 'Summer Hill, Shimla', coordinates: [77.1500, 31.0833] }
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
      const currentTime = Date.now();
      setLastSearchTime(currentTime);
      setIsLoading(true);

      // Debounced search with better filtering
      setTimeout(() => {
        // Only proceed if this is the latest search
        if (currentTime === lastSearchTime) {
          const filtered = sampleLocations.filter(location => {
            const lowercaseQuery = query.toLowerCase();
            const lowercaseAddress = location.address.toLowerCase();

            // Prioritize matches that start with the query
            const startsWithQuery = lowercaseAddress.startsWith(lowercaseQuery);
            const containsQuery = lowercaseAddress.includes(lowercaseQuery);

            return startsWithQuery || containsQuery;
          }).sort((a, b) => {
            // Sort by relevance - starting matches first
            const aStarts = a.address.toLowerCase().startsWith(query.toLowerCase());
            const bStarts = b.address.toLowerCase().startsWith(query.toLowerCase());

            if (aStarts && !bStarts) return -1;
            if (!aStarts && bStarts) return 1;
            return 0;
          }).slice(0, 8); // Limit to 8 results for better UX

          setSuggestions(filtered);
          setIsLoading(false);
        }
      }, 200); // Reduced delay for snappier feel
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

          {!isLoading && suggestions.map((location, index) => {
            // Highlight matching text
            const highlightText = (text: string, query: string) => {
              if (!query) return text;
              const parts = text.split(new RegExp(`(${query})`, 'gi'));
              return parts.map((part, i) =>
                part.toLowerCase() === query.toLowerCase() ?
                  <span key={i} className="bg-yellow-200 text-yellow-900 font-semibold">{part}</span> :
                  part
              );
            };

            return (
              <button
                key={index}
                onClick={() => handleSuggestionClick(location)}
                className="w-full text-left px-4 py-3 hover:bg-blue-50 flex items-center space-x-3 border-b border-slate-100 last:border-b-0 transition-colors group"
              >
                <div className={`p-2 rounded-lg transition-colors ${
                  type === 'pickup' ? 'bg-green-100 group-hover:bg-green-200' : 'bg-red-100 group-hover:bg-red-200'
                }`}>
                  <MapPin className={`h-4 w-4 ${
                    type === 'pickup' ? 'text-green-600' : 'text-red-600'
                  }`} />
                </div>
                <div className="flex-1">
                  <div className="font-medium text-slate-900">
                    {highlightText(location.address, searchQuery)}
                  </div>
                  <div className="text-sm text-slate-500">
                    📍 {location.coordinates[1].toFixed(4)}, {location.coordinates[0].toFixed(4)}
                  </div>
                </div>
              </button>
            );
          })}
          
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
