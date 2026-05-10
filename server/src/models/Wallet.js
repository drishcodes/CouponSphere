import mongoose from 'mongoose';

const walletSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
  cashbackBalance: { type: Number, default: 0 },
  rewardPoints: { type: Number, default: 0 },
  currency: { type: String, default: 'USD' },
  ledger: [{
    type: { type: String, enum: ['cashback', 'redemption', 'referral', 'adjustment', 'marketplace_earnings'] },
    amount: Number,
    points: Number,
    description: String,
    createdAt: { type: Date, default: Date.now }
  }]
}, { timestamps: true });

export const Wallet = mongoose.model('Wallet', walletSchema);

