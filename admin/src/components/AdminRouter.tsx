import React, { Suspense } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { createLazyComponent } from '../utils/codeSplitting';
import { AdminRouteLoading } from './AdminLoading';

// Create lazy components with error boundaries
const LazyDashboard = React.lazy(() => import('../pages/Dashboard'));
const LazyUserManagement = createLazyComponent(() => import('../pages/UserManagement'));
const LazyLiveRideMonitoring = createLazyComponent(() => import('../pages/LiveRideMonitoring'));
const LazyFinancialManagement = createLazyComponent(() => import('../pages/FinancialManagement'));
const LazySupportManagement = createLazyComponent(() => import('../pages/SupportManagement'));
const LazyFinancialReporting = createLazyComponent(() => import('../pages/FinancialReporting'));
const LazyPromoCodeManagement = createLazyComponent(() => import('../pages/PromoCodeManagement'));
const LazyEmergencyManagement = createLazyComponent(() => import('../pages/EmergencyManagement'));
const LazyScheduledRidesManagement = createLazyComponent(() => import('../pages/ScheduledRidesManagement'));

// Route configuration for better organization
const adminRoutes = [
  {
    path: '/dashboard',
    component: LazyDashboard,
    title: 'Dashboard'
  },
  {
    path: '/users',
    component: LazyUserManagement,
    title: 'User Management'
  },
  {
    path: '/rides',
    component: LazyLiveRideMonitoring,
    title: 'Live Ride Monitoring'
  },
  {
    path: '/financial',
    component: LazyFinancialManagement,
    title: 'Financial Management'
  },
  {
    path: '/support',
    component: LazySupportManagement,
    title: 'Support Management'
  },
  {
    path: '/financial-reports',
    component: LazyFinancialReporting,
    title: 'Financial Reports'
  },
  {
    path: '/promo-codes',
    component: LazyPromoCodeManagement,
    title: 'Promo Code Management'
  },
  {
    path: '/emergency',
    component: LazyEmergencyManagement,
    title: 'Emergency Management'
  },
  {
    path: '/scheduled-rides',
    component: LazyScheduledRidesManagement,
    title: 'Scheduled Rides Management'
  }
];

// Route wrapper with performance tracking
const RouteWrapper: React.FC<{ 
  Component: React.ComponentType; 
  title: string 
}> = ({ Component, title }) => {
  React.useEffect(() => {
    // Track route navigation for analytics
    if (window.gtag) {
      window.gtag('event', 'admin_page_view', {
        page_title: title,
        page_location: window.location.pathname
      });
    }
    
    // Update document title
    document.title = `${title} - RideWithUs Admin`;
    
    // Performance monitoring
    const startTime = performance.now();
    
    return () => {
      const loadTime = performance.now() - startTime;
      console.log(`Admin ${title} rendered in ${loadTime.toFixed(2)}ms`);
    };
  }, [title]);

  return <Component />;
};

// Main admin router component
export const AdminRouter: React.FC = () => {
  return (
    <Suspense fallback={<AdminRouteLoading />}>
      <Routes>
        {/* Default redirect */}
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        
        {/* Dynamic routes from configuration */}
        {adminRoutes.map(({ path, component: Component, title }) => (
          <Route
            key={path}
            path={path}
            element={
              <Suspense fallback={<AdminRouteLoading />}>
                <RouteWrapper Component={Component} title={title} />
              </Suspense>
            }
          />
        ))}
        
        {/* Catch all redirect */}
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </Suspense>
  );
};

// Route preloader for hover effects
export const preloadRoute = (routePath: string) => {
  const route = adminRoutes.find(r => r.path === routePath);
  if (route) {
    // Trigger component preload
    route.component;
  }
};

export default AdminRouter;
