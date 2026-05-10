import * as authService from '../services/auth.service.js';

const cookieOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'lax',
  maxAge: 7 * 24 * 60 * 60 * 1000
};

export async function register(req, res, next) {
  try {
    const session = await authService.register(req.body);
    res.cookie('refreshToken', session.refreshToken, cookieOptions).status(201).json(session);
  } catch (error) {
    next(error);
  }
}

export async function login(req, res, next) {
  try {
    const session = await authService.login({
      ...req.body,
      ip: req.ip,
      userAgent: req.headers['user-agent']
    });
    res.cookie('refreshToken', session.refreshToken, cookieOptions).json(session);
  } catch (error) {
    next(error);
  }
}

export async function refresh(req, res, next) {
  try {
    const session = await authService.refresh(req.cookies.refreshToken);
    res.cookie('refreshToken', session.refreshToken, cookieOptions).json(session);
  } catch (error) {
    next(error);
  }
}

export async function logout(req, res, next) {
  try {
    await authService.logout(req.user?._id, req.cookies.refreshToken);
    res.clearCookie('refreshToken').status(204).send();
  } catch (error) {
    next(error);
  }
}

