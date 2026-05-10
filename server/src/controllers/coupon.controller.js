import * as couponService from '../services/coupon.service.js';

export async function createCoupon(req, res, next) {
  try {
    const coupon = await couponService.createCoupon(req.body, req.user);
    req.app.get('io')?.to(`org:${coupon.organizationId}`).emit('coupon:created', coupon);
    res.status(201).json(coupon);
  } catch (error) {
    next(error);
  }
}

export async function listCoupons(req, res, next) {
  try {
    res.json(await couponService.listCoupons(req.query, req.user));
  } catch (error) {
    next(error);
  }
}
export async function myCoupons(req, res, next) {
  try {
    res.json(await couponService.getMyCoupons(req.user));
  } catch (error) {
    next(error);
  }
}

export async function claimCoupon(req, res, next) {
  try {
    const result = await couponService.claimCoupon(req.params.id, req.user, {
      ...req.body,
      ip: process.env.NODE_ENV === 'production' ? req.ip : (req.headers['x-demo-ip'] || req.ip),
      deviceId: req.headers['x-device-id'] || req.body.deviceId
    });
    req.app.get('io')?.to(`org:${result.redemption.organizationId}`).emit('coupon:claimed', result);
    res.status(201).json(result);
  } catch (error) {
    next(error);
  }
}

export async function redeemCoupon(req, res, next) {
  try {
    const result = await couponService.redeemCoupon(req.params.id, req.user, req.body);
    req.app.get('io')?.to(`org:${result.redemption.organizationId}`).emit('coupon:redeemed', result);
    res.json(result);
  } catch (error) {
    next(error);
  }
}
export async function deleteCoupon(req, res, next) {
  console.log('DELETE request received for ID:', req.params.id);
  try {
    const result = await couponService.deleteCoupon(req.params.id, req.user);
    res.json(result);
  } catch (error) {
    next(error);
  }
}
