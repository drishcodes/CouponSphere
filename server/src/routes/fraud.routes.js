import { Router } from 'express';
import { blacklist, logs } from '../controllers/fraud.controller.js';
import { authenticate, authorize } from '../middleware/auth.js';

const router = Router();
router.use(authenticate, authorize('super_admin', 'business_admin', 'analyst'));
router.get('/logs', logs);
router.post('/blacklist', blacklist);

export default router;

