import { useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { preloadCriticalRoutes, prefetchResources } from '../utils/codeSplitting';

// Hook to handle intelligent preloading for admin portal
export const useCodeSplitting = () => {
  const { user } = useAuth();

  useEffect(() => {
    // Only run in browser environment
    if (typeof window === 'undefined') return;

    try {
      if (user) {
        // Preload admin routes
        preloadCriticalRoutes();

        // Prefetch common admin resources
        prefetchResources.images([
          '/icons/dashboard.svg',
          '/icons/users.svg',
          '/icons/analytics.svg',
          '/icons/reports.svg'
        ]);
      }
    } catch (error) {
      console.debug('Error in admin code splitting initialization:', error);
    }
  }, [user]);

  useEffect(() => {
    // Only run in browser environment
    if (typeof window === 'undefined' || typeof document === 'undefined') return;

    // Preload routes on user interaction (hover, focus)
    const handleMouseEnter = (e: Event) => {
      // Ensure target exists and is an Element
      if (!e.target || !(e.target instanceof Element)) {
        return;
      }

      const target = e.target;

      // Safely check if target has closest method and is an anchor or contains one
      let link: HTMLAnchorElement | null = null;

      try {
        // First check if the target itself is a link
        if (target.tagName === 'A' && target instanceof HTMLAnchorElement && target.href) {
          link = target;
        } else if (typeof target.closest === 'function') {
          // Then check if it has a parent link
          link = target.closest('a[href]') as HTMLAnchorElement;
        }
      } catch (error) {
        // Silently handle any errors in closest method
        console.debug('Error in link detection:', error);
        return;
      }

      if (link && link.href) {
        try {
          const path = new URL(link.href).pathname;

          // Preload based on admin route
          if (path.includes('/dashboard')) {
            import('../pages/Dashboard').catch(() => {
              // Silently handle import errors
            });
          } else if (path.includes('/users')) {
            import('../pages/UserManagement').catch(() => {
              // Silently handle import errors
            });
          } else if (path.includes('/rides')) {
            import('../pages/LiveRideMonitoring').catch(() => {
              // Silently handle import errors
            });
          } else if (path.includes('/financial')) {
            import('../pages/FinancialManagement').catch(() => {
              // Silently handle import errors
            });
          }
        } catch (error) {
          // Handle URL parsing errors
          console.debug('Error parsing URL:', error);
        }
      }
    };

    // Add hover preloading with error handling
    try {
      document.addEventListener('mouseenter', handleMouseEnter, true);
    } catch (error) {
      console.warn('Could not add mouseenter listener:', error);
    }

    return () => {
      try {
        document.removeEventListener('mouseenter', handleMouseEnter, true);
      } catch (error) {
        console.debug('Error removing mouseenter listener:', error);
      }
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

// Hook for monitoring performance in admin portal
export const usePerformanceMonitoring = () => {
  useEffect(() => {
    // Monitor long tasks
    if (typeof window !== 'undefined' && 'PerformanceObserver' in window) {
      try {
        const observer = new PerformanceObserver((list) => {
          try {
            for (const entry of list.getEntries()) {
              if (entry.entryType === 'longtask') {
                console.warn('Admin portal long task detected:', entry.duration);
              }
            }
          } catch (error) {
            console.debug('Error processing performance entries:', error);
          }
        });

        observer.observe({ entryTypes: ['longtask'] });

        return () => {
          try {
            observer.disconnect();
          } catch (error) {
            console.debug('Error disconnecting performance observer:', error);
          }
        };
      } catch (error) {
        console.debug('Error setting up admin performance monitoring:', error);
      }
    }
  }, []);
};

export default useCodeSplitting;
