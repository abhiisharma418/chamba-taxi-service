import { useState, useEffect } from 'react';

interface UseGoogleMapsOptions {
  libraries?: string[];
}

export const useGoogleMaps = (options: UseGoogleMapsOptions = {}) => {
  const [isLoaded, setIsLoaded] = useState(false);
  const [loadError, setLoadError] = useState<Error | null>(null);

  useEffect(() => {
    // Check if Google Maps is already loaded
    if (window.google && window.google.maps) {
      setIsLoaded(true);
      return;
    }

    // Check if we have a valid API key
    const apiKey = (import.meta as any).env?.VITE_GOOGLE_MAPS_API_KEY;
    if (!apiKey || apiKey === 'AIzaSyDemo_Key_For_Development_Replace_With_Real') {
      setLoadError(new Error('Google Maps API key not configured'));
      return;
    }

    // Listen for Google Maps loaded event
    const handleMapsLoaded = () => {
      if (window.google && window.google.maps) {
        setIsLoaded(true);
        setLoadError(null);
      }
    };

    // Add event listener
    window.addEventListener('google-maps-loaded', handleMapsLoaded);

    // Load Google Maps script if not already loading
    if (!window.googleMapsLoaded && !document.querySelector('script[src*="maps.googleapis.com"]')) {
      const script = document.createElement('script');
      const libraries = options.libraries || ['places'];
      script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=${libraries.join(',')}&callback=initGoogleMaps`;
      script.async = true;
      script.defer = true;
      script.onerror = () => {
        setLoadError(new Error('Failed to load Google Maps API'));
      };
      document.head.appendChild(script);
    }

    // Cleanup
    return () => {
      window.removeEventListener('google-maps-loaded', handleMapsLoaded);
    };
  }, []);

  return { isLoaded, loadError };
};

export default useGoogleMaps;
