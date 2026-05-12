import QRCode from 'qrcode';
import { Coupon } from '../models/Coupon.js';
import { CouponRedemption } from '../models/CouponRedemption.js';
import { AnalyticsEvent } from '../models/AnalyticsEvent.js';
import { AppError } from '../utils/AppError.js';
import { User } from '../models/User.js';
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

  // If user is a customer, apply prerequisite filtering
  if (user.role === 'customer') {
    const stats = await getUserStats(user);
    filter.$and = filter.$and || [];
    filter.$and.push({
      $or: [
        { 'conditions.prerequisites': { $exists: false } },
        {
          $and: [
            { $or: [{ 'conditions.prerequisites.minLoyaltyPoints': { $exists: false } }, { 'conditions.prerequisites.minLoyaltyPoints': { $lte: user.loyaltyPoints || 0 } }] },
            { $or: [{ 'conditions.prerequisites.minPastRedemptions': { $exists: false } }, { 'conditions.prerequisites.minPastRedemptions': { $lte: stats.pastRedemptions } }] },
            { $or: [{ 'conditions.prerequisites.accountAgeDays': { $exists: false } }, { 'conditions.prerequisites.accountAgeDays': { $lte: stats.accountAgeDays } }] }
          ]
        }
      ]
    });
    // If no explicit $and were added before, we can simplify, but this is robust.
  }

  return Coupon.find(filter).sort({ createdAt: -1 }).limit(100);
}

async function getUserStats(user) {
  const accountAgeDays = Math.floor((Date.now() - new Date(user.createdAt).getTime()) / (1000 * 60 * 60 * 24));
  const pastRedemptions = await CouponRedemption.countDocuments({ userId: user._id, status: 'redeemed' });
  return { accountAgeDays, pastRedemptions };
}
export async function getMyCoupons(user) {
  return CouponRedemption.find({ userId: user._id })
    .populate('couponId', 'title code vendor type value description expiresAt')
    .sort({ createdAt: -1 });
}

export async function claimCoupon(couponId, user, metadata) {
  const coupon = await Coupon.findById(couponId);
  if (!coupon) throw new AppError('Coupon not found', 404);

  const stats = await getUserStats(user);
  validateCouponEligibility(coupon, user, stats);

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
  
  const stats = await getUserStats(user);
  validateCouponEligibility(coupon, user, stats);

  const redemption = await CouponRedemption.findOne({ couponId, userId: user._id, status: 'claimed' });
  if (!redemption) throw new AppError('Claim coupon before redemption', 400);

  const discountApplied = calculateDiscount(coupon, metadata.cartValue);
  const pointsEarned = Math.floor(metadata.cartValue / 10); // 1 point per $10 spent

  redemption.status = 'redeemed';
  redemption.redeemedAt = new Date();
  redemption.orderId = metadata.orderId;
  redemption.discountApplied = discountApplied;
  await redemption.save();

  await Promise.all([
    Coupon.updateOne({ _id: coupon._id }, { $inc: { 'counters.redeemed': 1 } }),
    User.updateOne({ _id: user._id }, { $inc: { loyaltyPoints: pointsEarned } }),
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

function validateCouponEligibility(coupon, user, stats) {
  const now = new Date();
  if (coupon.status !== 'active') throw new AppError('Coupon is not active', 400);
  if (coupon.startsAt > now || coupon.expiresAt < now) throw new AppError('Coupon is outside its valid window', 400);
  if (coupon.counters.claimed >= (coupon.conditions.usageLimit || 1000)) throw new AppError('Coupon usage limit reached', 409);

  // Check prerequisites
  if (coupon.conditions.prerequisites) {
    const { minLoyaltyPoints, minPastRedemptions, accountAgeDays } = coupon.conditions.prerequisites;
    
    if (minLoyaltyPoints && user.loyaltyPoints < minLoyaltyPoints) {
      throw new AppError(`Ineligible: Requires ${minLoyaltyPoints} loyalty points.`, 403);
    }
    if (minPastRedemptions && stats.pastRedemptions < minPastRedemptions) {
      throw new AppError(`Ineligible: Requires ${minPastRedemptions} previous successful redemptions.`, 403);
    }
    if (accountAgeDays && stats.accountAgeDays < accountAgeDays) {
      throw new AppError(`Ineligible: Account must be at least ${accountAgeDays} days old.`, 403);
    }
  }
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

