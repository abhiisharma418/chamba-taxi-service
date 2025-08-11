import express from 'express';
import { authenticate } from '../middleware/auth.js';
import { registerDevice, unregisterDevice } from '../controllers/deviceController.js';

const router = express.Router();
router.use(authenticate);
router.post('/register', registerDevice);
router.post('/unregister', unregisterDevice);

export default router;