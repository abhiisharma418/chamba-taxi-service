import express from 'express';
import {
  getVehicles,
  getVehicle,
  createVehicle,
  updateVehicle,
  deleteVehicle,
  uploadDocument,
  addServiceRecord,
  addInspectionRecord,
  getVehicleAlerts,
  toggleVehicleStatus,
  getVehicleStats
} from '../controllers/vehicleController.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

// All routes require authentication
router.use(authenticateToken);

// Vehicle CRUD routes
router.get('/', getVehicles);
router.post('/', createVehicle);
router.get('/stats', getVehicleStats);
router.get('/:vehicleId', getVehicle);
router.put('/:vehicleId', updateVehicle);
router.delete('/:vehicleId', deleteVehicle);

// Vehicle status routes
router.patch('/:vehicleId/status', toggleVehicleStatus);
router.get('/:vehicleId/alerts', getVehicleAlerts);

// Document routes
router.post('/:vehicleId/documents/upload', uploadDocument);

// Maintenance routes
router.post('/:vehicleId/service', addServiceRecord);
router.post('/:vehicleId/inspection', addInspectionRecord);

export default router;