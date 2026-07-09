import type { Request, Response, NextFunction } from 'express';
import type { Role } from '../constants/roles';
import { ForbiddenError, UnauthorizedError } from '../utils/errors';

export const authorize =
  (...allowed: Role[]) =>
  (req: Request, _res: Response, next: NextFunction): void => {
    if (!req.user) return next(new UnauthorizedError());
    if (allowed.length && !allowed.includes(req.user.role)) {
      return next(new ForbiddenError('Insufficient role'));
    }
    next();
  };
