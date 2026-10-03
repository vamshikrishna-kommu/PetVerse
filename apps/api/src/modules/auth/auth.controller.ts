import type { Request, Response, NextFunction } from 'express';
import { authService } from './auth.service';
import { apiResponse } from '../../shared/utils/apiResponse';
import { asyncHandler } from '../../middlewares/error.middleware';
import { env } from '../../config/env';

/**
 * Refresh-token cookie options.
 *
 * SECURITY:
 *  - httpOnly: prevents JavaScript access (XSS protection)
 *  - sameSite: 'strict' — cookie only sent on same-site requests (CSRF protection)
 *  - secure: true in production (HTTPS only)
 *  - path: scoped to the refresh endpoint only — not sent on every request
 *  - maxAge: mirrors JWT_REFRESH_EXPIRES_IN (7 days)
 *
 * clearCookie MUST use the same path, sameSite, and secure values.
 */
const REFRESH_COOKIE_NAME = 'refreshToken';
const REFRESH_COOKIE_OPTIONS = {
  httpOnly: true,
  secure: env.NODE_ENV === 'production',
  sameSite: 'strict' as const,
  maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days in ms
  path: '/api/v1/auth/refresh',
};

/** Clearing options must match exactly to actually delete the cookie */
const REFRESH_COOKIE_CLEAR_OPTIONS = {
  httpOnly: true,
  secure: env.NODE_ENV === 'production',
  sameSite: 'strict' as const,
  path: '/api/v1/auth/refresh',
};


export const authController = {
  register: asyncHandler(async (req: Request, res: Response) => {
    const result = await authService.register(req.body);
    res.cookie(REFRESH_COOKIE_NAME, result.tokens.refreshToken, REFRESH_COOKIE_OPTIONS);
    apiResponse.created(res, {
      user: result.user,
      accessToken: result.tokens.accessToken,
      expiresIn: result.tokens.expiresIn,
    });
  }),

  login: asyncHandler(async (req: Request, res: Response) => {
    const { email, password } = req.body;
    const result = await authService.login(email, password);
    res.cookie(REFRESH_COOKIE_NAME, result.tokens.refreshToken, REFRESH_COOKIE_OPTIONS);
    apiResponse.success(res, {
      user: result.user,
      accessToken: result.tokens.accessToken,
      expiresIn: result.tokens.expiresIn,
    });
  }),

  logout: asyncHandler(async (req: Request, res: Response) => {
    if (req.user) {
      await authService.logout(req.user.userId);
    }
    // Must match the exact same path + sameSite + secure values used when setting the cookie
    res.clearCookie(REFRESH_COOKIE_NAME, REFRESH_COOKIE_CLEAR_OPTIONS);
    apiResponse.noContent(res);
  }),

  refresh: asyncHandler(async (req: Request, res: Response) => {
    const refreshToken = req.cookies?.refreshToken as string | undefined;
    if (!refreshToken) {
      return res.status(401).json({
        success: false,
        error: { code: 'UNAUTHORIZED', message: 'No refresh token' },
      });
    }
    const tokens = await authService.refreshTokens(refreshToken);
    res.cookie(REFRESH_COOKIE_NAME, tokens.refreshToken, REFRESH_COOKIE_OPTIONS);
    apiResponse.success(res, {
      accessToken: tokens.accessToken,
      expiresIn: tokens.expiresIn,
    });
  }),

  googleAuth: asyncHandler(async (req: Request, res: Response) => {
    const { idToken } = req.body as { idToken: string };
    const result = await authService.googleAuth(idToken);
    res.cookie(REFRESH_COOKIE_NAME, result.tokens.refreshToken, REFRESH_COOKIE_OPTIONS);
    apiResponse.success(res, {
      user: result.user,
      accessToken: result.tokens.accessToken,
      expiresIn: result.tokens.expiresIn,
    });
  }),

  sendOtp: asyncHandler(async (req: Request, res: Response) => {
    const { target, type } = req.body as { target: string; type: 'email' | 'phone' };
    await authService.sendOtp(target, type);
    apiResponse.success(res, { message: 'OTP sent successfully' });
  }),

  verifyOtp: asyncHandler(async (req: Request, res: Response) => {
    const { target, otp } = req.body as { target: string; otp: string };
    const verified = await authService.verifyOtp(target, otp);
    apiResponse.success(res, { verified });
  }),

  forgotPassword: asyncHandler(async (req: Request, res: Response) => {
    const { email } = req.body as { email: string };
    await authService.forgotPassword(email);
    apiResponse.success(res, { message: 'Reset link sent if account exists' });
  }),

  resetPassword: asyncHandler(async (req: Request, res: Response) => {
    const { token, password } = req.body as { token: string; password: string };
    await authService.resetPassword(token, password);
    apiResponse.success(res, { message: 'Password updated successfully' });
  }),
};
