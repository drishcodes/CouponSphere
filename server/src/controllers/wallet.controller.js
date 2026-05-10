import { Wallet } from '../models/Wallet.js';

export async function myWallet(req, res, next) {
  try {
    const wallet = await Wallet.findOne({ userId: req.user._id });
    res.json(wallet);
  } catch (error) {
    next(error);
  }
}

