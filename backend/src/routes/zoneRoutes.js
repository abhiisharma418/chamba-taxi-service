import express from 'express';
import { authenticate, requireRoles } from '../middleware/auth.js';
import { createZone, listZones, updateZone, deleteZone } from '../controllers/zoneController.js';

const router = express.Router();

router.use(authenticate, requireRoles('admin'));
router.get('/', listZones);
router.post('/', createZone);
router.patch('/:id', updateZone);
router.delete('/:id', deleteZone);

export default router;