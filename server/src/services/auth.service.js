import crypto from 'crypto';
import { nanoid } from 'nanoid';
import { User } from '../models/User.js';
import { Wallet } from '../models/Wallet.js';
import { AppError } from '../utils/AppError.js';
import { signAccessToken, signRefreshToken, verifyRefreshToken } from '../utils/tokens.js';

const hashToken = (token) => crypto.createHash('sha256').update(token).digest('hex');

export async function register({ name, email, password, organizationId, role = 'customer' }) {
  const existing = await User.findOne({ email });
  if (existing) throw new AppError('Email already registered', 409);

  let targetOrgId = organizationId;
  if (!targetOrgId) {
    const { Organization } = await import('../models/Organization.js');
    const defaultOrg = await Organization.findOne();
    targetOrgId = defaultOrg?._id;
  }

  const user = await User.create({
    name,
    email,
    organizationId: targetOrgId,
    role,
    referralCode: nanoid(10).toUpperCase(),
    passwordHash: await User.hashPassword(password)
  });
  await Wallet.create({ userId: user._id });
  return issueSession(user);
}

export async function login({ email, password, deviceId, ip, userAgent }) {
  const user = await User.findOne({ email }).select('+passwordHash');
  if (!user || !(await user.comparePassword(password))) throw new AppError('Invalid credentials', 401);
  if (user.status === 'blocked') throw new AppError('Account is blocked', 403);
  user.security.lastLoginAt = new Date();
  const session = issueSession(user, { deviceId, ip, userAgent });
  user.sessions.push({
    refreshTokenHash: hashToken(session.refreshToken),
    deviceId,
    ip,
    userAgent,
    expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
  });
  await user.save();
  return session;
}

export async function refresh(refreshToken) {
  const payload = verifyRefreshToken(refreshToken);
  const user = await User.findById(payload.sub);
  if (!user || user.security.tokenVersion !== payload.tokenVersion) throw new AppError('Invalid refresh token', 401);
  return issueSession(user);
}

export async function logout(userId, refreshToken) {
  if (!refreshToken) return;
  await User.updateOne(
    { _id: userId, 'sessions.refreshTokenHash': hashToken(refreshToken) },
    { $set: { 'sessions.$.revokedAt': new Date() } }
  );
}

function issueSession(user) {
  return {
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      organizationId: user.organizationId
    },
    accessToken: signAccessToken(user),
    refreshToken: signRefreshToken(user, user.security?.tokenVersion ?? 0)
  };
}

