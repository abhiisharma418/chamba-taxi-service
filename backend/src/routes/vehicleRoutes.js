const express = require('express');
const router = express.Router();
const {
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
} = require('../controllers/vehicleController');
const { authenticateToken } = require('../middleware/auth');

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

module.exports = router;
