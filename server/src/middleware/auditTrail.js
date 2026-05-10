import { AuditLog } from '../models/AuditLog.js';

const trackedMethods = new Set(['POST', 'PUT', 'PATCH', 'DELETE']);

export function auditTrail(req, res, next) {
  res.on('finish', () => {
    if (!trackedMethods.has(req.method) || res.statusCode >= 500) return;
    AuditLog.create({
      actorId: req.user?._id,
      organizationId: req.user?.organizationId,
      action: `${req.method} ${req.originalUrl}`,
      ip: req.ip,
      userAgent: req.headers['user-agent'],
      requestId: req.requestId,
      statusCode: res.statusCode
    }).catch(() => {});
  });
  next();
}

