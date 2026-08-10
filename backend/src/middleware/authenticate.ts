import type { Request, Response, NextFunction } from 'express';
import { verifyAccessToken } from '../auth/jwt';
import { UnauthorizedError } from '../utils/errors';
import { prisma } from '../prisma/client';
import { env } from '../config/env';

const ACTIVITY_TOUCH_INTERVAL_MS = 60 * 1000; // one DB write per active minute

function clearAuthCookies(res: Response) {
  res.clearCookie('accessToken');
  res.clearCookie('refreshToken');
}

export async function authenticate(req: Request, res: Response, next: NextFunction): Promise<void> {
  let token = req.cookies?.accessToken;
  const header = req.headers.authorization;

  if (!token && header?.startsWith('Bearer ')) {
    token = header.slice('Bearer '.length).trim();
  }

  if (!token) {
    return next(new UnauthorizedError('Missing authentication token'));
  }

  let payload;
  try {
    payload = verifyAccessToken(token);
  } catch {
    return next(new UnauthorizedError('Invalid or expired token'));
  }

  try {
    const user = await prisma.user.findUnique({
      where: { id: payload.sub },
      select: { id: true, lastActiveAt: true },
    });

    if (!user) {
      clearAuthCookies(res);
      return next(new UnauthorizedError('User session not found'));
    }

    const now = Date.now();
    if (user.lastActiveAt && now - user.lastActiveAt.getTime() > env.session.inactivityMs) {
      clearAuthCookies(res);
      return next(new UnauthorizedError('Session expired due to inactivity'));
    }

    // Throttled activity touch — backend is source of truth for last activity.
    if (!user.lastActiveAt || now - user.lastActiveAt.getTime() > ACTIVITY_TOUCH_INTERVAL_MS) {
      await prisma.user.update({ where: { id: user.id }, data: { lastActiveAt: new Date() } });
    }

    req.user = payload;
    return next();
  } catch (err) {
    return next(err);
  }
}

// Optional variant – attaches user if present, never rejects.
export function attachUserIfPresent(req: Request, _res: Response, next: NextFunction): void {
  let token = req.cookies?.accessToken;
  const header = req.headers.authorization;

  if (!token && header?.startsWith('Bearer ')) {
    token = header.slice(7).trim();
  }

  if (token) {
    try {
      req.user = verifyAccessToken(token);
    } catch {
      /* silent */
    }
  }
  next();
}
