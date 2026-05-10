import { Router } from 'express';
import { createCampaign, listCampaigns } from '../controllers/campaign.controller.js';
import { authenticate, authorize } from '../middleware/auth.js';

const router = Router();
router.use(authenticate, authorize('super_admin', 'business_admin', 'manager'));
router.get('/', listCampaigns);
router.post('/', createCampaign);

export default router;

