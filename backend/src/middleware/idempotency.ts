import type { Request, Response, NextFunction } from 'express';
import { prisma } from '../db/prisma';
import { SECURITY_LIMITS } from '../config/limits';
import { ConflictError, UnauthorizedError } from '../utils/errors';
import { logger } from '../logger/logger';

/**
 * Middleware to support Idempotency-Key on expensive operations.
 * Prevents double-clicks, browser retries, and network duplicate submissions.
 */
export function idempotency(req: Request, res: Response, next: NextFunction): void {
  const rawKey = req.headers['idempotency-key'] || req.headers['x-idempotency-key'];
  if (!rawKey || typeof rawKey !== 'string') {
    return next(); // No idempotency key provided, proceed normally
  }

  const idempotencyKey = rawKey.trim();
  if (idempotencyKey.length < 4 || idempotencyKey.length > 128) {
    return next(); // Ignore malformed keys
  }

  const userId = req.user?.sub;
  if (!userId) {
    return next(new UnauthorizedError('Authentication required for idempotent requests'));
  }

  const endpoint = `${req.method}:${req.baseUrl || ''}${req.path}`;
  const ttlMs = SECURITY_LIMITS.idempotency.ttlSeconds * 1000;
  const now = new Date();
  const expiresAt = new Date(now.getTime() + ttlMs);

  (async () => {
    try {
      // 1. Check if record exists
      const existing = await prisma.idempotencyRecord.findUnique({
        where: {
          userId_key_endpoint: {
            userId,
            key: idempotencyKey,
            endpoint,
          },
        },
      });

      if (existing) {
        // If already completed and not expired: replay response
        if (existing.statusCode && existing.expiresAt.getTime() > now.getTime()) {
          logger.info('Replaying idempotent response', { userId, key: idempotencyKey, endpoint });
          res.set('X-Idempotent-Replayed', 'true');
          return res.status(existing.statusCode).json(existing.responseBody);
        }

        // If locked/processing within past 2 minutes: reject concurrent duplicate
        if (!existing.statusCode && now.getTime() - existing.lockedAt.getTime() < 120_000) {
          return next(
            new ConflictError('A request with this Idempotency-Key is currently processing. Please wait.'),
          );
        }

        // If expired or stale lock: refresh lock
        await prisma.idempotencyRecord.update({
          where: { id: existing.id },
          data: {
            lockedAt: now,
            expiresAt,
            statusCode: null,
            responseBody: undefined,
          },
        });
      } else {
        // Create initial locked record
        await prisma.idempotencyRecord.create({
          data: {
            userId,
            key: idempotencyKey,
            endpoint,
            lockedAt: now,
            expiresAt,
          },
        });
      }

      // Intercept res.json to capture response
      const originalJson = res.json.bind(res);
      res.json = function (body: any): Response {
        const statusCode = res.statusCode || 200;
        // Only cache successful or non-server-error responses
        if (statusCode >= 200 && statusCode < 500) {
          prisma.idempotencyRecord
            .update({
              where: {
                userId_key_endpoint: {
                  userId,
                  key: idempotencyKey,
                  endpoint,
                },
              },
              data: {
                statusCode,
                responseBody: body,
                updatedAt: new Date(),
              },
            })
            .catch((err) => {
              logger.warn('Failed to save idempotency response', { key: idempotencyKey, err: String(err) });
            });
        }
        return originalJson(body);
      };

      return next();
    } catch (err) {
      logger.warn('Idempotency middleware error, continuing request without idempotency', { err });
      return next();
    }
  })();
}
