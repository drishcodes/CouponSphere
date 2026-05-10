import { AuditLog } from '../models/AuditLog.js';
import { FeatureFlag } from '../models/FeatureFlag.js';
import { Organization } from '../models/Organization.js';
import { User } from '../models/User.js';

export async function platformOverview(_req, res, next) {
  try {
    const [organizations, users, flags] = await Promise.all([
      Organization.countDocuments(),
      User.countDocuments(),
      FeatureFlag.find().sort({ key: 1 })
    ]);
    res.json({ organizations, users, flags });
  } catch (error) {
    next(error);
  }
}

export async function auditLogs(req, res, next) {
  try {
    res.json(await AuditLog.find({ organizationId: req.user.organizationId }).sort({ createdAt: -1 }).limit(200));
  } catch (error) {
    next(error);
  }
}

export async function getUsers(req, res, next) {
  try {
    // Admins see users from their org, super admins see all
    const query = req.user.role === 'super_admin' ? {} : { organizationId: req.user.organizationId };
    const users = await User.find(query).sort({ createdAt: -1 });
    res.json(users);
  } catch (error) {
    next(error);
  }
}

export async function exportReport(req, res, next) {
  console.log('Export requested for Org:', req.user.organizationId);
  try {
    const { Coupon } = await import('../models/Coupon.js');
    const coupons = await Coupon.find({ organizationId: req.user.organizationId });
    res.json({
      reportType: 'Organization Coupon Inventory',
      generatedAt: new Date().toISOString(),
      organizationId: req.user.organizationId,
      data: coupons
    });
  } catch (error) {
    next(error);
  }
}

