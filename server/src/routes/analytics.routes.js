import { Router } from 'express';
import { overview, customerEarnings } from '../controllers/analytics.controller.js';
import { authenticate, authorize } from '../middleware/auth.js';

const router = Router();
router.use(authenticate, authorize('super_admin', 'business_admin', 'manager', 'analyst'));
router.get('/overview', overview);
router.get('/customers-earnings', customerEarnings);

export default router;

