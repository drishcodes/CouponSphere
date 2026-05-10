import { Router } from 'express';
import authRoutes from './auth.routes.js';
import couponRoutes from './coupon.routes.js';
import analyticsRoutes from './analytics.routes.js';
import fraudRoutes from './fraud.routes.js';
import campaignRoutes from './campaign.routes.js';
import walletRoutes from './wallet.routes.js';
import adminRoutes from './admin.routes.js';
import marketplaceRoutes from './marketplace.routes.js';

const router = Router();

router.use('/auth', authRoutes);
router.use('/coupons', couponRoutes);
router.use('/analytics', analyticsRoutes);
router.use('/fraud', fraudRoutes);
router.use('/campaigns', campaignRoutes);
router.use('/wallet', walletRoutes);
router.use('/admin', adminRoutes);
router.use('/marketplace', marketplaceRoutes);

export default router;

