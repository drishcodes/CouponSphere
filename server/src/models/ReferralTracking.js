import mongoose from 'mongoose';

const referralTrackingSchema = new mongoose.Schema({
  organizationId: { type: mongoose.Schema.Types.ObjectId, ref: 'Organization', index: true },
  referrerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', index: true },
  referredUserId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', index: true },
  referralCode: String,
  rewardStatus: { type: String, enum: ['pending', 'qualified', 'paid', 'blocked'], default: 'pending' },
  fraudScore: Number
}, { timestamps: true });

export const ReferralTracking = mongoose.model('ReferralTracking', referralTrackingSchema);

