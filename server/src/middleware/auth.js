import { User } from '../models/User.js';
import { AppError } from '../utils/AppError.js';
import { verifyAccessToken } from '../utils/tokens.js';

export async function authenticate(req, _res, next) {
  const header = req.headers.authorization;
  const token = header?.startsWith('Bearer ') ? header.slice(7) : null;
  if (!token) return next(new AppError('Authentication required', 401));

  try {
    const payload = verifyAccessToken(token);
    const user = await User.findById(payload.sub).select('-passwordHash');
    if (!user || user.status !== 'active') {
      console.log('Auth Failed: User not found or inactive', payload.sub);
      throw new AppError('Invalid session', 401);
    }
    req.user = user;
    next();
  } catch (error) {
    console.log('Auth Error:', error.message, 'for token snippet:', token.slice(0, 10) + '...');
    next(error.statusCode ? error : new AppError('Invalid or expired token', 401));
  }
}

export function authorize(...roles) {
  return (req, _res, next) => {
    if (!roles.includes(req.user?.role)) return next(new AppError('Insufficient permissions', 403));
    next();
  };
}

