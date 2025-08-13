import React, { Suspense } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider } from './contexts/AuthContext';
import { BookingProvider } from './contexts/BookingContext';
import { NotificationProvider } from './contexts/NotificationContext';
import { ThemeProvider } from './contexts/ThemeContext';
import { queryClient } from './lib/queryClient';

// Components
import ProtectedRoute from './components/ProtectedRoute';
import { PageSkeleton } from './components/LoadingSkeletons';
import { useCodeSplitting, usePerformanceMonitoring } from './hooks/useCodeSplitting';

// Lazy load pages for better performance
const LandingPage = React.lazy(() => import('./pages/LandingPage'));
const Login = React.lazy(() => import('./pages/auth/Login'));
const Signup = React.lazy(() => import('./pages/auth/Signup'));

// Customer pages
const CustomerDashboard = React.lazy(() => import('./pages/customer/Dashboard'));
const CustomerBookRide = React.lazy(() => import('./pages/customer/BookRide'));
const CustomerHistory = React.lazy(() => import('./pages/customer/History'));
const CustomerLiveTracking = React.lazy(() => import('./pages/customer/LiveTracking'));
const CustomerEmergencyCenter = React.lazy(() => import('./pages/customer/EmergencyCenter'));

// Driver pages
const DriverDashboard = React.lazy(() => import('./pages/driver/Dashboard'));
const DriverTripHistory = React.lazy(() => import('./pages/driver/TripHistory'));
const DriverEarnings = React.lazy(() => import('./pages/driver/Earnings'));
const DriverProfile = React.lazy(() => import('./pages/driver/Profile'));
const DriverVehicleManagement = React.lazy(() => import('./pages/driver/VehicleManagement'));
const DriverSupport = React.lazy(() => import('./pages/driver/Support'));

const AppRoutes: React.FC = () => {
  useCodeSplitting();
  usePerformanceMonitoring();

  return (
    <Router>
      <div className="min-h-screen bg-gray-50 dark:bg-dark-surface transition-colors duration-200">
        <Suspense fallback={<PageSkeleton />}>
          <Routes>
            {/* Public Routes */}
            <Route path="/" element={<LandingPage />} />
            <Route path="/login" element={<Login />} />
            <Route path="/signup" element={<Signup />} />

            <Route
              path="/customer/dashboard"
              element={
                <ProtectedRoute userType="customer">
                  <CustomerDashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/customer/book-ride"
              element={
                <ProtectedRoute userType="customer">
                  <CustomerBookRide />
                </ProtectedRoute>
              }
            />
            <Route
              path="/customer/history"
              element={
                <ProtectedRoute userType="customer">
                  <CustomerHistory />
                </ProtectedRoute>
              }
            />
            <Route
              path="/customer/live-tracking/:rideId"
              element={
                <ProtectedRoute userType="customer">
                  <CustomerLiveTracking />
                </ProtectedRoute>
              }
            />
            <Route
              path="/customer/emergency"
              element={
                <ProtectedRoute userType="customer">
                  <CustomerEmergencyCenter />
                </ProtectedRoute>
              }
            />

            {/* Driver Routes */}
            <Route
              path="/driver/dashboard"
              element={
                <ProtectedRoute userType="driver">
                  <DriverDashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/driver/trip-history"
              element={
                <ProtectedRoute userType="driver">
                  <DriverTripHistory />
                </ProtectedRoute>
              }
            />
            <Route
              path="/driver/earnings"
              element={
                <ProtectedRoute userType="driver">
                  <DriverEarnings />
                </ProtectedRoute>
              }
            />
            <Route
              path="/driver/profile"
              element={
                <ProtectedRoute userType="driver">
                  <DriverProfile />
                </ProtectedRoute>
              }
            />
            <Route
              path="/driver/vehicle-management"
              element={
                <ProtectedRoute userType="driver">
                  <DriverVehicleManagement />
                </ProtectedRoute>
              }
            />
            <Route
              path="/driver/support"
              element={
                <ProtectedRoute userType="driver">
                  <DriverSupport />
                </ProtectedRoute>
              }
            />
          </Routes>
        </Suspense>
      </div>
    </Router>
  );
};

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <AuthProvider>
          <NotificationProvider>
            <BookingProvider>
              <AppRoutes />
            </BookingProvider>
          </NotificationProvider>
        </AuthProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;
