import mongoose from 'mongoose';
import { connectDb } from '../config/db.js';
import { ensureDemoData } from './demoData.js';
import { FraudLog } from '../models/FraudLog.js';
import { Organization } from '../models/Organization.js';
import { User } from '../models/User.js';
import { Wallet } from '../models/Wallet.js';
import { Campaign } from '../models/Campaign.js';
import { Coupon } from '../models/Coupon.js';

await connectDb();
await Promise.all([
  Organization.deleteMany({}),
  User.deleteMany({}),
  Coupon.deleteMany({}),
  Campaign.deleteMany({}),
  FraudLog.deleteMany({}),
  Wallet.deleteMany({})
]);

const { org, admin, superAdmin } = await ensureDemoData();

console.log(`Seeded CouponSphere with org ${org.slug}. Admin: ${admin.email}, Super: ${superAdmin.email}`);
await mongoose.disconnect();
