import { getOverview, getCustomerEarnings } from '../services/analytics.service.js';

export async function overview(req, res, next) {
  try {
    res.json(await getOverview(req.user));
  } catch (error) {
    next(error);
  }
}

export async function customerEarnings(req, res, next) {
  console.log('Customer earnings report requested...');
  try {
    res.json(await getCustomerEarnings(req.user));
  } catch (error) {
    next(error);
  }
}

