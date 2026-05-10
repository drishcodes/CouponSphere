import mongoose from 'mongoose';

const campaignSchema = new mongoose.Schema({
  organizationId: { type: mongoose.Schema.Types.ObjectId, ref: 'Organization', required: true, index: true },
  name: { type: String, required: true },
  objective: { type: String, enum: ['conversion', 'retention', 'reactivation', 'referral', 'flash_sale'], default: 'conversion' },
  status: { type: String, enum: ['draft', 'running', 'paused', 'completed'], default: 'draft', index: true },
  startsAt: Date,
  endsAt: Date,
  budget: Number,
  audience: {
    segments: [String],
    regions: [String],
    minLifetimeValue: Number
  },
  abTests: [{
    name: String,
    couponId: { type: mongoose.Schema.Types.ObjectId, ref: 'Coupon' },
    trafficSplit: Number
  }]
}, { timestamps: true });

export const Campaign = mongoose.model('Campaign', campaignSchema);

