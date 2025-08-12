import React from 'react';

// Utility for creating lazy-loaded components with better error handling
export const createLazyComponent = (
  importFn: () => Promise<{ default: React.ComponentType<any> }>,
  fallback?: React.ComponentType
) => {
  const LazyComponent = React.lazy(async () => {
    try {
      return await importFn();
    } catch (error) {
      console.error('Failed to load component:', error);
      
      // Return fallback component or a simple error component
      if (fallback) {
        return { default: fallback };
      }
      
      // Default error component
      const ErrorComponent = () => (
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
          <div className="text-center p-8">
            <div className="mb-4">
              <svg className="w-16 h-16 mx-auto text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">Failed to Load Page</h2>
            <p className="text-gray-600 mb-4">There was an error loading this page.</p>
            <button 
              onClick={() => window.location.reload()}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
            >
              Reload Page
            </button>
          </div>
        </div>
      );
      
      return { default: ErrorComponent };
    }
  });
  
  return LazyComponent;
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
  },
  
  // Admin routes (load on demand)
  admin: {
    dashboard: () => import('../../admin/src/pages/Dashboard'),
    login: () => import('../../admin/src/pages/Login'),
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
    case 'admin':
      preloadRoute(routes.admin.dashboard);
      break;
  }
};

// Component-level code splitting for heavy components
export const createLazySection = (
  importFn: () => Promise<{ default: React.ComponentType<any> }>,
  loadingComponent?: React.ComponentType
) => {
  const LazySectionComponent = React.lazy(importFn);
  
  return (props: any) => (
    <React.Suspense 
      fallback={
        loadingComponent ? 
          React.createElement(loadingComponent) : 
          <div className="animate-pulse bg-gray-200 rounded-lg h-32"></div>
      }
    >
      <LazySectionComponent {...props} />
    </React.Suspense>
  );
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
  },
  
  // Prefetch API endpoints
  api: (endpoints: string[]) => {
    endpoints.forEach(endpoint => {
      fetch(endpoint, { method: 'HEAD' }).catch(() => {
        // Silently fail prefetch attempts
      });
    });
  }
};

// Bundle splitting recommendations
export const bundleConfig = {
  // Vendor chunks
  vendor: [
    'react',
    'react-dom',
    'react-router-dom',
    '@tanstack/react-query'
  ],
  
  // Common chunks
  common: [
    './src/lib/api',
    './src/contexts',
    './src/components/Navigation',
    './src/components/LoadingSkeletons'
  ],
  
  // Page chunks (automatically split by route)
  pages: {
    customer: ['./src/pages/customer'],
    driver: ['./src/pages/driver'],
    admin: ['./src/admin']
  }
};

export default {
  createLazyComponent,
  preloadRoute,
  preloadCriticalRoutes,
  createLazySection,
  dynamicImport,
  prefetchResources,
  routes,
  bundleConfig
};