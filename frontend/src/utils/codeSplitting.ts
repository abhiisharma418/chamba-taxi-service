import React from 'react';

// Utility for creating lazy-loaded components with better error handling
export const createLazyComponent = (
  importFn: () => Promise<{ default: React.ComponentType<any> }>
) => {
  return React.lazy(async () => {
    try {
      return await importFn();
    } catch (error) {
      console.error('Failed to load component:', error);
      
      // Return a simple error component
      const ErrorComponent = () => React.createElement(
        'div',
        { 
          className: 'min-h-screen flex items-center justify-center bg-gray-50',
          style: { minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }
        },
        React.createElement(
          'div',
          { className: 'text-center p-8' },
          React.createElement('h2', { className: 'text-xl font-semibold text-gray-900 mb-2' }, 'Failed to Load Page'),
          React.createElement('p', { className: 'text-gray-600 mb-4' }, 'There was an error loading this page.'),
          React.createElement(
            'button',
            {
              className: 'bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors',
              onClick: () => window.location.reload()
            },
            'Reload Page'
          )
        )
      );
      
      return { default: ErrorComponent };
    }
  });
};

// Preload utility for critical routes
export const preloadRoute = (importFn: () => Promise<any>) => {
  return importFn();
};

// Route-based code splitting configuration
export const routes = {
  // Public routes (load immediately)
  public: {
    landing: () => import('../pages/LandingPage'),
    login: () => import('../pages/Login'),
    signup: () => import('../pages/SignUp'),
  },
  
  // Customer routes (load on demand)
  customer: {
    dashboard: () => import('../pages/customer/Dashboard'),
    bookRide: () => import('../pages/customer/BookRide'),
    history: () => import('../pages/customer/History'),
    liveTracking: () => import('../pages/customer/LiveTracking'),
  },
  
  // Driver routes (load on demand)
  driver: {
    dashboard: () => import('../pages/driver/Dashboard'),
    rides: () => import('../pages/driver/Rides'),
    earnings: () => import('../pages/driver/Earnings'),
    profile: () => import('../pages/driver/Profile'),
  }
};

// Preload critical routes based on user type
export const preloadCriticalRoutes = (userType?: 'customer' | 'driver' | 'admin') => {
  if (!userType) {
    // Preload public routes
    preloadRoute(routes.public.landing);
    return;
  }
  
  switch (userType) {
    case 'customer':
      preloadRoute(routes.customer.dashboard);
      preloadRoute(routes.customer.bookRide);
      break;
    case 'driver':
      preloadRoute(routes.driver.dashboard);
      preloadRoute(routes.driver.rides);
      break;
  }
};

// Dynamic import with retry logic
export const dynamicImport = async (
  importFn: () => Promise<any>,
  retries: number = 3,
  delay: number = 1000
): Promise<any> => {
  for (let i = 0; i < retries; i++) {
    try {
      return await importFn();
    } catch (error) {
      if (i === retries - 1) throw error;
      
      console.warn(`Import failed, retrying... (${i + 1}/${retries})`);
      await new Promise(resolve => setTimeout(resolve, delay * (i + 1)));
    }
  }
};

// Prefetch resources for better performance
export const prefetchResources = {
  // Prefetch images
  images: (urls: string[]) => {
    urls.forEach(url => {
      const link = document.createElement('link');
      link.rel = 'prefetch';
      link.href = url;
      document.head.appendChild(link);
    });
  },
  
  // Prefetch scripts
  scripts: (urls: string[]) => {
    urls.forEach(url => {
      const link = document.createElement('link');
      link.rel = 'prefetch';
      link.href = url;
      link.as = 'script';
      document.head.appendChild(link);
    });
  }
};

// Performance monitoring for code splitting
export const performanceMonitor = {
  // Track component load times
  trackComponentLoad: (componentName: string, startTime: number) => {
    const loadTime = performance.now() - startTime;
    console.log(`${componentName} loaded in ${loadTime.toFixed(2)}ms`);
    
    // Send to analytics if needed
    if (window.gtag) {
      window.gtag('event', 'component_load', {
        component_name: componentName,
        load_time: loadTime
      });
    }
  },
  
  // Track bundle sizes
  trackBundleSize: (bundleName: string, size: number) => {
    console.log(`${bundleName} bundle size: ${(size / 1024).toFixed(2)}KB`);
  }
};

export default {
  createLazyComponent,
  preloadRoute,
  preloadCriticalRoutes,
  dynamicImport,
  prefetchResources,
  performanceMonitor,
  routes
};
