import type { Request, Response } from 'express';
import { BaseController } from '../../common/base.controller';
import { asyncHandler } from '../../utils/async-handler';
import { settingsService, SettingsService } from './settings.service';

export class SettingsController extends BaseController {
  constructor(protected readonly service: SettingsService = settingsService) {
    super();
  }

  get = asyncHandler(async (_req: Request, res: Response) => {
    return this.sendOk(res, this.service.get());
  });

  upsert = asyncHandler(async (req: Request, res: Response) => {
    return this.sendOk(res, this.service.upsert(req.body));
  });

  update = asyncHandler(async (req: Request, res: Response) => {
    return this.sendOk(res, this.service.upsert(req.body));
  });
}

export const settingsController = new SettingsController();
