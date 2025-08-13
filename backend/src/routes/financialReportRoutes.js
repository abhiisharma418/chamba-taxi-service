import express from 'express';
import { FinancialReportController } from '../controllers/financialReportController.js';
import { authenticateToken } from '../middleware/auth.js';
import rateLimit from 'express-rate-limit';

const router = express.Router();

// Rate limiting for report generation
const reportGenerationLimit = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // 5 reports per 15 minutes
  message: {
    success: false,
    message: 'Too many reports generated. Please wait before generating another report.'
  },
  standardHeaders: true,
  legacyHeaders: false
});

// All financial report routes require authentication
router.use(authenticateToken);

// Admin-only middleware
const requireAdmin = (req, res, next) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({
      success: false,
      message: 'Admin access required'
    });
  }
  next();
};

// Financial dashboard data (admin only)
router.get('/dashboard', requireAdmin, FinancialReportController.getFinancialDashboard);

// Report management routes (admin only)
router.post('/reports/generate', requireAdmin, reportGenerationLimit, FinancialReportController.generateReport);
router.get('/reports', requireAdmin, FinancialReportController.listReports);
router.get('/reports/:reportId/status', requireAdmin, FinancialReportController.getReportStatus);
router.get('/reports/:reportId/download/:format', requireAdmin, FinancialReportController.downloadReport);

export default router;
