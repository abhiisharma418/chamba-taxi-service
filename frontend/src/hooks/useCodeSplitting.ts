import React, { useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { preloadCriticalRoutes, prefetchResources } from '../utils/codeSplitting';

// Hook to handle intelligent preloading based on user state
export const useCodeSplitting = () => {
  const { user } = useAuth();

  useEffect(() => {
    if (user) {
      // Preload routes based on user type
      preloadCriticalRoutes(user.role as 'customer' | 'driver' | 'admin');
      
      // Prefetch common resources
      prefetchResources.images([
        '/icons/car.svg',
        '/icons/user.svg',
        '/icons/map.svg'
      ]);
    } else {
      // Preload public routes for unauthenticated users
      preloadCriticalRoutes();
    }
  }, [user]);

  useEffect(() => {
    // Preload routes on user interaction (hover, focus)
    const handleMouseEnter = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      const link = target.closest('a[href]') as HTMLAnchorElement;
      
      if (link && link.href) {
        const path = new URL(link.href).pathname;
        
        // Preload based on route
        if (path.includes('/customer/')) {
          import('../pages/customer/Dashboard');
        } else if (path.includes('/driver/')) {
          import('../pages/driver/Dashboard');
        }
      }
    };

    // Add hover preloading
    document.addEventListener('mouseenter', handleMouseEnter, true);
    
    return () => {
      document.removeEventListener('mouseenter', handleMouseEnter, true);
    };
  }, []);
};

// Hook for component-level code splitting
export const useLazyComponent = (importFn: () => Promise<any>) => {
  useEffect(() => {
    // Preload component after a delay
    const timer = setTimeout(() => {
      importFn().catch(console.error);
    }, 2000);

    return () => clearTimeout(timer);
  }, [importFn]);
};

// Hook for monitoring performance
export const usePerformanceMonitoring = () => {
  useEffect(() => {
    // Monitor long tasks
    if ('PerformanceObserver' in window) {
      const observer = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          if (entry.entryType === 'longtask') {
            console.warn('Long task detected:', entry.duration);
          }
        }
      });

      observer.observe({ entryTypes: ['longtask'] });

      return () => observer.disconnect();
    }
  }, []);
};

export default useCodeSplitting;
