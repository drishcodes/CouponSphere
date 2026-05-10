import rateLimit from 'express-rate-limit';

export const apiLimiter = rateLimit({
  windowMs: 60 * 1000,
  limit: 240,
  standardHeaders: true,
  legacyHeaders: false
});

export const redemptionLimiter = rateLimit({
  windowMs: 60 * 1000,
  limit: 12,
  message: { message: 'Too many redemption attempts. Please cool down.' }
});

