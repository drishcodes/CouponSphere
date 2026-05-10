import bcrypt from 'bcryptjs';
import mongoose from 'mongoose';

const sessionSchema = new mongoose.Schema({
  refreshTokenHash: String,
  deviceId: String,
  ip: String,
  userAgent: String,
  expiresAt: Date,
  revokedAt: Date
}, { _id: false, timestamps: true });

const userSchema = new mongoose.Schema({
  organizationId: { type: mongoose.Schema.Types.ObjectId, ref: 'Organization', index: true },
  name: { type: String, required: true, trim: true },
  email: { type: String, required: true, unique: true, lowercase: true, index: true },
  passwordHash: { type: String, required: true, select: false },
  role: { type: String, enum: ['super_admin', 'business_admin', 'manager', 'analyst', 'customer'], default: 'customer', index: true },
  status: { type: String, enum: ['active', 'pending_verification', 'blocked'], default: 'active', index: true },
  emailVerifiedAt: Date,
  phone: String,
  loyaltyPoints: { type: Number, default: 0 },
  referralCode: { type: String, unique: true, sparse: true },
  socialProviders: [{ provider: String, providerId: String }],
  twoFactor: {
    enabled: { type: Boolean, default: false },
    secret: String
  },
  security: {
    failedLoginCount: { type: Number, default: 0 },
    tokenVersion: { type: Number, default: 0 },
    ipAllowlist: [String],
    lastLoginAt: Date
  },
  sessions: [sessionSchema]
}, { timestamps: true });

userSchema.index({ organizationId: 1, role: 1 });
userSchema.methods.comparePassword = function comparePassword(password) {
  return bcrypt.compare(password, this.passwordHash);
};
userSchema.statics.hashPassword = function hashPassword(password) {
  return bcrypt.hash(password, 12);
};

export const User = mongoose.model('User', userSchema);

