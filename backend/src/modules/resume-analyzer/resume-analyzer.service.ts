import { atsService } from '../ats/ats.service';
import { qualityService } from '../ats/quality.service';
import { profileImportService, ExtractedProfileDTO } from '../profile/profile-import.service';
import { GeneratedResume } from '../../ai/types';
import { ATSReport, QualityReport, RecruiterReview } from '../ats/ats.types';
import { BadRequestError } from '../../utils/errors';

/** Structured engine result — the frontend renders from `status`, never guesses. */
export type EngineResult<T> =
  | { status: 'success'; data: T }
  | { status: 'failed'; error: string; data: null };

export interface ResumeAnalysisResult {
  ats: EngineResult<ATSReport>;
  quality: EngineResult<QualityReport>;
  recruiter: EngineResult<RecruiterReview>;
  parsedResume: GeneratedResume;
}

async function wrap<T>(promise: Promise<T>): Promise<EngineResult<T>> {
  try {
    const data = await promise;
    return { status: 'success', data };
  } catch (err) {
    return { status: 'failed', error: err instanceof Error ? err.message : String(err), data: null };
  }
}

/**
 * Map the structured LLM extraction (ExtractedProfileDTO) into the
 * GeneratedResume shape consumed by the ATS/quality/recruiter engines.
 */
export function mapExtractedToGenerated(dto: ExtractedProfileDTO): GeneratedResume {
  return {
    summary: dto.personalInfo?.summary || '',
    experiences: (dto.experiences || []).map((e) => ({
      companyName: e.companyName,
      role: e.role,
      location: e.location || '',
      startDate: e.startDate || undefined,
      endDate: e.isCurrent ? undefined : e.endDate || undefined,
      isCurrent: !!e.isCurrent,
      description: e.description || '',
      bulletPoints: e.achievements || [],
    })),
    projects: (dto.projects || []).map((p) => ({
      name: p.name,
      description: p.description || '',
      role: p.role || '',
      technologies: p.stack || [],
      bulletPoints: p.achievements || [],
      impact: p.description || '',
    })),
    // No synthetic skill levels — resumes do not contain proficiency ratings.
    skills: (dto.skills || []).map((s) => ({ name: s.name, category: s.category })),
    education: (dto.educations || []).map((ed) => ({
      school: ed.school,
      degree: ed.degree,
      field: ed.field || undefined,
      gpa: ed.gpa || undefined,
      startDate: ed.startDate || undefined,
      endDate: ed.endDate || undefined,
    })),
    certificates: (dto.certificates || []).map((c) => ({ name: c.name, issuer: c.issuer })),
    achievements: (dto.achievements || []).map((a) => a.title),
    metadata: {
      targetRole: '',
      companyName: '',
      generationSessionId: `upload-${Date.now()}`,
      generatedAt: new Date().toISOString(),
      keywordMatches: [],
      selectionRationale: '',
    },
  };
}

export type AnalysisProgressStepId =
  | 'uploading'
  | 'extracting'
  | 'parsing'
  | 'analyzing'
  | 'ats'
  | 'quality'
  | 'recruiter'
  | 'report';

export type AnalysisProgressEvent =
  | { type: 'step'; stepId: AnalysisProgressStepId; status: 'active' | 'completed' | 'failed'; error?: string }
  | { type: 'complete'; data: ResumeAnalysisResult }
  | { type: 'error'; error: string };

export class ResumeAnalyzerService {
  /**
   * Upload → extract text → parse → run ATS + Quality + Recruiter Review.
   * Stateless: nothing is persisted unless the caller chooses to save.
   */
  async analyze(
    buffer: Buffer,
    mimeType: string,
    originalName: string,
    jobDescription?: string,
  ): Promise<ResumeAnalysisResult> {
    // Extraction (text → structured resume) is a required first step — if it
    // fails, surface a clean 4xx, never a 500.
    let parsed: ExtractedProfileDTO;
    try {
      parsed = await profileImportService.parseImportFile(buffer, mimeType, 'resume', originalName);
    } catch (err) {
      const detail = err instanceof Error ? err.message : String(err);
      throw new BadRequestError(`Could not parse resume: ${detail}`);
    }
    const resume = mapExtractedToGenerated(parsed);
    const jd = (jobDescription || '').trim();

    // Run all three engines independently; each result carries its own status.
    // A failure in one engine never discards the others.
    const [ats, quality, recruiter] = await Promise.all([
      wrap(atsService.analyzeResume(resume, jd)),
      wrap(qualityService.analyzeQuality(resume)),
      wrap(atsService.recruiterReviewResume(resume, jd)),
    ]);

    return { ats, quality, recruiter, parsedResume: resume };
  }

  /**
   * Streaming analysis variant emitting real backend progress events as stages complete.
   */
  async analyzeStream(
    buffer: Buffer,
    mimeType: string,
    originalName: string,
    jobDescription: string | undefined,
    onEvent: (event: AnalysisProgressEvent) => void,
  ): Promise<void> {
    onEvent({ type: 'step', stepId: 'uploading', status: 'completed' });
    onEvent({ type: 'step', stepId: 'extracting', status: 'active' });

    let parsed: ExtractedProfileDTO;
    try {
      onEvent({ type: 'step', stepId: 'parsing', status: 'active' });
      parsed = await profileImportService.parseImportFile(buffer, mimeType, 'resume', originalName);
      onEvent({ type: 'step', stepId: 'extracting', status: 'completed' });
      onEvent({ type: 'step', stepId: 'parsing', status: 'completed' });
    } catch (err) {
      const detail = err instanceof Error ? err.message : String(err);
      onEvent({ type: 'step', stepId: 'extracting', status: 'failed', error: detail });
      onEvent({ type: 'step', stepId: 'parsing', status: 'failed', error: detail });
      onEvent({ type: 'error', error: `Could not parse resume: ${detail}` });
      return;
    }

    onEvent({ type: 'step', stepId: 'analyzing', status: 'active' });
    const resume = mapExtractedToGenerated(parsed);
    onEvent({ type: 'step', stepId: 'analyzing', status: 'completed' });

    const jd = (jobDescription || '').trim();

    onEvent({ type: 'step', stepId: 'ats', status: 'active' });
    onEvent({ type: 'step', stepId: 'quality', status: 'active' });
    onEvent({ type: 'step', stepId: 'recruiter', status: 'active' });

    const atsPromise = wrap(atsService.analyzeResume(resume, jd)).then((res) => {
      onEvent({
        type: 'step',
        stepId: 'ats',
        status: res.status === 'success' ? 'completed' : 'failed',
        error: res.status === 'failed' ? res.error : undefined,
      });
      return res;
    });

    const qualityPromise = wrap(qualityService.analyzeQuality(resume)).then((res) => {
      onEvent({
        type: 'step',
        stepId: 'quality',
        status: res.status === 'success' ? 'completed' : 'failed',
        error: res.status === 'failed' ? res.error : undefined,
      });
      return res;
    });

    const recruiterPromise = wrap(atsService.recruiterReviewResume(resume, jd)).then((res) => {
      onEvent({
        type: 'step',
        stepId: 'recruiter',
        status: res.status === 'success' ? 'completed' : 'failed',
        error: res.status === 'failed' ? res.error : undefined,
      });
      return res;
    });

    const [ats, quality, recruiter] = await Promise.all([atsPromise, qualityPromise, recruiterPromise]);

    onEvent({ type: 'step', stepId: 'report', status: 'active' });
    const result: ResumeAnalysisResult = { ats, quality, recruiter, parsedResume: resume };
    onEvent({ type: 'step', stepId: 'report', status: 'completed' });
    onEvent({ type: 'complete', data: result });
  }
}

export const resumeAnalyzerService = new ResumeAnalyzerService();
