import { logger } from '../config/logger.js';

export function notFound(req, _res, next) {
  const error = new Error(`Route not found: ${req.method} ${req.originalUrl}`);
  error.statusCode = 404;
  next(error);
}

export function errorHandler(error, _req, res, _next) {
  const statusCode = error.statusCode || 500;
  if (statusCode >= 500) logger.error(error);
  res.status(statusCode).json({
    message: error.message || 'Internal server error',
    details: error.details ?? undefined
  });
}

