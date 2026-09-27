import type { Request, Response } from 'express';
import { BaseController } from '../../common/base.controller';
import { asyncHandler } from '../../utils/async-handler';
import { usageService, UsageService } from './usage.service';
import { UnauthorizedError } from '../../utils/errors';

export class UsageController extends BaseController {
  constructor(protected readonly service: UsageService = usageService) {
    super();
  }

  getSummary = asyncHandler(async (req: Request, res: Response) => {
    if (!req.user?.sub) {
      throw new UnauthorizedError('Unauthorized');
    }
    const summary = await this.service.getUsageSummary(req.user.sub);
    return this.sendOk(res, summary);
  });
}

export const usageController = new UsageController();
