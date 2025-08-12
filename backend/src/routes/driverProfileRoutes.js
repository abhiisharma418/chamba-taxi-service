import express from 'express';
import {
  getProfile,
  updateProfile,
  uploadDocument,
  getDocumentAlerts,
  verifyDocument,
  getProfileCompletion
} from '../controllers/driverProfileController.js';
import { authenticate } from '../middleware/auth.js';

const router = express.Router();

// All routes require authentication
router.use(authenticateToken);

// Profile routes
router.get('/', getProfile);
router.put('/', updateProfile);
router.get('/completion', getProfileCompletion);

// Document routes
router.post('/documents/upload', uploadDocument);
router.get('/documents/alerts', getDocumentAlerts);
router.post('/documents/verify', verifyDocument); // Admin only

module.exports = router;
