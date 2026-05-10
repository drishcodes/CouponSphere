import { FraudLog } from '../models/FraudLog.js';
import { DeviceFingerprint } from '../models/DeviceFingerprint.js';

export async function logs(req, res, next) {
  try {
    const items = await FraudLog.find({ organizationId: req.user.organizationId }).sort({ createdAt: -1 }).limit(100);
    res.json(items);
  } catch (error) {
    next(error);
  }
}

export async function blacklist(req, res, next) {
  try {
    const item = await DeviceFingerprint.findOneAndUpdate(
      { fingerprint: req.body.deviceId },
      { $set: { blocked: true, riskScore: 100 }, $addToSet: { ipAddresses: req.body.ip } },
      { upsert: true, new: true }
    );
    req.app.get('io')?.to(`org:${req.user.organizationId}`).emit('fraud:blacklisted', item);
    res.status(201).json(item);
  } catch (error) {
    next(error);
  }
}

