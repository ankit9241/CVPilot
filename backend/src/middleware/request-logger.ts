import type { Request, Response, NextFunction } from 'express';
import { v4 as uuid } from 'uuid';
import { logger } from '../logger/logger';

export function requestLogger(req: Request, res: Response, next: NextFunction): void {
  req.requestId = uuid();
  res.setHeader('X-Request-Id', req.requestId);
  const start = Date.now();
  res.on('finish', () => {
    logger.info('http', {
      id: req.requestId,
      method: req.method,
      url: req.originalUrl,
      status: res.statusCode,
      ms: Date.now() - start,
    });
  });
  next();
}
