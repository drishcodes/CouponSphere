import mongoose from 'mongoose';

const analyticsEventSchema = new mongoose.Schema({
  organizationId: { type: mongoose.Schema.Types.ObjectId, ref: 'Organization', index: true },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', index: true },
  couponId: { type: mongoose.Schema.Types.ObjectId, ref: 'Coupon', index: true },
  type: { type: String, required: true, index: true },
  region: String,
  deviceId: String,
  revenueImpact: Number,
  metadata: mongoose.Schema.Types.Mixed
}, { timestamps: true });

analyticsEventSchema.index({ organizationId: 1, type: 1, createdAt: -1 });

export const AnalyticsEvent = mongoose.model('AnalyticsEvent', analyticsEventSchema);

