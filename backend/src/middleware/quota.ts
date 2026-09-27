import type { Request, Response, NextFunction } from 'express';
import { FeatureType } from '../config/limits';
import { usageService } from '../modules/usage/usage.service';
import { UnauthorizedError } from '../utils/errors';

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      quota?: {
        feature: FeatureType;
        used: number;
        limit: number;
        remaining: number;
        resetAt: Date;
      };
      refundQuota?: () => Promise<void>;
    }
  }
}

/**
 * Middleware to enforce and atomically consume persistent monthly feature quotas.
 */
export function requireQuota(feature: FeatureType) {
  return async (req: Request, _res: Response, next: NextFunction): Promise<void> => {
    const userId = req.user?.sub;
    if (!userId) {
      return next(new UnauthorizedError('Authentication required to access this feature'));
    }

    try {
      const consumption = await usageService.consume(userId, feature);
      req.quota = {
        feature,
        used: consumption.used,
        limit: consumption.limit,
        remaining: consumption.remaining,
        resetAt: consumption.resetAt,
      };

      let refunded = false;
      req.refundQuota = async () => {
        if (!refunded) {
          refunded = true;
          await usageService.release(userId, feature);
        }
      };

      return next();
    } catch (err) {
      return next(err);
    }
  };
}
