import type { Request, Response } from 'express';
import { fail } from '../utils/response';

export function notFoundHandler(req: Request, res: Response) {
  return fail(res, 'NOT_FOUND', `Route not found: ${req.method} ${req.originalUrl}`, 404);
}
