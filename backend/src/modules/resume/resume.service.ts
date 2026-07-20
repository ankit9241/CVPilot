/* eslint-disable @typescript-eslint/no-explicit-any */
import { createHash, randomUUID } from 'crypto';
import { BaseService } from '../../common/base.service';
import { prisma } from '../../prisma/client';
import { BadRequestError, NotFoundError, UnauthorizedError } from '../../utils/errors';

export class ResumeService extends BaseService {
  async getDashboardStats(userId: string) {
    const db = prisma as any;

    const savedResumesCount = await db.savedResume.count({
      where: { vault: { userId }, deletedAt: null },
    });
    const sessionsCount = await db.generationSession.count({
      where: { userId },
    });
    const applicationsCount = await db.application.count({
      where: { userId },
    });
    const atsAvg = await db.aTSRun.aggregate({
      _avg: { overallScore: true },
      where: { session: { userId } },
    });

    const latestSavedResume = await db.savedResume.findFirst({
      where: { vault: { userId }, deletedAt: null },
      orderBy: { updatedAt: 'desc' },
      include: { version: true },
    });

    const activities = await db.auditLog.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: 5,
    });

    return {
      savedResumesCount,
      sessionsCount,
      applicationsCount,
      averageAts: atsAvg._avg.overallScore ? Math.round(atsAvg._avg.overallScore) : 0,
      latestResume: latestSavedResume
        ? {
            id: latestSavedResume.id,
            title: latestSavedResume.title,
            company: latestSavedResume.companyName || '',
            updatedAt: latestSavedResume.updatedAt,
          }
        : null,
      activities: activities.map((act: any) => ({
        id: act.id,
        action: act.action,
        timestamp: act.createdAt,
      })),
    };
  }

  async list(userId: string) {
    const db = prisma as any;
    return db.savedResume.findMany({
      where: { vault: { userId }, deletedAt: null },
      include: { version: true },
    });
  }

  async get(userId: string, id: string) {
    const db = prisma as any;
    const sr = await db.savedResume.findFirst({
      where: { id, vault: { userId }, deletedAt: null },
      include: { version: true },
    });
    if (!sr) throw new NotFoundError('Resume not found');
    return sr;
  }

  async create(userId: string, data: Record<string, unknown>) {
    const db = prisma as any;
    const vault = await db.resumeVault.findUnique({ where: { userId } });
    if (!vault) throw new NotFoundError('Vault not found');

    let versionId = data.versionId as string;
    if (!versionId) {
      const session = await db.generationSession.create({
        data: {
          userId,
          companyName: (data.company as string) || 'Custom',
          targetRole: (data.role as string) || 'Software Engineer',
          originalJobDescription: 'Manual Entry',
        },
      });
      const version = await db.resumeVersion.create({
        data: {
          sessionId: session.id,
          versionNo: 1,
          resumeJson: {},
        },
      });
      versionId = version.id;
    }

    return db.savedResume.create({
      data: {
        vaultId: vault.id,
        versionId,
        title: (data.title as string) || 'Untitled Resume',
        companyName: data.company as string,
        role: data.role as string,
        isFavorite: !!data.isFavorite,
      },
      include: { version: true },
    });
  }

  async update(userId: string, id: string, data: Record<string, unknown>) {
    const db = prisma as any;
    const sr = await db.savedResume.findFirst({
      where: { id, vault: { userId }, deletedAt: null },
    });
    if (!sr) throw new NotFoundError('Resume not found');

    const {
      id: _id,
      vaultId: _v,
      versionId: _vi,
      createdAt: _ca,
      updatedAt: _ua,
      ...updateData
    } = data;
    return db.savedResume.update({
      where: { id },
      data: updateData,
      include: { version: true },
    });
  }

  async remove(userId: string, id: string) {
    const db = prisma as any;
    const sr = await db.savedResume.findFirst({
      where: { id, vault: { userId }, deletedAt: null },
    });
    if (!sr) throw new NotFoundError('Resume not found');

    return db.savedResume.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
  }

  async versions(userId: string, resumeIdOrSessionId: string) {
    const db = prisma as any;

    // 1. Try finding by saved resume ID
    const sr = await db.savedResume.findFirst({
      where: { id: resumeIdOrSessionId, vault: { userId }, deletedAt: null },
      include: { version: true },
    });

    let sessionId: string | null = null;
    if (sr) {
      sessionId = sr.version?.sessionId || null;
    } else {
      // 2. Fallback: check if it's a valid session ID belonging to the user
      const session = await db.generationSession.findFirst({
        where: { id: resumeIdOrSessionId, userId },
      });
      if (session) {
        sessionId = session.id;
      }
    }

    if (!sessionId) {
      throw new NotFoundError('Resume or session not found');
    }

    const list = await db.resumeVersion.findMany({
      where: { sessionId },
      orderBy: { versionNo: 'asc' },
    });

    return Promise.all(list.map((v: any) => signVersionPdfUrl(v)));
  }

  async createVersion(userId: string, resumeId: string, data: Record<string, unknown>) {
    const db = prisma as any;
    const sr = await db.savedResume.findFirst({
      where: { id: resumeId, vault: { userId }, deletedAt: null },
      include: { version: true },
    });
    if (!sr) throw new NotFoundError('Resume not found');

    const prevVersion = sr.version;
    if (!prevVersion) throw new NotFoundError('Base version not found');

    const nextVerNo =
      (await db.resumeVersion.count({
        where: { sessionId: prevVersion.sessionId },
      })) + 1;

    return db.resumeVersion.create({
      data: {
        sessionId: prevVersion.sessionId,
        versionNo: nextVerNo,
        resumeJson: (data.resumeJson || prevVersion.resumeJson) as any,
        latexCode: (data.latexCode as string) || prevVersion.latexCode,
        pdfUrl: (data.pdfUrl as string) || prevVersion.pdfUrl,
      },
    });
  }

  async render(userId: string, versionId: string, templateId: string) {
    const db = prisma as any;

    // 1. Fetch the resume version, verifying user ownership via session
    const version = await db.resumeVersion.findUnique({
      where: { id: versionId },
      include: {
        session: true,
      },
    });
    if (!version) {
      throw new NotFoundError('Resume version not found');
    }
    if (version.session.userId !== userId) {
      throw new UnauthorizedError('Unauthorized');
    }

    // 2. Fetch the user profile (with social links)
    const profile = await db.profile.findUnique({
      where: { userId },
      include: {
        socialLinks: true,
      },
    });

    // 3. Render the template
    const { templateEngineService } = await import('../../templates');
    const renderedLatex = await templateEngineService.render(
      version.resumeJson,
      templateId,
      profile,
    );

    // 4. Caching check:
    // If the rendered LaTeX matches the version's latexCode AND we already have a pdfUrl (which is an S3 key)
    if (
      version.latexCode === renderedLatex &&
      version.pdfUrl &&
      version.pdfUrl.startsWith('generated-resumes/')
    ) {
      // Update session template ID just in case
      await db.generationSession.update({
        where: { id: version.sessionId },
        data: { selectedTemplateId: templateId },
      });
      return signVersionPdfUrl(version);
    }

    // 5. Compile the LaTeX to PDF
    const { latexService } = await import('../../pdf/latex.service');
    let pdfBuffer: Buffer;
    try {
      pdfBuffer = await latexService.compile(renderedLatex);
    } catch (compileErr: any) {
      // Compilation failed: store attempted latexCode so they can see it, and throw readable error
      await db.resumeVersion.update({
        where: { id: versionId },
        data: {
          latexCode: renderedLatex,
        },
      });
      throw new BadRequestError(compileErr.message);
    }

    // 6. Upload PDF to S3
    const { uploadObject } = await import('../../storage/s3');
    const nonce = randomUUID();
    const storageKey = `generated-resumes/${userId}/${versionId}-${nonce}-resume.pdf`;

    await uploadObject(storageKey, pdfBuffer, 'application/pdf');

    // 7. Update the resume version
    const updatedVersion = await db.resumeVersion.update({
      where: { id: versionId },
      data: {
        latexCode: renderedLatex,
        pdfUrl: storageKey, // Store S3 key in database
      },
    });

    // 8. Update the session's selectedTemplateId
    await db.generationSession.update({
      where: { id: version.sessionId },
      data: {
        selectedTemplateId: templateId,
      },
    });

    return signVersionPdfUrl(updatedVersion);
  }
}

/**
 * Dynamically signs version PDF S3 keys on-the-fly
 */
export async function signVersionPdfUrl(version: any) {
  if (!version) return version;
  if (version.pdfUrl && version.pdfUrl.startsWith('generated-resumes/')) {
    try {
      const { presignGetUrl } = await import('../../storage/s3');
      const signedUrl = await presignGetUrl(version.pdfUrl);
      return {
        ...version,
        pdfUrl: signedUrl,
      };
    } catch {
      // ignore
    }
  }
  return version;
}

export class AtsService extends BaseService {
  async latest(userId: string, resumeId: string) {
    const { atsService: realAtsService } = await import('../ats/ats.service');
    return realAtsService.latest(userId, resumeId);
  }

  async analyze(userId: string, resumeId: string) {
    const db = prisma as any;
    const sr = await db.savedResume.findFirst({
      where: { id: resumeId, vault: { userId }, deletedAt: null },
      include: { version: { include: { session: true } } },
    });
    if (!sr) throw new NotFoundError('Resume not found');

    const { atsService: realAtsService } = await import('../ats/ats.service');
    return realAtsService.analyze(userId, sr.versionId, sr.version.session.originalJobDescription);
  }
}

export const resumeService = new ResumeService();
export const atsService = new AtsService();
