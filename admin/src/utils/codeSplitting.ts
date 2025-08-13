import React from 'react';

// Utility for creating lazy-loaded components with better error handling
export const createLazyComponent = (
  importFn: () => Promise<{ default: React.ComponentType<any> }>
) => {
  return React.lazy(async () => {
    try {
      return await importFn();
    } catch (error) {
      console.error('Failed to load admin component:', error);
      
      // Return a simple error component for admin portal
      const ErrorComponent = () => React.createElement(
        'div',
        { 
          className: 'min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 dark:from-dark-25 dark:via-dark-50 dark:to-dark-100',
          style: { minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }
        },
        React.createElement(
          'div',
          { className: 'text-center p-8 bg-white dark:bg-dark-100 rounded-2xl shadow-xl max-w-md mx-4' },
          React.createElement('h2', { className: 'text-xl font-semibold text-gray-900 dark:text-white mb-2' }, 'Failed to Load Admin Page'),
          React.createElement('p', { className: 'text-gray-600 dark:text-gray-300 mb-4' }, 'There was an error loading this admin page.'),
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

// Route-based code splitting configuration for admin portal
export const routes = {
  // Core admin routes (load immediately)
  core: {
    dashboard: () => import('../pages/Dashboard'),
    login: () => import('../pages/Login'),
  },
  
  // Management routes (load on demand)
  management: {
    users: () => import('../pages/UserManagement'),
    rides: () => import('../pages/LiveRideMonitoring'),
    financial: () => import('../pages/FinancialManagement'),
    support: () => import('../pages/SupportManagement'),
    emergency: () => import('../pages/EmergencyManagement'),
    scheduled: () => import('../pages/ScheduledRidesManagement'),
  },
  
  // Reporting routes (load on demand)
  reporting: {
    financial: () => import('../pages/FinancialReporting'),
    promoCodes: () => import('../pages/PromoCodeManagement'),
  }
};

// Preload critical routes for admin portal
export const preloadCriticalRoutes = () => {
  // Always preload dashboard and core management
  preloadRoute(routes.core.dashboard);
  preloadRoute(routes.management.users);
  preloadRoute(routes.management.rides);
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
      
      console.warn(`Admin import failed, retrying... (${i + 1}/${retries})`);
      await new Promise(resolve => setTimeout(resolve, delay * (i + 1)));
    }
  }
};

// Prefetch resources for better performance
export const prefetchResources = {
  // Prefetch images
  images: (urls: string[]) => {
    if (typeof document === 'undefined') return;
    
    urls.forEach(url => {
      const link = document.createElement('link');
      link.rel = 'prefetch';
      link.href = url;
      document.head.appendChild(link);
    });
  },
  
  // Prefetch scripts
  scripts: (urls: string[]) => {
    if (typeof document === 'undefined') return;
    
    urls.forEach(url => {
      const link = document.createElement('link');
      link.rel = 'prefetch';
      link.href = url;
      link.as = 'script';
      document.head.appendChild(link);
    });
  }
};

// Performance monitoring for admin code splitting
export const performanceMonitor = {
  // Track component load times
  trackComponentLoad: (componentName: string, startTime: number) => {
    const loadTime = performance.now() - startTime;
    console.log(`Admin ${componentName} loaded in ${loadTime.toFixed(2)}ms`);
    
    // Send to analytics if needed
    if (window.gtag) {
      window.gtag('event', 'admin_component_load', {
        component_name: componentName,
        load_time: loadTime
      });
    }
  },
  
  // Track bundle sizes
  trackBundleSize: (bundleName: string, size: number) => {
    console.log(`Admin ${bundleName} bundle size: ${(size / 1024).toFixed(2)}KB`);
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
