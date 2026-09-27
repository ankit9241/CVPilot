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

  initiateGoogle = asyncHandler(async (req: Request, res: Response) => {
    const origin = (req.query.origin as string) || (req.headers.referer ? new URL(req.headers.referer).origin : undefined);
    const url = this.service.getGoogleAuthUrl(origin);
    return res.redirect(url);
  });

  googleCallback = asyncHandler(async (req: Request, res: Response) => {
    const code = req.query.code as string;
    const state = req.query.state as string | undefined;
    const result = await this.service.handleGoogleCallback(code);

    // Set secure HTTP-only cookies
    this.setAuthCookies(res, result.accessToken, result.refreshToken);

    // First-time users (profile not yet filled) → onboarding; returning users → dashboard
    const u = result.user as { profile?: { completionPct?: number } | null };
    const isNewUser = !u.profile || (u.profile.completionPct ?? 0) < 20;
    const redirectPath = isNewUser ? '/onboarding' : '/dashboard';

    const originList = env.cors.origin.split(',').map((s) => s.trim().replace(/\/+$/, '')).filter(Boolean);
    let frontendBaseUrl = env.isProd
      ? originList.find((o) => o.startsWith('https://')) || 'https://cv-pilot.netlify.app'
      : originList[0] || 'http://localhost:5173';

    if (state && (state.startsWith('http://') || state.startsWith('https://'))) {
      try {
        const parsed = new URL(state);
        frontendBaseUrl = parsed.origin;
      } catch {
        // invalid state URL, use configured default
      }
    }

    const params = new URLSearchParams({
      token: result.accessToken,
      refreshToken: result.refreshToken,
    });

    return res.redirect(`${frontendBaseUrl}${redirectPath}?${params.toString()}`);
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
    const cookieBase = this.getCookieOptions();
    res.clearCookie('accessToken', cookieBase);
    res.clearCookie('refreshToken', cookieBase);
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
      const cookieBase = this.getCookieOptions();
      res.clearCookie('accessToken', cookieBase);
      res.clearCookie('refreshToken', cookieBase);
      throw err;
    }
  });

  private getCookieOptions() {
    const isProd = env.isProd;
    return {
      httpOnly: true,
      secure: isProd,
      sameSite: (isProd ? 'none' : 'lax') as 'none' | 'lax',
      path: '/',
    };
  }

  private setAuthCookies(res: Response, accessToken: string, refreshToken: string) {
    const cookieBase = this.getCookieOptions();
    res.cookie('accessToken', accessToken, { ...cookieBase, maxAge: 48 * 60 * 60 * 1000 });
    res.cookie('refreshToken', refreshToken, { ...cookieBase, maxAge: 7 * 24 * 60 * 60 * 1000 });
  }
}

export const authController = new AuthController();
