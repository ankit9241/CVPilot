import type { Request, Response } from 'express';
import { BaseController } from '../../common/base.controller';
import { asyncHandler } from '../../utils/async-handler';
import { authService, AuthService } from './auth.service';
import { env } from '../../config/env';
import { UnauthorizedError } from '../../utils/errors';

export class AuthController extends BaseController {
  constructor(protected readonly service: AuthService = authService) {
    super();
  }

  initiateGoogle = asyncHandler(async (_req: Request, res: Response) => {
    const url = this.service.getGoogleAuthUrl();
    return res.redirect(url);
  });

  googleCallback = asyncHandler(async (req: Request, res: Response) => {
    const code = req.query.code as string;
    const result = await this.service.handleGoogleCallback(code);

    // Set secure HTTP-only cookies
    this.setAuthCookies(res, result.accessToken, result.refreshToken);

    // First-time users (profile not yet filled) → onboarding; returning users → dashboard
    const u = result.user as { profile?: { completionPct?: number } | null };
    const isNewUser = !u.profile || (u.profile.completionPct ?? 0) < 20;
    const redirectPath = isNewUser ? '/onboarding' : '/dashboard';
    return res.redirect(`${env.cors.origin}${redirectPath}`);
  });

  me = asyncHandler(async (req: Request, res: Response) => {
    if (!req.user?.sub) {
      throw new UnauthorizedError('Unauthorized access');
    }
    const user = await this.service.me(req.user.sub);
    return this.sendOk(res, user);
  });

  logout = asyncHandler(async (req: Request, res: Response) => {
    const refreshToken = req.cookies?.refreshToken;
    await this.service.logout(refreshToken);
    res.clearCookie('accessToken');
    res.clearCookie('refreshToken');
    return this.sendOk(res, { success: true });
  });

  refresh = asyncHandler(async (req: Request, res: Response) => {
    const refreshToken = req.cookies?.refreshToken || req.body?.refreshToken;
    if (!refreshToken) {
      throw new UnauthorizedError('Missing refresh token');
    }

    try {
      const tokens = await this.service.refresh(refreshToken);
      // Re-set BOTH cookies — sliding window keeps the session alive while active.
      this.setAuthCookies(res, tokens.accessToken, tokens.refreshToken);
      return this.sendOk(res, tokens);
    } catch (err) {
      // Session invalid (expired/revoked/inactive) — clear client auth state.
      res.clearCookie('accessToken');
      res.clearCookie('refreshToken');
      throw err;
    }
  });

  private setAuthCookies(res: Response, accessToken: string, refreshToken: string) {
    const isProd = env.isProd;
    const cookieBase = { httpOnly: true, secure: isProd, sameSite: 'lax' as const };
    res.cookie('accessToken', accessToken, { ...cookieBase, maxAge: 48 * 60 * 60 * 1000 });
    res.cookie('refreshToken', refreshToken, { ...cookieBase, maxAge: 7 * 24 * 60 * 60 * 1000 });
  }
}

export const authController = new AuthController();
