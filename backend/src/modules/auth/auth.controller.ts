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
    res.cookie('accessToken', result.accessToken, {
      httpOnly: true,
      secure: env.isProd,
      sameSite: 'lax',
      maxAge: 48 * 60 * 60 * 1000, // 48 hours
    });

    res.cookie('refreshToken', result.refreshToken, {
      httpOnly: true,
      secure: env.isProd,
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    });

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

  logout = asyncHandler(async (_req: Request, res: Response) => {
    res.clearCookie('accessToken');
    res.clearCookie('refreshToken');
    return this.sendOk(res, { success: true });
  });

  refresh = asyncHandler(async (req: Request, res: Response) => {
    const refreshToken = req.cookies?.refreshToken || req.body?.refreshToken;
    const tokens = await this.service.refresh(refreshToken);

    res.cookie('accessToken', tokens.accessToken, {
      httpOnly: true,
      secure: env.isProd,
      sameSite: 'lax',
      maxAge: 48 * 60 * 60 * 1000, // 48 hours
    });

    return this.sendOk(res, tokens);
  });
}

export const authController = new AuthController();
