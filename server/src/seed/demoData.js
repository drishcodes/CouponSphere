import { Campaign } from '../models/Campaign.js';
import { Coupon } from '../models/Coupon.js';
import { FraudLog } from '../models/FraudLog.js';
import { Organization } from '../models/Organization.js';
import { User } from '../models/User.js';
import { Wallet } from '../models/Wallet.js';

export async function ensureDemoData() {
  const existing = await Organization.findOne({ slug: 'urbanbite' });
  if (existing) return existing;

  const org = await Organization.create({
    name: 'UrbanBite Commerce',
    slug: 'urbanbite',
    plan: 'enterprise',
    status: 'active',
    industry: 'Food delivery'
  });

  const passwordHash = await User.hashPassword('Password123!');
  const [superAdmin, admin, customer, customer2, customer3] = await User.create([
    { name: 'Avery Platform', email: 'super@couponsphere.dev', passwordHash, role: 'super_admin', organizationId: org._id, referralCode: 'SUPERADMIN' },
    { name: 'Nora Merchant', email: 'admin@urbanbite.dev', passwordHash, role: 'business_admin', organizationId: org._id, referralCode: 'NORA2026' },
    { name: 'Maya Rao', email: 'maya@example.com', passwordHash, role: 'customer', organizationId: org._id, referralCode: 'MAYA2026', loyaltyPoints: 3200 },
    { name: 'Alex Johnson', email: 'alex@example.com', passwordHash, role: 'customer', organizationId: org._id, referralCode: 'ALEX2026', loyaltyPoints: 500 },
    { name: 'Jordan Smith', email: 'jordan@example.com', passwordHash, role: 'customer', organizationId: org._id, referralCode: 'JORD2026', loyaltyPoints: 8500 }
  ]);

  await Wallet.create([
    { userId: customer._id, cashbackBalance: 48, rewardPoints: 3200 },
    { userId: customer2._id, cashbackBalance: 10, rewardPoints: 500 },
    { userId: customer3._id, cashbackBalance: 150, rewardPoints: 8500 }
  ]);

  const campaign = await Campaign.create({
    organizationId: org._id,
    name: 'Summer Flash Growth',
    objective: 'flash_sale',
    status: 'running',
    budget: 125000,
    startsAt: new Date(),
    endsAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
    audience: { segments: ['high_intent', 'new_users'], regions: ['IN-WB', 'IN-KA', 'US-CA'] }
  });

  const campaign2 = await Campaign.create({
    organizationId: org._id,
    name: 'Welcome Onboarding',
    objective: 'conversion',
    status: 'running',
    budget: 50000,
    startsAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000),
    endsAt: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000),
    audience: { segments: ['new_users'], regions: ['global'] }
  });

  await Coupon.create([
    {
      organizationId: org._id,
      campaignId: campaign._id,
      vendor: 'UrbanBite',
      title: 'Flash 35% Off',
      code: 'FLASH35',
      description: 'Time-boxed high-conversion coupon for peak demand windows.',
      type: 'flash',
      value: 35,
      status: 'active',
      startsAt: new Date(Date.now() - 60 * 60 * 1000),
      expiresAt: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000),
      conditions: { minimumOrderValue: 40, usageLimit: 5000, perUserLimit: 1, regions: ['IN-WB', 'IN-KA'] },
      ai: { segment: 'high_intent', predictedConversion: 71, recommendedDiscount: 32 }
    },
    {
      organizationId: org._id,
      campaignId: campaign._id,
      vendor: 'ShopSphere',
      title: 'Referral Cashback',
      code: 'REFER20',
      description: 'Cashback reward for verified referral chains.',
      type: 'referral',
      value: 20,
      status: 'active',
      startsAt: new Date(Date.now() - 60 * 60 * 1000),
      expiresAt: new Date(Date.now() + 45 * 24 * 60 * 60 * 1000),
      conditions: { minimumOrderValue: 20, usageLimit: 10000, perUserLimit: 3 }
    },
    {
      organizationId: org._id,
      campaignId: campaign2._id,
      vendor: 'TechMart',
      title: 'Welcome Bonus 50%',
      code: 'WELCOME50',
      description: 'Massive discount for first-time purchasers.',
      type: 'percentage',
      value: 50,
      status: 'active',
      startsAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000),
      expiresAt: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000),
      conditions: { minimumOrderValue: 10, usageLimit: 50000, perUserLimit: 1 }
    },
    {
      organizationId: org._id,
      campaignId: campaign._id,
      vendor: 'UrbanBite',
      title: 'Festive Special $25 Off',
      code: 'FESTIVE25',
      description: 'Flat $25 off on orders above $100.',
      type: 'flat',
      value: 25,
      status: 'active',
      startsAt: new Date(),
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      conditions: { minimumOrderValue: 100, usageLimit: 2000, perUserLimit: 2 }
    },
    {
      organizationId: org._id,
      campaignId: campaign2._id,
      vendor: 'FoodieExpress',
      title: 'Free Delivery',
      code: 'FREEDEL',
      description: '100% off on delivery charges.',
      type: 'percentage',
      value: 100,
      status: 'active',
      startsAt: new Date(),
      expiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
      conditions: { minimumOrderValue: 15, usageLimit: 100000, perUserLimit: 5 }
    }
  ]);

  await FraudLog.create([
    {
      organizationId: org._id,
      userId: customer._id,
      severity: 'high',
      riskScore: 78,
      signals: ['rapid_redemption', 'duplicate_device_usage'],
      ip: '203.0.113.42',
      deviceId: 'demo-device-risky',
      actionTaken: 'captcha_required'
    },
    {
      organizationId: org._id,
      userId: customer2._id,
      severity: 'medium',
      riskScore: 55,
      signals: ['vpn_usage'],
      ip: '198.51.100.10',
      deviceId: 'demo-device-vpn',
      actionTaken: 'logged'
    }
  ]);

  return { org, admin, superAdmin, customer };
}

