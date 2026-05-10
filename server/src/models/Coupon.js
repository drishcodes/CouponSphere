import mongoose from 'mongoose';

const conditionSchema = new mongoose.Schema({
  minimumOrderValue: { type: Number, default: 0 },
  maxDiscountValue: Number,
  usageLimit: { type: Number, default: 1000 },
  perUserLimit: { type: Number, default: 1 },
  deviceRestricted: { type: Boolean, default: true },
  regions: [String],
  categories: [String],
  productIds: [String],
  validDays: [String],
  timeWindow: {
    startHour: Number,
    endHour: Number
  }
}, { _id: false });

const couponSchema = new mongoose.Schema({
  organizationId: { type: mongoose.Schema.Types.ObjectId, ref: 'Organization', required: true, index: true },
  campaignId: { type: mongoose.Schema.Types.ObjectId, ref: 'Campaign', index: true },
  vendor: { type: String, default: 'UrbanBite', index: true },
  title: { type: String, required: true },
  code: { type: String, required: true, uppercase: true, trim: true },
  description: String,
  type: {
    type: String,
    enum: ['percentage', 'flat', 'bogo', 'cashback', 'category', 'geo', 'flash', 'personalized', 'first_time', 'referral', 'subscription', 'wallet_cashback'],
    required: true,
    index: true
  },
  value: { type: Number, required: true },
  imageUrl: String,
  qrPayload: String,
  barcode: String,
  status: { type: String, enum: ['draft', 'scheduled', 'active', 'paused', 'expired'], default: 'draft', index: true },
  startsAt: { type: Date, required: true, index: true },
  expiresAt: { type: Date, required: true, index: true },
  dynamicExpiryMinutes: Number,
  ai: {
    segment: String,
    predictedConversion: Number,
    recommendedDiscount: Number,
    personalizationTags: [String]
  },
  conditions: conditionSchema,
  counters: {
    claimed: { type: Number, default: 0 },
    redeemed: { type: Number, default: 0 },
    fraudBlocked: { type: Number, default: 0 }
  }
}, { timestamps: true });

couponSchema.index({ organizationId: 1, code: 1 }, { unique: true });
couponSchema.index({ title: 'text', description: 'text', code: 'text' });

export const Coupon = mongoose.model('Coupon', couponSchema);

