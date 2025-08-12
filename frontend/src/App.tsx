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
const Login = React.lazy(() => import('./pages/Login'));
const Signup = React.lazy(() => import('./pages/SignUp'));

// Customer pages
const CustomerDashboard = React.lazy(() => import('./pages/customer/Dashboard'));
const CustomerBookRide = React.lazy(() => import('./pages/customer/BookRide'));
const CustomerHistory = React.lazy(() => import('./pages/customer/History'));
const CustomerLiveTracking = React.lazy(() => import('./pages/customer/LiveTracking'));

// Driver pages
const DriverDashboard = React.lazy(() => import('./pages/driver/Dashboard'));
const DriverRides = React.lazy(() => import('./pages/driver/Rides'));
const DriverEarnings = React.lazy(() => import('./pages/driver/Earnings'));
const DriverProfile = React.lazy(() => import('./pages/driver/Profile'));

// Admin pages (for future use)
const AdminDashboard = React.lazy(() => import('./admin/src/pages/Dashboard'));
const AdminLogin = React.lazy(() => import('./admin/src/pages/Login'));

function App() {
  // Initialize code splitting and performance monitoring
  useCodeSplitting();
  usePerformanceMonitoring();

  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <AuthProvider>
          <NotificationProvider>
            <BookingProvider>
              <Router>
                <div className="min-h-screen bg-gray-50 dark:bg-dark-surface transition-colors duration-200">
                  <Suspense fallback={<PageSkeleton />}>
                    <Routes>
                      {/* Public Routes */}
                      <Route path="/" element={<LandingPage />} />
                      <Route path="/login" element={<Login />} />
                      <Route path="/signup" element={<Signup />} />

                      {/* Customer Routes */}
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
                        path="/driver/rides"
                        element={
                          <ProtectedRoute userType="driver">
                            <DriverRides />
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
                    </Routes>
                  </Suspense>
                </div>
              </Router>
            </BookingProvider>
          </NotificationProvider>
        </AuthProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;
