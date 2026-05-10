import { env } from '../config/env.js';
import { CouponRedemption } from '../models/CouponRedemption.js';
import { DeviceFingerprint } from '../models/DeviceFingerprint.js';
import { FraudLog } from '../models/FraudLog.js';
import { User } from '../models/User.js';

export async function scoreRedemption({ user, coupon, deviceId, ip, cartValue }) {
  const [recentRedemptions, device, accountCount] = await Promise.all([
    CouponRedemption.countDocuments({ userId: user._id, createdAt: { $gte: new Date(Date.now() - 10 * 60 * 1000) } }),
    DeviceFingerprint.findOne({ fingerprint: deviceId }),
    User.countDocuments({ 'sessions.ip': ip })
  ]);

  const localSignals = [];
  if (recentRedemptions > 15) localSignals.push('rapid_redemption');
  if (device?.userIds?.length > 3) localSignals.push('duplicate_device_usage');
  if (accountCount > 5) localSignals.push('ip_abuse');
  if (cartValue < (coupon.conditions?.minimumOrderValue ?? 0)) localSignals.push('minimum_order_mismatch');

  let remote = { riskScore: 0, signals: [] };
  try {
    const response = await fetch(`${env.FRAUD_SERVICE_URL}/api/fraud/score`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        userId: user.id,
        couponCode: coupon.code,
        deviceId,
        ip,
        recentRedemptions,
        sharedDeviceUsers: device?.userIds?.length ?? 0,
        cartValue
      })
    });
    if (response.ok) remote = await response.json();
  } catch {
    remote = { riskScore: localSignals.length * 18, signals: ['fraud_service_unavailable'] };
  }

  const signals = [...new Set([...localSignals, ...(remote.signals ?? [])])];
  let riskScore = Math.round(remote.riskScore + localSignals.length * 14);
  riskScore = Math.min(100, riskScore);
  const severity = riskScore > 85 ? 'critical' : riskScore > 65 ? 'high' : riskScore > 35 ? 'medium' : 'low';
  return { riskScore, signals, severity };
}

export async function logFraud(event) {
  return FraudLog.create(event);
}
