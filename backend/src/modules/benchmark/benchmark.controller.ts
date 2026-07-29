import type { Request, Response } from 'express';
import { BaseController } from '../../common/base.controller';
import { asyncHandler } from '../../utils/async-handler';
import { BadRequestError, UnauthorizedError } from '../../utils/errors';
import { prisma } from '../../prisma/client';
import { GeneratedResume } from '../../ai/types';
import { benchmarkService } from './benchmark.service';

export class BenchmarkController extends BaseController {
  benchmark = asyncHandler(async (req: Request, res: Response) => {
    if (!req.user?.sub) throw new UnauthorizedError('Unauthorized');

    const db = prisma as any;
    const { resumeVersionId, role } = req.body;
    if (!resumeVersionId) throw new BadRequestError('resumeVersionId is required');

    const version = await db.resumeVersion.findUnique({
      where: { id: resumeVersionId },
      include: { session: true },
    });
    if (!version) throw new BadRequestError('Resume version not found');
    if (version.session.userId !== req.user.sub) throw new UnauthorizedError('Unauthorized');

    const resume = version.resumeJson as GeneratedResume;
    const targetRole = role || version.session.targetRole || resume.metadata?.targetRole || '';
    if (!targetRole.trim()) throw new BadRequestError('role is required');

    const report = await benchmarkService.benchmark(resume, targetRole);
    return this.sendOk(res, report);
  });
}

export const benchmarkController = new BenchmarkController();
