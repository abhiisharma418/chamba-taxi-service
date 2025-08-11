import express from 'express';
import { authenticate, requireRoles } from '../middleware/auth.js';
import { createPricing, listPricing, updatePricing, deletePricing } from '../controllers/pricingController.js';

const router = express.Router();

router.use(authenticate, requireRoles('admin'));
router.get('/', listPricing);
router.post('/', createPricing);
router.patch('/:id', updatePricing);
router.delete('/:id', deletePricing);

export default router;