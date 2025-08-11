import express from 'express';
import { authenticate, requireRoles } from '../middleware/auth.js';
import { upload } from '../middleware/upload.js';
import { uploadDocuments, adminSetVerification } from '../controllers/driverController.js';

const router = express.Router();

router.post('/documents', authenticate, requireRoles('driver'), upload.array('documents', 5), uploadDocuments);
router.patch('/:id/verification', authenticate, requireRoles('admin'), adminSetVerification);

export default router;