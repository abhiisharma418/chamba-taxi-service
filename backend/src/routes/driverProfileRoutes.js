import express from 'express';
import { authenticate } from '../middleware/auth.js';
import {
  getDriverProfile,
  updateDriverProfile,
  uploadDocument,
  getDriverEarnings,
  getDriverStats,
  upload
} from '../controllers/driverProfileController.js';

const router = express.Router();

// All routes require authentication
router.use(authenticate);

// Profile routes
router.get('/profile', getDriverProfile);
router.put('/profile', updateDriverProfile);

// Document upload
router.post('/upload-document', upload.single('document'), uploadDocument);

// Earnings and statistics
router.get('/earnings', getDriverEarnings);
router.get('/stats', getDriverStats);

export default router;
