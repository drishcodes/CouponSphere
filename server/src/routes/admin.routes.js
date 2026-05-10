import { Router } from 'express';
import { auditLogs, platformOverview, getUsers, exportReport } from '../controllers/admin.controller.js';
import { authenticate, authorize } from '../middleware/auth.js';

const router = Router();
router.use(authenticate);
router.get('/platform', authorize('super_admin'), platformOverview);
router.get('/audit-logs', authorize('super_admin', 'business_admin'), auditLogs);
router.get('/users', authorize('super_admin', 'business_admin'), getUsers);
router.get('/export', authorize('super_admin', 'business_admin'), exportReport);

export default router;

