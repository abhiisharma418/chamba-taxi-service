import express from 'express';
import { authenticate, requireRoles } from '../middleware/auth.js';
import {
  getStats,
  listUsers,
  updateUserStatus,
  getRides,
  updateRideStatus,
  getDrivers,
  approveDriver,
  suspendDriver,
  getCustomers,
  getPricing,
  updatePricing
} from '../controllers/adminController.js';

import {
  getAnalyticsDashboard,
  getRideAnalytics,
  getUserAnalytics,
  getFinancialAnalytics,
  getOperationalAnalytics,
  generateCustomReport
} from '../controllers/adminAnalyticsController.js';

const router = express.Router();

router.use(authenticate, requireRoles('admin'));

// Dashboard stats
router.get('/stats', getStats);

// Users management
router.get('/users', listUsers);
router.patch('/users/:id', updateUserStatus);

// Rides management
router.get('/rides', getRides);
router.put('/rides/:id/status', updateRideStatus);

// Drivers management
router.get('/drivers', getDrivers);
router.put('/drivers/:id/approve', approveDriver);
router.put('/drivers/:id/suspend', suspendDriver);

// Customers management
router.get('/customers', getCustomers);

// Pricing management
router.get('/pricing', getPricing);
router.put('/pricing', updatePricing);

// Analytics
router.get('/analytics/dashboard', getAnalyticsDashboard);
router.get('/analytics/rides', getRideAnalytics);
router.get('/analytics/users', getUserAnalytics);
router.get('/analytics/financial', getFinancialAnalytics);
router.get('/analytics/operational', getOperationalAnalytics);
router.post('/analytics/reports', generateCustomReport);

export default router;
