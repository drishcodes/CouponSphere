import { Campaign } from '../models/Campaign.js';

export async function listCampaigns(req, res, next) {
  try {
    res.json(await Campaign.find({ organizationId: req.user.organizationId }).sort({ createdAt: -1 }));
  } catch (error) {
    next(error);
  }
}

export async function createCampaign(req, res, next) {
  try {
    const campaign = await Campaign.create({ ...req.body, organizationId: req.user.organizationId });
    res.status(201).json(campaign);
  } catch (error) {
    next(error);
  }
}

