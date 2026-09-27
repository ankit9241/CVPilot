import type { Request, Response, NextFunction } from 'express';
import { Prisma } from '@prisma/client';
import { ZodError } from 'zod';
import { AppError } from '../utils/errors';
import { fail } from '../utils/response';
import { logger } from '../logger/logger';

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function errorHandler(err: unknown, req: Request, res: Response, _next: NextFunction) {
  // If an internal server error occurred and quota was reserved, release/refund it
  if (req.refundQuota && !(err instanceof AppError && err.statusCode < 500)) {
    req.refundQuota().catch((refundErr) => {
      logger.warn('Failed to refund quota after error', { refundErr: String(refundErr) });
    });
  }

  // Handle structured operational AppErrors
  if (err instanceof AppError) {
    return fail(res, err.code, err.message, err.statusCode, err.details);
  }

  // Handle Zod schema validation errors
  if (err instanceof ZodError) {
    return fail(res, 'VALIDATION_ERROR', 'Validation failed', 422, err.flatten());
  }

  // Handle Express body parser size limit errors (e.g. entity.too.large)
  if (err && typeof err === 'object' && ('type' in err || 'status' in err)) {
    const errorObj = err as { type?: string; status?: number; message?: string };
    if (errorObj.type === 'entity.too.large' || errorObj.status === 413) {
      return fail(res, 'REQUEST_TOO_LARGE', 'Request payload exceeds the maximum allowed size (5MB).', 413);
    }
  }

  // Handle Prisma database errors (never leak raw queries or internal metadata)
  if (err instanceof Prisma.PrismaClientKnownRequestError) {
    if (err.code === 'P2002') {
      return fail(res, 'CONFLICT', 'A record with these details already exists.', 409);
    }
    if (err.code === 'P2025') {
      return fail(res, 'NOT_FOUND', 'Requested record not found.', 404);
    }
    logger.error('Prisma database error', { code: err.code, message: err.message });
    return fail(res, 'DB_ERROR', 'Database operation failed.', 400);
  }

  // Log unhandled exceptions for server debugging (stripped of credentials)
  const errorMessage = err instanceof Error ? err.message : String(err);
  logger.error('Unhandled server error', {
    url: req.originalUrl,
    method: req.method,
    userId: req.user?.sub,
    err: errorMessage,
  });

  // Never expose internal stack traces or database info to client in production
  return fail(res, 'INTERNAL_ERROR', 'An unexpected error occurred. Please try again later.', 500);
}
