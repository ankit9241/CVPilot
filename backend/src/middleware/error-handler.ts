import type { Request, Response, NextFunction } from 'express';
import { Prisma } from '@prisma/client';
import { ZodError } from 'zod';
import { AppError } from '../utils/errors';
import { fail } from '../utils/response';
import { logger } from '../logger/logger';

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function errorHandler(err: unknown, req: Request, res: Response, _next: NextFunction) {
  if (err instanceof AppError) {
    return fail(res, err.code, err.message, err.statusCode, err.details);
  }
  if (err instanceof ZodError) {
    return fail(res, 'VALIDATION_ERROR', 'Validation failed', 422, err.flatten());
  }
  if (err instanceof Prisma.PrismaClientKnownRequestError) {
    if (err.code === 'P2002') return fail(res, 'CONFLICT', 'Unique constraint violated', 409, err.meta);
    if (err.code === 'P2025') return fail(res, 'NOT_FOUND', 'Record not found', 404);
    return fail(res, 'DB_ERROR', 'Database error', 400, { code: err.code });
  }

  logger.error('Unhandled error', { err: err instanceof Error ? err.message : String(err) });
  return fail(res, 'INTERNAL_ERROR', 'Internal server error', 500);
}
