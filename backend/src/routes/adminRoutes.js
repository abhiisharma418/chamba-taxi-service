import express from 'express';
import { authenticate, requireRoles } from '../middleware/auth.js';
import { getStats, listUsers, updateUserStatus } from '../controllers/adminController.js';

const router = express.Router();

router.use(authenticate, requireRoles('admin'));
router.get('/stats', getStats);
router.get('/users', listUsers);
router.patch('/users/:id', updateUserStatus);

export default router;