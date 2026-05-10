import * as marketplaceService from '../services/marketplace.service.js';

export async function list(req, res, next) {
  try {
    const { redemptionId, price } = req.body;
    res.json(await marketplaceService.listCouponForSale(req.user._id, redemptionId, price));
  } catch (error) {
    next(error);
  }
}

export async function buy(req, res, next) {
  try {
    const { redemptionId } = req.params;
    res.json(await marketplaceService.buyCoupon(req.user._id, redemptionId));
  } catch (error) {
    next(error);
  }
}

export async function listings(req, res, next) {
  try {
    res.json(await marketplaceService.getMarketplaceListings());
  } catch (error) {
    next(error);
  }
}

export async function earnings(req, res, next) {
  try {
    res.json(await marketplaceService.getMyEarnings(req.user._id));
  } catch (error) {
    next(error);
  }
}
