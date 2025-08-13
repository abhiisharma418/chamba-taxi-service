import express from 'express';
import { authenticate, requireRoles } from '../middleware/auth.js';
import {
  getDriverDocuments,
  updateDocumentStatus,
  updateDriverVerificationStatus,
  getPendingVerifications,
  bulkUpdateDocuments,
  getVerificationStats
} from '../controllers/driverDocumentController.js';

const router = express.Router();

// Apply authentication to all routes
router.use(authenticate);

// Get driver documents (admin only)
router.get('/:driverId/documents', requireRoles('admin'), getDriverDocuments);

// Update document status (admin only)
router.put('/:driverId/documents/:documentId/status', requireRoles('admin'), updateDocumentStatus);

// Update driver verification status (admin only)
router.put('/:driverId/verification-status', requireRoles('admin'), updateDriverVerificationStatus);

// Get pending verifications (admin only)
router.get('/pending-verifications', requireRoles('admin'), getPendingVerifications);

// Bulk update documents (admin only)
router.put('/bulk-update', requireRoles('admin'), bulkUpdateDocuments);

// Get verification statistics (admin only)
router.get('/verification-stats', requireRoles('admin'), getVerificationStats);

export default router;
