import express from 'express';
import { authenticate } from '../middleware/auth.js';
import {
  startTracking,
  updateLocation,
  stopTracking,
  getTrackingStatus,
  getActiveRides,
  shareLiveLocation,
  triggerEmergency,
  getLocationHistory,
  batchUpdateLocation
} from '../controllers/trackingController.js';

const router = express.Router();

// All tracking routes require authentication
router.use(authenticate);

// Ride tracking management
router.post('/start', startTracking);
router.post('/stop', stopTracking);
router.get('/status/:rideId', getTrackingStatus);
router.get('/active', getActiveRides);

// Location updates
router.post('/location', updateLocation);
router.post('/location/batch', batchUpdateLocation);
router.post('/share-location', shareLiveLocation);

// Emergency and safety
router.post('/emergency', triggerEmergency);

// History and analytics
router.get('/history/:rideId', getLocationHistory);

export default router;
