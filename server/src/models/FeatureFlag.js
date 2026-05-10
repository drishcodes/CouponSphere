import mongoose from 'mongoose';

const featureFlagSchema = new mongoose.Schema({
  key: { type: String, required: true, unique: true },
  enabled: { type: Boolean, default: false },
  organizations: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Organization' }],
  rules: mongoose.Schema.Types.Mixed
}, { timestamps: true });

export const FeatureFlag = mongoose.model('FeatureFlag', featureFlagSchema);

