import mongoose from 'mongoose';

const organizationSchema = new mongoose.Schema({
  name: { type: String, required: true },
  slug: { type: String, required: true, unique: true, index: true },
  plan: { type: String, enum: ['starter', 'growth', 'enterprise'], default: 'starter' },
  status: { type: String, enum: ['active', 'trialing', 'suspended'], default: 'trialing' },
  industry: String,
  billingEmail: String,
  settings: {
    enforceCaptcha: { type: Boolean, default: true },
    requireOtpForRedemption: { type: Boolean, default: false },
    fraudAutoBlockThreshold: { type: Number, default: 82 },
    allowedRegions: [String],
    webhookUrl: String
  }
}, { timestamps: true });

export const Organization = mongoose.model('Organization', organizationSchema);

