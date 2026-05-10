import QRCode from 'qrcode';
import { Coupon } from '../models/Coupon.js';
import { CouponRedemption } from '../models/CouponRedemption.js';
import { AnalyticsEvent } from '../models/AnalyticsEvent.js';
import { AppError } from '../utils/AppError.js';
import { scoreRedemption, logFraud } from './fraud.service.js';

export async function createCoupon(payload, user) {
  const qrPayload = await QRCode.toDataURL(`${payload.code}:${Date.now()}`);
  return Coupon.create({
    ...payload,
    organizationId: user.organizationId,
    qrPayload,
    barcode: `CS-${payload.code}-${Math.floor(Math.random() * 999999)}`
  });
}

export async function listCoupons(query, user) {
  const filter = { organizationId: user.organizationId };
  if (query.status) filter.status = query.status;
  if (query.type) filter.type = query.type;
  if (query.search) filter.$text = { $search: query.search };
  return Coupon.find(filter).sort({ createdAt: -1 }).limit(100);
}
export async function getMyCoupons(user) {
  return CouponRedemption.find({ userId: user._id })
    .populate('couponId', 'title code vendor type value description expiresAt')
    .sort({ createdAt: -1 });
}

export async function claimCoupon(couponId, user, metadata) {
  const coupon = await Coupon.findById(couponId);
  if (!coupon) throw new AppError('Coupon not found', 404);
  validateCouponWindow(coupon);

  const fraud = await scoreRedemption({ user, coupon, ...metadata });
  if (fraud.riskScore >= 85) {
    await logFraud({
      organizationId: coupon.organizationId,
      userId: user._id,
      couponId: coupon._id,
      riskScore: fraud.riskScore,
      signals: fraud.signals,
      severity: fraud.severity,
      ip: metadata.ip,
      deviceId: metadata.deviceId,
      actionTaken: 'blocked'
    });
    await Coupon.updateOne({ _id: coupon._id }, { $inc: { 'counters.fraudBlocked': 1 } });
    throw new AppError('Coupon claim blocked by fraud controls', 403, fraud.signals);
  }

  const redemption = await CouponRedemption.create({
    organizationId: coupon.organizationId,
    couponId: coupon._id,
    userId: user._id,
    status: 'claimed',
    cartValue: metadata.cartValue,
    region: metadata.region,
    ip: metadata.ip,
    deviceId: metadata.deviceId,
    fraudScore: fraud.riskScore
  });

  await Promise.all([
    Coupon.updateOne({ _id: coupon._id }, { $inc: { 'counters.claimed': 1 } }),
    AnalyticsEvent.create({ organizationId: coupon.organizationId, userId: user._id, couponId: coupon._id, type: 'coupon_claimed', region: metadata.region })
  ]);

  return { redemption, fraud };
}

export async function redeemCoupon(couponId, user, metadata) {
  const coupon = await Coupon.findById(couponId);
  if (!coupon) throw new AppError('Coupon not found', 404);
  validateCouponWindow(coupon);

  const redemption = await CouponRedemption.findOne({ couponId, userId: user._id, status: 'claimed' });
  if (!redemption) throw new AppError('Claim coupon before redemption', 400);

  const discountApplied = calculateDiscount(coupon, metadata.cartValue);
  redemption.status = 'redeemed';
  redemption.redeemedAt = new Date();
  redemption.orderId = metadata.orderId;
  redemption.discountApplied = discountApplied;
  await redemption.save();

  await Promise.all([
    Coupon.updateOne({ _id: coupon._id }, { $inc: { 'counters.redeemed': 1 } }),
    AnalyticsEvent.create({
      organizationId: coupon.organizationId,
      userId: user._id,
      couponId: coupon._id,
      type: 'coupon_redeemed',
      revenueImpact: discountApplied,
      region: metadata.region
    })
  ]);

  return { redemption, discountApplied };
}

function validateCouponWindow(coupon) {
  const now = new Date();
  if (coupon.status !== 'active') throw new AppError('Coupon is not active', 400);
  if (coupon.startsAt > now || coupon.expiresAt < now) throw new AppError('Coupon is outside its valid window', 400);
  if (coupon.counters.claimed >= coupon.conditions.usageLimit) throw new AppError('Coupon usage limit reached', 409);
}

function calculateDiscount(coupon, cartValue) {
  if (coupon.type === 'percentage') {
    return Math.min(cartValue * (coupon.value / 100), coupon.conditions.maxDiscountValue ?? Infinity);
  }
  if (coupon.type === 'flat') return Math.min(coupon.value, cartValue);
  if (coupon.type === 'cashback' || coupon.type === 'wallet_cashback') return coupon.value;
  if (coupon.type === 'bogo') return Math.round(cartValue / 2);
  return coupon.value;
}

export async function deleteCoupon(couponId, user) {
  if (!couponId) throw new AppError('Coupon ID is required', 400);
  
  const coupon = await Coupon.findById(couponId);
  if (!coupon) {
    throw new AppError(`Coupon ${couponId} not found in database`, 404);
  }

  if (coupon.organizationId.toString() !== user.organizationId.toString()) {
    console.log(`Delete blocked: Coupon belongs to Org ${coupon.organizationId}, but user is in Org ${user.organizationId}`);
    throw new AppError('Unauthorized: Coupon belongs to another organization', 403);
  }

  await Promise.all([
    Coupon.deleteOne({ _id: couponId }),
    CouponRedemption.deleteMany({ couponId }),
    AnalyticsEvent.deleteMany({ couponId })
  ]);

  return { message: 'Coupon and related data deleted successfully' };
}

