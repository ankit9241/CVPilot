import type { Request, Response, NextFunction } from 'express';
import type { ZodSchema } from 'zod';
import { ValidationError } from '../utils/errors';

type Source = 'body' | 'query' | 'params';

export const validate =
  (schema: ZodSchema, source: Source = 'body') =>
  (req: Request, _res: Response, next: NextFunction): void => {
    const result = schema.safeParse(req[source]);
    if (!result.success) {
      return next(
        new ValidationError('Validation failed', result.error.flatten()),
      );
    }
    // Overwrite with parsed (coerced) data.
    (req as unknown as Record<Source, unknown>)[source] = result.data;
    next();
  };
