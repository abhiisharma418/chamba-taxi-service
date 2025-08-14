import express from 'express';
import { register, login, refresh, logout,getProfile } from '../controllers/authController.js';
import { authenticate } from '../middleware/auth.js';

const router = express.Router();

router.post('/register', register);
router.post('/login', login);
router.post('/refresh', refresh);
router.get('/profile', authenticate, getProfile);
router.post('/logout', authenticate, logout);

export default router;