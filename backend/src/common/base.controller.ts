import type { Response } from 'express';
import { ok, created, noContent } from '../utils/response';

/**
 * Base Controller class providing common HTTP response helpers
 * to maintain consistent API behavior and structure.
 */
export abstract class BaseController {
  protected sendOk(res: Response, data: unknown, meta?: Record<string, unknown>) {
    return ok(res, data, meta);
  }

  protected sendCreated(res: Response, data: unknown, meta?: Record<string, unknown>) {
    return created(res, data, meta);
  }

  protected sendNoContent(res: Response) {
    return noContent(res);
  }
}
