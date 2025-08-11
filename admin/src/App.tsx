import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';

const Dashboard = React.lazy(() => import('./pages/admin/Dashboard'));
const Drivers = React.lazy(() => import('./pages/admin/Drivers'));
const Bookings = React.lazy(() => import('./pages/admin/Bookings'));
const Pricing = React.lazy(() => import('./pages/admin/Pricing'));
const Zones = React.lazy(() => import('./pages/admin/Zones'));

function App() {
  return (
    <Router>
      <React.Suspense fallback={<div className="p-8">Loading...</div>}>
        <Routes>
          <Route path="/" element={<Navigate to="/admin/dashboard" replace />} />
          <Route path="/admin/dashboard" element={<Dashboard />} />
          <Route path="/admin/drivers" element={<Drivers />} />
          <Route path="/admin/bookings" element={<Bookings />} />
          <Route path="/admin/pricing" element={<Pricing />} />
          <Route path="/admin/zones" element={<Zones />} />
        </Routes>
      </React.Suspense>
    </Router>
  );
}

export default App;
