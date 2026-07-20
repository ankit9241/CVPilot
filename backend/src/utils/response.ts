import type { Response } from 'express';

export interface ApiSuccess<T> {
  success: true;
  data: T;
  meta?: Record<string, unknown>;
}

export interface ApiFailure {
  success: false;
  error: { code: string; message: string; details?: unknown };
}

export function ok<T>(res: Response, data: T, meta?: Record<string, unknown>, status = 200) {
  const body: ApiSuccess<T> = { success: true, data, ...(meta ? { meta } : {}) };
  return res.status(status).json(body);
}

export function created<T>(res: Response, data: T, meta?: Record<string, unknown>) {
  return ok(res, data, meta, 201);
}

export function noContent(res: Response) {
  return res.status(204).send();
}

export function fail(
  res: Response,
  code: string,
  message: string,
  status = 400,
  details?: unknown,
) {
  const body: ApiFailure = {
    success: false,
    error: { code, message, ...(details ? { details } : {}) },
  };
  return res.status(status).json(body);
}
