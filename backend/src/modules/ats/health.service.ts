import { prisma } from '../../prisma/client';
import { GeneratedResume } from '../../ai/types';
import { ATSReport, RecruiterReview, QualityReport, HealthReport } from './ats.types';
import { analyzeATS } from './ats.utils';
import { atsService } from './ats.service';
import { qualityService } from './quality.service';

// ─── Deterministic completeness check (no LLM) ─────────────────────────────

function computeCompleteness(resume: GeneratedResume): number {
  let score = 0;

  // Summary (15 pts)
  if (resume.summary && resume.summary.trim().length > 20) score += 15;

  // Experiences (25 pts)
  if (resume.experiences?.length > 0) score += 10;
  if (resume.experiences?.some(e => e.bulletPoints?.length > 0)) score += 10;
  if (resume.experiences?.some(e => e.companyName && e.role)) score += 5;

  // Projects (20 pts)
  if (resume.projects?.length > 0) score += 10;
  if (resume.projects?.some(p => p.bulletPoints?.length > 0)) score += 5;
  if (resume.projects?.some(p => p.technologies?.length > 0)) score += 5;

  // Skills (15 pts)
  if (resume.skills?.length > 0) score += 5;
  if (resume.skills?.length >= 5) score += 5;
  if (resume.skills?.some(s => s.category)) score += 5;

  // Education (10 pts)
  if (resume.education?.length > 0) score += 5;
  if (resume.education?.some(e => e.school && e.degree)) score += 5;

  // Achievements (10 pts)
  if (resume.achievements?.length > 0) score += 5;
  if (resume.achievements?.length >= 2) score += 5;

  // Certificates (5 pts)
  if (resume.certificates?.length > 0) score += 5;

  return Math.min(100, score);
}

// ─── Aggregation logic ──────────────────────────────────────────────────────

function aggregateReport(
  resume: GeneratedResume,
  ats: ATSReport | null,
  recruiter: RecruiterReview | null,
  quality: QualityReport | null,
): HealthReport {
  // ── Category scores ──
  const resumeHealth = quality?.overallQualityScore ?? computeCompleteness(resume);
  const atsCompatibility = ats?.overallScore ?? 0;
  const recruiterAppeal = recruiter ? recruiter.hiringConfidence * 10 : 0;
  const writingQuality = quality?.writingQuality ?? 0;
  const jobMatch = ats
    ? Math.round((ats.scoreBreakdown.keywordMatch / 20) * 40 + (ats.scoreBreakdown.skillsMatch / 15) * 35 + (ats.scoreBreakdown.experienceRelevance / 15) * 25)
    : 0;
  const readability = quality?.readability ?? 0;
  const professionalTone = quality?.professionalTone ?? 0;
  const impact = quality?.impact ?? 0;
  const completeness = quality
    ? Math.round(((quality.writingQuality + quality.readability + quality.consistency) / 3))
    : computeCompleteness(resume);

  // ── Health score (weighted) ──
  const healthScore = Math.round(
    resumeHealth * 0.15 +
    atsCompatibility * 0.25 +
    recruiterAppeal * 0.15 +
    writingQuality * 0.10 +
    jobMatch * 0.10 +
    readability * 0.05 +
    professionalTone * 0.05 +
    impact * 0.10 +
    completeness * 0.05,
  );

  // ── Risk / strengths / improvements (aggregate from all sources) ──
  const topRisks: string[] = [];
  const topStrengths: string[] = [];
  const priorityImprovements: string[] = [];

  // From ATS
  if (ats) {
    if (ats.missingKeywords.length > 0) {
      topRisks.push(`Missing ${ats.missingKeywords.length} keywords from job description: ${ats.missingKeywords.slice(0, 5).join(', ')}`);
    }
    if (ats.scoreBreakdown.impact < 3) {
      topRisks.push('Low impact/quantification score — bullets lack measurable outcomes');
    }
    if (ats.overallScore >= 80) {
      topStrengths.push(`Strong ATS compatibility (${ats.overallScore}/100)`);
    }
    if (ats.strengths.length > 0) {
      topStrengths.push(...ats.strengths.slice(0, 2));
    }
    if (ats.scoreBreakdown.keywordMatch < 12) {
      priorityImprovements.push('Add missing keywords naturally into experience bullets and summary');
    }
    if (ats.scoreBreakdown.impact < 3) {
      priorityImprovements.push('Add quantified metrics to bullet points (reduced by X%, increased Y by Z)');
    }
  }

  // From Recruiter Review
  if (recruiter) {
    if (recruiter.biggestConcerns.length > 0) {
      topRisks.push(...recruiter.biggestConcerns.slice(0, 2));
    }
    if (recruiter.strengths.length > 0) {
      topStrengths.push(...recruiter.strengths.slice(0, 2));
    }
    if (recruiter.topImprovements.length > 0) {
      priorityImprovements.push(...recruiter.topImprovements.slice(0, 2));
    }
  }

  // From Quality
  if (quality) {
    if (quality.weaknesses.length > 0) {
      topRisks.push(...quality.weaknesses.slice(0, 2));
    }
    if (quality.strengths.length > 0) {
      topStrengths.push(...quality.strengths.slice(0, 2));
    }
    if (quality.quickWins.length > 0) {
      priorityImprovements.push(...quality.quickWins.slice(0, 2));
    }
  }

  // ── Confidence level ──
  const sourcesAvailable = [ats, recruiter, quality].filter(Boolean).length;
  const confidenceLevel: 'low' | 'medium' | 'high' =
    sourcesAvailable === 3 ? 'high' : sourcesAvailable === 2 ? 'medium' : 'low';

  return {
    healthScore: Math.min(100, Math.max(0, healthScore)),
    categories: {
      resumeHealth: clamp(resumeHealth),
      atsCompatibility: clamp(atsCompatibility),
      recruiterAppeal: clamp(recruiterAppeal),
      writingQuality: clamp(writingQuality),
      jobMatch: clamp(jobMatch),
      readability: clamp(readability),
      professionalTone: clamp(professionalTone),
      impact: clamp(impact),
      completeness: clamp(completeness),
    },
    topRisks: topRisks.slice(0, 5),
    topStrengths: topStrengths.slice(0, 5),
    priorityImprovements: priorityImprovements.slice(0, 5),
    confidenceLevel,
  };
}

function clamp(v: number): number {
  return Math.min(100, Math.max(0, Math.round(v)));
}

// ─── Main service ───────────────────────────────────────────────────────────

export class HealthService {
  /**
   * Get health report for a resume version. Uses cached result if available.
   * Runs missing analyses (recruiter review, quality) on demand — never reruns ATS.
   */
  async getReport(userId: string, resumeVersionId: string): Promise<HealthReport> {
    const db = prisma as any;

    const version = await db.resumeVersion.findUnique({
      where: { id: resumeVersionId },
      include: { session: true, atsRuns: { orderBy: { iterationNumber: 'desc' }, take: 1 } },
    });
    if (!version) throw new Error('Resume version not found');
    if (version.session.userId !== userId) throw new Error('Unauthorized');

    // Return cached report if available
    if (version.healthReport) {
      try {
        const cached = version.healthReport as unknown as HealthReport;
        if (cached.healthScore !== undefined && cached.categories) {
          return cached;
        }
      } catch { /* fall through */ }
    }

    const resumeJson = version.resumeJson as GeneratedResume;
    const jobDescription = (version.session.originalJobDescription || '').trim();

    // 1. ATS — reuse existing, never rerun
    let atsReport: ATSReport | null = null;
    if (version.atsRuns?.length > 0 && version.atsRuns[0].suggestions) {
      try {
        const cached = version.atsRuns[0].suggestions as unknown as ATSReport;
        if (cached.overallScore !== undefined && cached.scoreBreakdown) {
          atsReport = cached;
        }
      } catch { /* fall through */ }
    }
    if (!atsReport && jobDescription) {
      // Only run deterministic scoring (no LLM cost)
      atsReport = analyzeATS(resumeJson, jobDescription);
    }

    // 2. Recruiter Review — run if missing (single LLM call)
    let recruiterReview: RecruiterReview | null = null;
    if (jobDescription) {
      try {
        recruiterReview = await atsService.recruiterReview(userId, resumeVersionId);
      } catch (err) {
        console.error('[Health] Recruiter review failed — proceeding without.', err);
      }
    }

    // 3. Quality Analysis — run if missing (single LLM call)
    let qualityReport: QualityReport | null = null;
    try {
      qualityReport = await qualityService.analyzeQuality(resumeJson);
    } catch (err) {
      console.error('[Health] Quality analysis failed — proceeding without.', err);
    }

    // 4. Aggregate
    const report = aggregateReport(resumeJson, atsReport, recruiterReview, qualityReport);

    // 5. Cache
    try {
      await db.resumeVersion.update({
        where: { id: resumeVersionId },
        data: { healthReport: report as any },
      });
    } catch (err) {
      console.error('[Health] Failed to cache report:', err);
    }

    return report;
  }
}

export const healthService = new HealthService();
