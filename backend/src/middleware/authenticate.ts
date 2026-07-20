import type { Request, Response, NextFunction } from 'express';
import { verifyAccessToken } from '../auth/jwt';
import { UnauthorizedError } from '../utils/errors';

export function authenticate(req: Request, _res: Response, next: NextFunction): void {
  let token = req.cookies?.accessToken;
  const header = req.headers.authorization;

  if (!token && header?.startsWith('Bearer ')) {
    token = header.slice('Bearer '.length).trim();
  }

  if (!token) {
    return next(new UnauthorizedError('Missing authentication token'));
  }

  try {
    req.user = verifyAccessToken(token);
    next();
  } catch {
    next(new UnauthorizedError('Invalid or expired token'));
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
