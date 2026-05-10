import mongoose from 'mongoose';

const auditLogSchema = new mongoose.Schema({
  organizationId: { type: mongoose.Schema.Types.ObjectId, ref: 'Organization', index: true },
  actorId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', index: true },
  action: String,
  ip: String,
  userAgent: String,
  requestId: String,
  statusCode: Number
}, { timestamps: true });

export const AuditLog = mongoose.model('AuditLog', auditLogSchema);

