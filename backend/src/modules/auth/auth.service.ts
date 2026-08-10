import { BaseService } from '../../common/base.service';
import { signAccessToken, signRefreshToken, verifyRefreshToken } from '../../auth/jwt';
import { UnauthorizedError, BadRequestError } from '../../utils/errors';
import { googleOAuthClient, verifyGoogleIdToken } from '../../auth/google-oauth';
import { env } from '../../config/env';
import { authRepository, AuthRepository } from './auth.repository';
import { profileService } from '../profile/profile.service';

function tokensFor(user: { id: string; email: string; role: 'USER' | 'ADMIN' | string }) {
  return {
    accessToken: signAccessToken({
      sub: user.id,
      email: user.email,
      role: user.role as 'USER' | 'ADMIN',
    }),
    refreshToken: signRefreshToken({ sub: user.id }),
  };
}

export class AuthService extends BaseService {
  constructor(protected readonly repository: AuthRepository = authRepository) {
    super();
  }

  getGoogleAuthUrl() {
    if (!env.google.clientId) {
      throw new BadRequestError('Google OAuth is not configured in environment variables');
    }
    return googleOAuthClient.generateAuthUrl({
      access_type: 'offline',
      prompt: 'consent',
      scope: [
        'https://www.googleapis.com/auth/userinfo.profile',
        'https://www.googleapis.com/auth/userinfo.email',
      ],
    });
  }

  async handleGoogleCallback(code: string) {
    try {
      const { tokens } = await googleOAuthClient.getToken(code);
      googleOAuthClient.setCredentials(tokens);

      const idToken = tokens.id_token;
      if (!idToken) throw new BadRequestError('Google OAuth failed to return id_token');

      const profile = await verifyGoogleIdToken(idToken);
      if (!profile) throw new UnauthorizedError('Invalid Google credential token');

      const existing = await this.repository.findByEmail(profile.email);
      const resolvedUser = existing
        ? existing
        : await this.repository.createGoogleUser({
            email: profile.email,
            fullName: profile.name || 'Anonymous User',
            avatarUrl: profile.picture,
            providerId: profile.sub,
          });

      // Record activity + start a persistent, revocable session
      await this.repository.touchLastActive(resolvedUser.id);
      const completion = await profileService.completion(resolvedUser.id);

      return {
        user: {
          ...resolvedUser,
          profile: resolvedUser.profile
            ? { ...resolvedUser.profile, completionPct: completion.completionPct }
            : resolvedUser.profile,
        },
        ...(await this.issueTokens(resolvedUser)),
      };
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      throw new UnauthorizedError(message || 'Google authentication failed');
    }
  }

  async me(userId: string) {
    const user = await this.repository.findById(userId);
    if (!user) throw new UnauthorizedError('User session not found');
    const completion = await profileService.completion(user.id);
    return {
      ...user,
      profile: user.profile
        ? { ...user.profile, completionPct: completion.completionPct }
        : user.profile,
    };
  }

  /**
   * Persist a refresh-token row (DB-backed, revocable) alongside the JWT pair.
   */
  private async issueTokens(user: { id: string; email: string; role: 'USER' | 'ADMIN' | string }) {
    const { accessToken, refreshToken } = tokensFor(user);
    await this.repository.createRefreshToken(
      user.id,
      refreshToken,
      new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    );
    return { accessToken, refreshToken };
  }

  async refresh(refreshToken: string) {
    let payload;
    try {
      payload = verifyRefreshToken(refreshToken);
    } catch {
      throw new UnauthorizedError('Invalid or expired refresh token');
    }

    // Reject revoked/expired rows; DB is the source of truth for revocation.
    const stored = await this.repository.findRefreshToken(refreshToken);
    if (!stored || stored.revokedAt || stored.expiresAt.getTime() < Date.now()) {
      throw new UnauthorizedError('Session has been revoked or expired');
    }
    if (stored.userId !== payload.sub) {
      throw new UnauthorizedError('Refresh token does not match session');
    }

    const user = stored.user;
    if (!user) throw new UnauthorizedError('User session not found');

    const now = Date.now();
    if (user.lastActiveAt && now - user.lastActiveAt.getTime() > env.session.inactivityMs) {
      await this.repository.revokeRefreshToken(refreshToken);
      throw new UnauthorizedError('Session expired due to inactivity');
    }

    // Rotate: revoke old row, persist new one, slide both tokens.
    await this.repository.revokeRefreshToken(refreshToken);
    const tokens = await this.issueTokens(user);
    await this.repository.touchLastActive(user.id);
    return tokens;
  }

  async logout(refreshToken?: string) {
    if (refreshToken) {
      await this.repository.revokeRefreshToken(refreshToken);
    }
    return { success: true };
  }
}

export const authService = new AuthService();
