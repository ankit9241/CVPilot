import type { Request, Response } from 'express';
import { BaseController } from '../../common/base.controller';
import { asyncHandler } from '../../utils/async-handler';
import { atsService } from './ats.service';
import { BadRequestError, UnauthorizedError } from '../../utils/errors';

export class AtsController extends BaseController {
  analyze = asyncHandler(async (req: Request, res: Response) => {
    if (!req.user?.sub) {
      throw new UnauthorizedError('Unauthorized');
    }

    const { resumeVersionId, jobDescription } = req.body;
    if (!resumeVersionId) {
      throw new BadRequestError('resumeVersionId is required');
    }

    const report = await atsService.analyze(req.user.sub, resumeVersionId, jobDescription);
    return this.sendCreated(res, report);
  });

  latest = asyncHandler(async (req: Request, res: Response) => {
    if (!req.user?.sub) {
      throw new UnauthorizedError('Unauthorized');
    }

    const { resumeId } = req.params;
    if (!resumeId) {
      throw new BadRequestError('resumeId parameter is required');
    }

    const report = await atsService.latest(req.user.sub, resumeId);
    return this.sendOk(res, report);
  });
}

export const atsController = new AtsController();
