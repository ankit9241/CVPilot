import type { Request, Response, NextFunction } from 'express';
import { FeatureType, SECURITY_LIMITS } from '../config/limits';
import { TooManyActiveRequestsError, UnauthorizedError } from '../utils/errors';
import { logger } from '../logger/logger';

// In-memory active request tracking (per user and global)
const activeUserRequests = new Map<string, number>();
let globalActivePdfCompilations = 0;

function getUserFeatureKey(userId: string, feature: FeatureType): string {
  return `${userId}:${feature}`;
}

export function getActiveUserCount(userId: string, feature: FeatureType): number {
  return activeUserRequests.get(getUserFeatureKey(userId, feature)) || 0;
}

export function getGlobalActivePdfCount(): number {
  return globalActivePdfCompilations;
}

/**
 * Middleware to prevent a single user (or instance) from exhausting server resources
 * with excessive simultaneous expensive operations.
 */
export function guardConcurrency(feature: FeatureType) {
  return (req: Request, res: Response, next: NextFunction): void => {
    const userId = req.user?.sub;
    if (!userId) {
      return next(new UnauthorizedError('Authentication required'));
    }

    const key = getUserFeatureKey(userId, feature);
    const currentActive = activeUserRequests.get(key) || 0;
    const maxAllowed = SECURITY_LIMITS.concurrency[feature] || 2;

    if (currentActive >= maxAllowed) {
      logger.warn('User concurrency limit reached', { userId, feature, currentActive, maxAllowed });
      return next(
        new TooManyActiveRequestsError(
          `You already have ${currentActive} active ${feature.replace(/_/g, ' ').toLowerCase()} operation(s) in progress. Please wait for them to finish.`,
          {
            feature,
            active: currentActive,
            maxAllowed,
          },
        ),
      );
    }

    // Check global PDF compilation guard
    if (feature === FeatureType.PDF_GENERATION) {
      if (globalActivePdfCompilations >= SECURITY_LIMITS.concurrency.globalPdfMax) {
        logger.warn('Global PDF compilation concurrency limit reached', {
          globalActive: globalActivePdfCompilations,
          maxAllowed: SECURITY_LIMITS.concurrency.globalPdfMax,
        });
        return next(
          new TooManyActiveRequestsError(
            'Server is currently processing maximum PDF compilation load. Please retry in a few seconds.',
            {
              feature,
              globalActive: globalActivePdfCompilations,
              maxAllowed: SECURITY_LIMITS.concurrency.globalPdfMax,
            },
          ),
        );
      }
      globalActivePdfCompilations++;
    }

    // Increment active slot
    activeUserRequests.set(key, currentActive + 1);

    let released = false;
    const releaseSlot = () => {
      if (released) return;
      released = true;

      const updated = (activeUserRequests.get(key) || 1) - 1;
      if (updated <= 0) {
        activeUserRequests.delete(key);
      } else {
        activeUserRequests.set(key, updated);
      }

      if (feature === FeatureType.PDF_GENERATION) {
        globalActivePdfCompilations = Math.max(0, globalActivePdfCompilations - 1);
      }
    };

    // Ensure slot is freed when response finishes or connection drops
    res.once('finish', releaseSlot);
    res.once('close', releaseSlot);

    return next();
  };
}
