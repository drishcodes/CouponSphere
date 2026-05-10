import mongoose from 'mongoose';

const apiKeySchema = new mongoose.Schema({
  organizationId: { type: mongoose.Schema.Types.ObjectId, ref: 'Organization', required: true, index: true },
  name: String,
  keyHash: { type: String, required: true },
  scopes: [String],
  lastUsedAt: Date,
  revokedAt: Date
}, { timestamps: true });

export const ApiKey = mongoose.model('ApiKey', apiKeySchema);

