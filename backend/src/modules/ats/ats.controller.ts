import type { Request, Response } from 'express';
import { BaseController } from '../../common/base.controller';
import { asyncHandler } from '../../utils/async-handler';
import { atsService } from './ats.service';
import { tailoringService } from './tailoring.service';
import { qualityService } from './quality.service';
import { diffService } from './diff.service';
import { healthService } from './health.service';
import { interviewService } from './interview.service';
import { coverLetterService } from './cover-letter.service';
import { ATSReport, RecruiterReview } from './ats.types';
import { BadRequestError, UnauthorizedError } from '../../utils/errors';
import { prisma } from '../../prisma/client';
import { GeneratedResume } from '../../ai/types';

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

  recruiterReview = asyncHandler(async (req: Request, res: Response) => {
    if (!req.user?.sub) {
      throw new UnauthorizedError('Unauthorized');
    }

    const { resumeVersionId, jobDescription } = req.body;
    if (!resumeVersionId) {
      throw new BadRequestError('resumeVersionId is required');
    }

    const review = await atsService.recruiterReview(req.user.sub, resumeVersionId, jobDescription);
    return this.sendOk(res, review);
  });

  tailor = asyncHandler(async (req: Request, res: Response) => {
    if (!req.user?.sub) {
      throw new UnauthorizedError('Unauthorized');
    }

    const db = prisma as any;
    const { resumeVersionId, jobDescription } = req.body;
    if (!resumeVersionId) {
      throw new BadRequestError('resumeVersionId is required');
    }

    // Fetch resume version and verify ownership
    const version = await db.resumeVersion.findUnique({
      where: { id: resumeVersionId },
      include: { session: true },
    });
    if (!version) throw new BadRequestError('Resume version not found');
    if (version.session.userId !== req.user.sub) throw new UnauthorizedError('Unauthorized');

    const jd = (jobDescription || version.session.originalJobDescription || '').trim();
    if (!jd) throw new BadRequestError('Job description is required for tailoring');

    const resumeJson = version.resumeJson as GeneratedResume;
    const tailored = await tailoringService.tailorResume(resumeJson, jd);
    return this.sendOk(res, tailored);
  });

  quality = asyncHandler(async (req: Request, res: Response) => {
    if (!req.user?.sub) {
      throw new UnauthorizedError('Unauthorized');
    }

    const db = prisma as any;
    const { resumeVersionId } = req.body;
    if (!resumeVersionId) {
      throw new BadRequestError('resumeVersionId is required');
    }

    const version = await db.resumeVersion.findUnique({
      where: { id: resumeVersionId },
      include: { session: true },
    });
    if (!version) throw new BadRequestError('Resume version not found');
    if (version.session.userId !== req.user.sub) throw new UnauthorizedError('Unauthorized');

    const report = await qualityService.analyzeQuality(version.resumeJson as GeneratedResume);
    return this.sendOk(res, report);
  });

  diff = asyncHandler(async (req: Request, res: Response) => {
    if (!req.user?.sub) {
      throw new UnauthorizedError('Unauthorized');
    }

    const db = prisma as any;
    const { oldVersionId, newVersionId } = req.body;
    if (!oldVersionId || !newVersionId) {
      throw new BadRequestError('oldVersionId and newVersionId are required');
    }
    if (oldVersionId === newVersionId) {
      throw new BadRequestError('Cannot diff a version against itself');
    }

    const [oldVersion, newVersion] = await Promise.all([
      db.resumeVersion.findUnique({ where: { id: oldVersionId }, include: { session: true } }),
      db.resumeVersion.findUnique({ where: { id: newVersionId }, include: { session: true } }),
    ]);

    if (!oldVersion || !newVersion) {
      throw new BadRequestError('One or both resume versions not found');
    }
    if (oldVersion.session.userId !== req.user.sub || newVersion.session.userId !== req.user.sub) {
      throw new UnauthorizedError('Unauthorized');
    }

    const report = await diffService.diffResumes(
      oldVersion.resumeJson as GeneratedResume,
      newVersion.resumeJson as GeneratedResume,
    );
    return this.sendOk(res, report);
  });

  health = asyncHandler(async (req: Request, res: Response) => {
    if (!req.user?.sub) {
      throw new UnauthorizedError('Unauthorized');
    }

    const { resumeVersionId } = req.body;
    if (!resumeVersionId) {
      throw new BadRequestError('resumeVersionId is required');
    }

    const report = await healthService.getReport(req.user.sub, resumeVersionId);
    return this.sendOk(res, report);
  });

  interviewPrep = asyncHandler(async (req: Request, res: Response) => {
    if (!req.user?.sub) {
      throw new UnauthorizedError('Unauthorized');
    }

    const db = prisma as any;
    const { resumeVersionId, atsReport, recruiterReview } = req.body;
    if (!resumeVersionId) {
      throw new BadRequestError('resumeVersionId is required');
    }

    const version = await db.resumeVersion.findUnique({
      where: { id: resumeVersionId },
      include: {
        session: true,
        atsRuns: { orderBy: { iterationNumber: 'desc' }, take: 1 },
      },
    });
    if (!version) throw new BadRequestError('Resume version not found');
    if (version.session.userId !== req.user.sub) throw new UnauthorizedError('Unauthorized');

    const jd = (version.session.originalJobDescription || '').trim();
    if (!jd) throw new BadRequestError('Job description is required for interview prep');

    // Resolve ATS report: caller-supplied → cached ATSRun → skip
    const resolvedAts: ATSReport | null = atsReport
      ? (atsReport as ATSReport)
      : version.atsRuns?.[0]?.suggestions
        ? (version.atsRuns[0].suggestions as unknown as ATSReport)
        : null;

    // Resolve recruiter review: caller-supplied only (not stored separately)
    const resolvedRecruiter: RecruiterReview | null = recruiterReview
      ? (recruiterReview as RecruiterReview)
      : null;

    const prep = await interviewService.generate(
      version.resumeJson as GeneratedResume,
      jd,
      resolvedAts,
      resolvedRecruiter,
    );
    return this.sendOk(res, prep);
  });

  coverLetter = asyncHandler(async (req: Request, res: Response) => {
    if (!req.user?.sub) {
      throw new UnauthorizedError('Unauthorized');
    }

    const db = prisma as any;
    const { resumeVersionId, company, role, jobDescription } = req.body;
    if (!resumeVersionId) throw new BadRequestError('resumeVersionId is required');

    const version = await db.resumeVersion.findUnique({
      where: { id: resumeVersionId },
      include: { session: true },
    });
    if (!version) throw new BadRequestError('Resume version not found');
    if (version.session.userId !== req.user.sub) throw new UnauthorizedError('Unauthorized');

    const jd = jobDescription || version.session.originalJobDescription || '';
    const targetCompany = company || version.session.companyName || '';
    const targetRole = role || version.session.targetRole || '';

    if (!jd.trim()) throw new BadRequestError('Job description is required');
    if (!targetCompany.trim()) throw new BadRequestError('Company name is required');
    if (!targetRole.trim()) throw new BadRequestError('Role is required');

    const letter = await coverLetterService.generate(
      version.resumeJson as GeneratedResume,
      jd,
      targetCompany,
      targetRole,
    );
    return this.sendOk(res, letter);
  });
}

export const atsController = new AtsController();
