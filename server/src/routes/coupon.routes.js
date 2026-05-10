import { Router } from 'express';
import { claimCoupon, createCoupon, listCoupons, redeemCoupon, myCoupons, deleteCoupon } from '../controllers/coupon.controller.js';
import { authenticate, authorize } from '../middleware/auth.js';
import { redemptionLimiter } from '../middleware/rateLimiter.js';

const router = Router();

router.use((req, res, next) => {
  console.log(`Router[Coupons] - Method: ${req.method}, Path: ${req.path}`);
  next();
});

router.use(authenticate);
router.get('/', listCoupons);
router.get('/my', myCoupons);
router.post('/', authorize('super_admin', 'business_admin', 'manager'), createCoupon);
router.post('/:id/claim', redemptionLimiter, claimCoupon);
router.post('/:id/redeem', redemptionLimiter, redeemCoupon);
router.delete('/remove/:id', authorize('super_admin', 'business_admin', 'manager'), deleteCoupon);

export default router;

