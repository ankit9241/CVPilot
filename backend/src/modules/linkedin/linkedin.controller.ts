import type { Request, Response } from 'express';
import { BaseController } from '../../common/base.controller';
import { asyncHandler } from '../../utils/async-handler';
import { BadRequestError, UnauthorizedError } from '../../utils/errors';
import { prisma } from '../../prisma/client';
import { GeneratedResume } from '../../ai/types';
import { linkedInService } from './linkedin.service';

export class LinkedInController extends BaseController {
  optimize = asyncHandler(async (req: Request, res: Response) => {
    if (!req.user?.sub) throw new UnauthorizedError('Unauthorized');

    const db = prisma as any;
    const { resumeVersionId, targetRole } = req.body;
    if (!resumeVersionId) throw new BadRequestError('resumeVersionId is required');

    const version = await db.resumeVersion.findUnique({
      where: { id: resumeVersionId },
      include: { session: true },
    });
    if (!version) throw new BadRequestError('Resume version not found');
    if (version.session.userId !== req.user.sub) throw new UnauthorizedError('Unauthorized');

    const role = targetRole || version.session.targetRole || (version.resumeJson as GeneratedResume).metadata?.targetRole || '';
    if (!role.trim()) throw new BadRequestError('targetRole is required');

    const result = await linkedInService.optimize(version.resumeJson as GeneratedResume, role);
    return this.sendOk(res, result);
  });
}

export const linkedInController = new LinkedInController();
