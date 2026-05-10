import mongoose from 'mongoose';

const deviceFingerprintSchema = new mongoose.Schema({
  fingerprint: { type: String, required: true, unique: true },
  userIds: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  ipAddresses: [String],
  userAgents: [String],
  riskScore: { type: Number, default: 0 },
  blocked: { type: Boolean, default: false }
}, { timestamps: true });

export const DeviceFingerprint = mongoose.model('DeviceFingerprint', deviceFingerprintSchema);

