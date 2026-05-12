import { Router } from 'express';
import Joi from 'joi';
import { login, logout, refresh, register } from '../controllers/auth.controller.js';
import { authenticate } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';

const router = Router();

router.post('/register', validate(Joi.object({
  body: Joi.object({
    name: Joi.string().required(),
    email: Joi.string().email().required(),
    password: Joi.string().min(8).required(),
    organizationId: Joi.string().optional(),
    role: Joi.string().valid('customer', 'business_admin').optional()
  }),
  query: Joi.object(),
  params: Joi.object()
})), register);
router.post('/login', login);
router.post('/refresh', refresh);
router.post('/logout', authenticate, logout);
router.get('/me', authenticate, (req, res) => res.json(req.user));

export default router;

