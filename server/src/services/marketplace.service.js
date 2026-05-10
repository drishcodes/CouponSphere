import { CouponRedemption } from '../models/CouponRedemption.js';
import { Wallet } from '../models/Wallet.js';
import { Coupon } from '../models/Coupon.js';
import { User } from '../models/User.js';

export async function listCouponForSale(userId, redemptionId, price) {
  const redemption = await CouponRedemption.findOne({ _id: redemptionId, userId, status: 'claimed' });
  if (!redemption) throw new Error('Unused coupon not found or already listed.');
  
  redemption.status = 'for_sale';
  redemption.price = price;
  await redemption.save();
  return redemption;
}

export async function buyCoupon(buyerId, redemptionId) {
  const redemption = await CouponRedemption.findOne({ _id: redemptionId, status: 'for_sale' }).populate('couponId');
  if (!redemption) throw new Error('Coupon no longer available for sale.');
  if (redemption.userId.toString() === buyerId) throw new Error('You cannot buy your own coupon.');

  const sellerId = redemption.userId;
  const price = redemption.price;

  // 1. Transfer coupon ownership
  redemption.userId = buyerId;
  redemption.status = 'claimed'; // New owner now has it as claimed (unused)
  redemption.price = 0;
  await redemption.save();

  // 2. Update seller's wallet
  const buyer = await User.findById(buyerId);
  let sellerWallet = await Wallet.findOne({ userId: sellerId });
  if (!sellerWallet) {
    sellerWallet = await Wallet.create({ userId: sellerId });
  }
  
  sellerWallet.cashbackBalance += price;
  sellerWallet.ledger.push({
    type: 'marketplace_earnings',
    amount: price,
    description: `Sold coupon ${redemption.couponId.code} to ${buyer.name}`
  });
  await sellerWallet.save();

  return redemption;
}

export async function getMarketplaceListings() {
  return CouponRedemption.find({ status: 'for_sale' })
    .populate('couponId', 'title code vendor type value')
    .populate('userId', 'name');
}

export async function getMyEarnings(userId) {
  const wallet = await Wallet.findOne({ userId });
  if (!wallet) return { total: 0, transactions: [] };
  
  const earnings = wallet.ledger.filter(l => l.type === 'marketplace_earnings');
  const total = earnings.reduce((sum, l) => sum + l.amount, 0);
  
  return { total, transactions: earnings };
}
