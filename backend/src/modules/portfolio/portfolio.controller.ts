import type { Request, Response } from 'express';
import { BaseController } from '../../common/base.controller';
import { asyncHandler } from '../../utils/async-handler';
import { BadRequestError, UnauthorizedError } from '../../utils/errors';
import { prisma } from '../../prisma/client';
import { GeneratedResume } from '../../ai/types';
import { portfolioService } from './portfolio.service';

export class PortfolioController extends BaseController {
  generate = asyncHandler(async (req: Request, res: Response) => {
    if (!req.user?.sub) throw new UnauthorizedError('Unauthorized');

    const db = prisma as any;
    const { resumeVersionId, fullName, targetRole } = req.body;
    if (!resumeVersionId) throw new BadRequestError('resumeVersionId is required');

    const version = await db.resumeVersion.findUnique({
      where: { id: resumeVersionId },
      include: {
        session: { include: { user: { include: { profile: true } } } },
      },
    });
    if (!version) throw new BadRequestError('Resume version not found');
    if (version.session.userId !== req.user.sub) throw new UnauthorizedError('Unauthorized');

    const resume = version.resumeJson as GeneratedResume;

    // Resolve name: body → profile → resume metadata → fallback
    const name = fullName
      || version.session.user?.profile?.fullName
      || '';
    if (!name.trim()) throw new BadRequestError('fullName is required (not found in profile)');

    const role = targetRole
      || version.session.targetRole
      || resume.metadata?.targetRole
      || '';
    if (!role.trim()) throw new BadRequestError('targetRole is required');

    const content = await portfolioService.generate(resume, role, name);
    return this.sendOk(res, content);
  });
}

export const portfolioController = new PortfolioController();
