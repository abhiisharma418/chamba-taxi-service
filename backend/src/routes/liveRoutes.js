import express from 'express';
import { authenticate, requireRoles } from '../middleware/auth.js';
import { driverHeartbeat, driverSetAvailability, dispatchNearestDriver } from '../controllers/liveController.js';

const router = express.Router();

router.post('/driver/heartbeat', authenticate, requireRoles('driver'), driverHeartbeat);
router.post('/driver/availability', authenticate, requireRoles('driver'), driverSetAvailability);
router.post('/dispatch/search', authenticate, requireRoles('admin', 'customer'), dispatchNearestDriver);

export default router;