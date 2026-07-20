import type { Request, Response } from 'express';
import { BaseController } from '../../common/base.controller';
import { asyncHandler } from '../../utils/async-handler';
import { settingsService, SettingsService } from './settings.service';
import { UnauthorizedError } from '../../utils/errors';

export class SettingsController extends BaseController {
  constructor(protected readonly service: SettingsService = settingsService) {
    super();
  }

  get = asyncHandler(async (req: Request, res: Response) => {
    if (!req.user?.sub) throw new UnauthorizedError('Unauthorized');
    return this.sendOk(res, await this.service.get(req.user.sub));
  });

  upsert = asyncHandler(async (req: Request, res: Response) => {
    if (!req.user?.sub) throw new UnauthorizedError('Unauthorized');
    return this.sendOk(res, await this.service.upsert(req.user.sub, req.body));
  });

  update = asyncHandler(async (req: Request, res: Response) => {
    if (!req.user?.sub) throw new UnauthorizedError('Unauthorized');
    return this.sendOk(res, await this.service.upsert(req.user.sub, req.body));
  });
}

export const settingsController = new SettingsController();
