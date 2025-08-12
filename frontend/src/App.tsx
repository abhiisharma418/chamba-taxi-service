import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { BookingProvider } from './contexts/BookingContext';
import { NotificationProvider } from './contexts/NotificationContext';
import { ThemeProvider } from './contexts/ThemeContext';

// Pages
import LandingPage from './pages/LandingPage';
import Login from './pages/Login';
import Signup from './pages/SignUp';
import CustomerDashboard from './pages/customer/Dashboard';
import CustomerBookRide from './pages/customer/BookRide';
import CustomerHistory from './pages/customer/History';
import DriverDashboard from './pages/driver/Dashboard';
import DriverRides from './pages/driver/Rides';

// Components
import ProtectedRoute from './components/ProtectedRoute';

function App() {
  return (
    <AuthProvider>
      <NotificationProvider>
        <BookingProvider>
          <Router>
            <div className="min-h-screen bg-gray-50">
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
              </Routes>
            </div>
          </Router>
        </BookingProvider>
      </NotificationProvider>
    </AuthProvider>
  );
}

export default App;
