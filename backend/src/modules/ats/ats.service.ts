import { prisma } from '../../prisma/client';
import { NotFoundError, UnauthorizedError } from '../../utils/errors';
import { analyzeATS } from './ats.utils';
import { ATSReport } from './ats.types';

export class AtsService {
  /**
   * Run dynamic deterministic ATS scoring on a ResumeVersion.
   */
  async analyze(userId: string, resumeVersionId: string, customJobDescription?: string): Promise<ATSReport> {
    const db = prisma as any;

    // 1. Fetch resume version and verify user ownership via session
    const version = await db.resumeVersion.findUnique({
      where: { id: resumeVersionId },
      include: { session: true },
    });

    if (!version) {
      throw new NotFoundError('Resume version not found');
    }
    if (version.session.userId !== userId) {
      throw new UnauthorizedError('Unauthorized access to resume version');
    }

    // 2. Determine Job Description (priority: input custom JD, fallback: original session JD)
    const jobDescription = (customJobDescription || version.session.originalJobDescription || '').trim();
    if (!jobDescription) {
      throw new Error('Job description is required for ATS analysis');
    }

    // 3. Execute deterministic scoring
    const report = analyzeATS(version.resumeJson as any, jobDescription);

    // 4. Save ATSRun record to DB
    const nextIter =
      (await db.aTSRun.count({
        where: { resumeVersionId },
      })) + 1;

    await db.aTSRun.create({
      data: {
        generationSessionId: version.sessionId,
        resumeVersionId: version.id,
        overallScore: report.overallScore,
        keywordScore: report.scores.keywords,
        formattingScore: report.scores.formatting,
        readabilityScore: report.scores.readability,
        experienceScore: report.scores.experience,
        suggestions: report as any, // Serialize full report here to preserve all parsed metadata
        missingKeywords: report.missingKeywords as any,
        iterationNumber: nextIter,
      },
    });

    return report;
  }

  /**
   * Retrieve the latest ATS report for a SavedResume.
   * If none exists, run a new one using the original Job Description.
   */
  async latest(userId: string, resumeId: string): Promise<ATSReport> {
    const db = prisma as any;

    // 1. Find the saved resume
    const sr = await db.savedResume.findFirst({
      where: { id: resumeId, vault: { userId }, deletedAt: null },
      include: { version: { include: { session: true } } },
    });

    if (!sr) {
      throw new NotFoundError('Resume not found');
    }
    if (!sr.version) {
      throw new NotFoundError('Associated resume version not found');
    }

    // 2. Fetch latest run
    const latestRun = await db.aTSRun.findFirst({
      where: { resumeVersionId: sr.versionId },
      orderBy: { iterationNumber: 'desc' },
    });

    if (latestRun) {
      // Reconstruct the report from suggestions payload
      try {
        if (latestRun.suggestions && typeof latestRun.suggestions === 'object') {
          const report = latestRun.suggestions as unknown as ATSReport;
          // Ensure structure integrity
          if (report.overallScore !== undefined && report.scores) {
            return report;
          }
        }
      } catch {
        // ignore reconstruction error, fall back to analyze
      }
    }

    // 3. Fallback: run analysis using the original session's JD
    return this.analyze(userId, sr.versionId, sr.version.session.originalJobDescription);
  }
}

export const atsService = new AtsService();
