import { Router } from 'express';
import { list, buy, listings, earnings } from '../controllers/marketplace.controller.js';
import { authenticate } from '../middleware/auth.js';

const router = Router();
router.use(authenticate);

router.get('/listings', listings);
router.post('/list', list);
router.post('/buy/:redemptionId', buy);
router.get('/earnings', earnings);

export default router;
