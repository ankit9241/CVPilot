import { BaseService } from '../../common/base.service';
import { vaultRepository, VaultRepository } from './vault.repository';
import { signVersionPdfUrl } from '../resume/resume.service';

export class VaultService extends BaseService {
  constructor(protected readonly repository: VaultRepository = vaultRepository) {
    super();
  }

  async getVault(userId: string) {
    // Fetch all COMPLETED generation sessions for this user
    const sessions = await this.repository.listAllSessionsForUser(userId);

    // We'll build a flat list first, then group
    const flatItems: {
      company: string;
      role: string;
      versionId: string;
      savedResumeId: string | null;
      title: string;
      pdfUrl: string | null;
      latexCode: string | null;
      ats: number;
      template: string;
      date: string;
      favorite: boolean;
      sessionId: string;
    }[] = [];

    for (const session of sessions) {
      for (const version of session.versions) {
        const savedResume = version.savedResumes?.[0] || null;

        // Only show resumes that were explicitly saved by the user
        if (!savedResume) {
          continue;
        }

        const latestAtsRun = version.atsRuns?.[0];

        // Sign pdfUrl if stored as S3 key
        const signedVersion = await signVersionPdfUrl(version);

        flatItems.push({
          company: session.companyName || 'Unknown',
          role: session.targetRole || 'Software Engineer',
          versionId: version.id,
          savedResumeId: savedResume.id,
          title: savedResume.title || version.label || `Version ${version.versionNo}`,
          pdfUrl: signedVersion.pdfUrl || null,
          latexCode: version.latexCode ? '[available]' : null,
          ats: latestAtsRun ? latestAtsRun.overallScore : 0,
          template: session.selectedTemplateId || 'tpl-jake',
          date: version.createdAt.toISOString(),
          favorite: savedResume.isFavorite ?? false,
          sessionId: session.id,
        });
      }
    }

    // Group by company then role
    const companyMap = new Map<string, Map<string, typeof flatItems>>();

    for (const item of flatItems) {
      if (!companyMap.has(item.company)) {
        companyMap.set(item.company, new Map());
      }
      const roleMap = companyMap.get(item.company)!;
      if (!roleMap.has(item.role)) {
        roleMap.set(item.role, []);
      }
      roleMap.get(item.role)!.push(item);
    }

    // Convert to array format the frontend expects
    const result = [];
    for (const [company, roleMap] of companyMap) {
      const roles = [];
      for (const [role, versions] of roleMap) {
        roles.push({
          role,
          versions: versions.map((v) => ({
            id: v.versionId,
            savedResumeId: v.savedResumeId,
            sessionId: v.sessionId,
            name: v.title,
            pdfUrl: v.pdfUrl,
            hasLatex: !!v.latexCode,
            ats: v.ats,
            template: v.template,
            date: v.date,
            favorite: v.favorite,
            isSaved: !!v.savedResumeId,
          })),
        });
      }
      result.push({
        company,
        logo: company.charAt(0).toUpperCase(),
        roles,
      });
    }

    return result;
  }
}

export const vaultService = new VaultService();
