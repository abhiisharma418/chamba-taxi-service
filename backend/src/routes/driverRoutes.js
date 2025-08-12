import express from 'express';
import { authenticate, requireRoles } from '../middleware/auth.js';
import { upload } from '../middleware/upload.js';
import {
  uploadDocuments,
  adminSetVerification,
  getDriverEarnings,
  getEarningsBreakdown,
  getEarningsHistory
} from '../controllers/driverController.js';

const router = express.Router();

router.post('/documents', authenticate, requireRoles('driver'), upload.array('documents', 5), uploadDocuments);
router.patch('/:id/verification', authenticate, requireRoles('admin'), adminSetVerification);

// Earnings routes
router.get('/earnings', authenticate, requireRoles('driver'), getDriverEarnings);
router.get('/earnings/breakdown', authenticate, requireRoles('driver'), getEarningsBreakdown);
router.get('/earnings/history', authenticate, requireRoles('driver'), getEarningsHistory);

export default router;
