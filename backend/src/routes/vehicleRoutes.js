import express from 'express';
import { authenticate, requireRoles } from '../middleware/auth.js';
import { createVehicle, listVehicles, updateVehicle, setAvailability } from '../controllers/vehicleController.js';

const router = express.Router();

router.use(authenticate);
router.get('/', listVehicles);
router.post('/', requireRoles('driver'), createVehicle);
router.patch('/:id', requireRoles('driver'), updateVehicle);
router.patch('/:id/availability', requireRoles('driver'), setAvailability);

export default router;