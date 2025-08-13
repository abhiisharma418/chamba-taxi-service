import express from 'express';
import { PromoCodeController } from '../controllers/promoCodeController.js';
import { authenticateToken } from '../middleware/auth.js';
import rateLimit from 'express-rate-limit';

const router = express.Router();

// Rate limiting for promo code validation
const validatePromoLimit = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 10, // 10 validations per minute
  message: {
    success: false,
    message: 'Too many promo code validation attempts. Please wait before trying again.'
  },
  standardHeaders: true,
  legacyHeaders: false
});

// Rate limiting for promo code application
const applyPromoLimit = rateLimit({
  windowMs: 5 * 60 * 1000, // 5 minutes
  max: 5, // 5 applications per 5 minutes
  message: {
    success: false,
    message: 'Too many promo code application attempts. Please wait before trying again.'
  },
  standardHeaders: true,
  legacyHeaders: false
});

// All promo code routes require authentication
router.use(authenticateToken);

// Admin-only middleware
const requireAdmin = (req, res, next) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({
      success: false,
      message: 'Admin access required'
    });
  }
  next();
};

// User routes
router.get('/available', PromoCodeController.getAvailablePromoCodes);
router.post('/validate', validatePromoLimit, PromoCodeController.validatePromoCode);
router.post('/apply', applyPromoLimit, PromoCodeController.applyPromoCode);

// Admin routes
router.post('/admin/create', requireAdmin, PromoCodeController.createPromoCode);
router.get('/admin/all', requireAdmin, PromoCodeController.getAllPromoCodes);
router.get('/admin/:id', requireAdmin, PromoCodeController.getPromoCodeById);
router.put('/admin/:id', requireAdmin, PromoCodeController.updatePromoCode);
router.delete('/admin/:id', requireAdmin, PromoCodeController.deletePromoCode);
router.get('/admin/analytics/overview', requireAdmin, PromoCodeController.getPromoCodeAnalytics);
router.post('/admin/bulk-update', requireAdmin, PromoCodeController.bulkUpdatePromoCodes);

export default router;
