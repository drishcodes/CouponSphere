import mongoose from 'mongoose';

const couponRedemptionSchema = new mongoose.Schema({
  organizationId: { type: mongoose.Schema.Types.ObjectId, ref: 'Organization', index: true },
  couponId: { type: mongoose.Schema.Types.ObjectId, ref: 'Coupon', required: true, index: true },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  orderId: String,
  status: { type: String, enum: ['claimed', 'redeemed', 'blocked', 'expired', 'for_sale'], default: 'claimed', index: true },
  price: { type: Number, default: 0 },
  cartValue: Number,
  discountApplied: Number,
  region: String,
  deviceId: String,
  ip: String,
  fraudScore: { type: Number, default: 0 },
  claimedAt: { type: Date, default: Date.now },
  redeemedAt: Date
}, { timestamps: true });

couponRedemptionSchema.index({ couponId: 1, userId: 1, status: 1 });
couponRedemptionSchema.index({ organizationId: 1, createdAt: -1 });

export const CouponRedemption = mongoose.model('CouponRedemption', couponRedemptionSchema);

