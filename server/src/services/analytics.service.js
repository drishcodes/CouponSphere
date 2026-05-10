import { AnalyticsEvent } from '../models/AnalyticsEvent.js';
import { Coupon } from '../models/Coupon.js';
import { CouponRedemption } from '../models/CouponRedemption.js';
import { FraudLog } from '../models/FraudLog.js';
import { User } from '../models/User.js';

export async function getOverview(user) {
  const org = user.organizationId;
  const [activeCoupons, redemptions, fraudAttempts, customers, revenueImpact, topCampaigns, regionStats] = await Promise.all([
    Coupon.countDocuments({ organizationId: org, status: 'active' }),
    CouponRedemption.countDocuments({ organizationId: org, status: 'redeemed' }),
    FraudLog.countDocuments({ organizationId: org }),
    User.countDocuments({ organizationId: org, role: 'customer' }),
    AnalyticsEvent.aggregate([
      { $match: { organizationId: org, type: 'coupon_redeemed' } },
      { $group: { _id: null, total: { $sum: '$revenueImpact' } } }
    ]),
    Coupon.find({ organizationId: org }).sort({ 'counters.redeemed': -1 }).limit(5).select('title code counters type'),
    AnalyticsEvent.aggregate([
      { $match: { organizationId: org, region: { $exists: true } } },
      { $group: { _id: '$region', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 8 }
    ])
  ]);

  return {
    activeCoupons,
    redemptions,
    fraudAttempts,
    customers,
    revenueImpact: revenueImpact[0]?.total ?? 0,
    conversionRate: activeCoupons ? Math.round((redemptions / (redemptions + activeCoupons)) * 100) : 0,
    topCampaigns,
    regionStats
  };
}

export async function getCustomerEarnings(user) {
  const org = user.organizationId;
  const { Wallet } = await import('../models/Wallet.js');
  return Wallet.aggregate([
    {
      $lookup: {
        from: 'users',
        localField: 'userId',
        foreignField: '_id',
        as: 'user'
      }
    },
    { $unwind: '$user' },
    { $match: { 'user.organizationId': org, 'user.role': 'customer' } },
    { $unwind: '$ledger' },
    { $match: { 'ledger.type': 'marketplace_earnings' } },
    {
      $group: {
        _id: '$userId',
        userName: { $first: '$user.name' },
        userEmail: { $first: '$user.email' },
        totalEarned: { $sum: '$ledger.amount' },
        transactionCount: { $sum: 1 }
      }
    },
    { $sort: { totalEarned: -1 } }
  ]);
}

