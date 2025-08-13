import React, { Suspense } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './contexts/AuthContext';
import Layout from './components/Layout';
import { AdminPageSkeleton } from './components/LoadingSkeletons';
import { useCodeSplitting, usePerformanceMonitoring } from './hooks/useCodeSplitting';

// Lazy load pages for better performance
const Login = React.lazy(() => import('./pages/Login'));
const Dashboard = React.lazy(() => import('./pages/Dashboard'));
const UserManagement = React.lazy(() => import('./pages/UserManagement'));
const LiveRideMonitoring = React.lazy(() => import('./pages/LiveRideMonitoring'));
const FinancialManagement = React.lazy(() => import('./pages/FinancialManagement'));
const SupportManagement = React.lazy(() => import('./pages/SupportManagement'));
const FinancialReporting = React.lazy(() => import('./pages/FinancialReporting'));
const PromoCodeManagement = React.lazy(() => import('./pages/PromoCodeManagement'));
const EmergencyManagement = React.lazy(() => import('./pages/EmergencyManagement'));
const ScheduledRidesManagement = React.lazy(() => import('./pages/ScheduledRidesManagement'));

function App() {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-slate-600 text-lg">Loading Admin Portal...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Login />;
  }

  return (
    <Layout>
      <Routes>
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/users" element={<UserManagement />} />
        <Route path="/rides" element={<LiveRideMonitoring />} />
        <Route path="/support" element={<SupportManagement />} />
        <Route path="/promo-codes" element={<PromoCodeManagement />} />
        <Route path="/financial-reports" element={<FinancialReporting />} />
        <Route path="/financial" element={<FinancialManagement />} />
        <Route path="/emergency" element={<EmergencyManagement />} />
        <Route path="/scheduled-rides" element={<ScheduledRidesManagement />} />
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </Layout>
  );
}

export default App;
