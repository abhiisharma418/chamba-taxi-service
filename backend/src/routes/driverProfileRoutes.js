const express = require('express');
const router = express.Router();
const {
  getProfile,
  updateProfile,
  uploadDocument,
  getDocumentAlerts,
  verifyDocument,
  getProfileCompletion
} = require('../controllers/driverProfileController');
const { authenticateToken } = require('../middleware/auth');

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
