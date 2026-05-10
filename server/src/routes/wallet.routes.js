import { Router } from 'express';
import { myWallet } from '../controllers/wallet.controller.js';
import { authenticate } from '../middleware/auth.js';

const router = Router();
router.use(authenticate);
router.get('/', myWallet);

export default router;

