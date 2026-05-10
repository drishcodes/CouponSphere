import mongoose from 'mongoose';

const fraudLogSchema = new mongoose.Schema({
  organizationId: { type: mongoose.Schema.Types.ObjectId, ref: 'Organization', index: true },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', index: true },
  couponId: { type: mongoose.Schema.Types.ObjectId, ref: 'Coupon', index: true },
  severity: { type: String, enum: ['low', 'medium', 'high', 'critical'], default: 'medium', index: true },
  riskScore: { type: Number, required: true, index: true },
  signals: [String],
  deviceId: String,
  ip: String,
  actionTaken: { type: String, enum: ['logged', 'captcha_required', 'otp_required', 'blocked'], default: 'logged' },
  metadata: mongoose.Schema.Types.Mixed
}, { timestamps: true });

fraudLogSchema.index({ organizationId: 1, createdAt: -1 });

export const FraudLog = mongoose.model('FraudLog', fraudLogSchema);

