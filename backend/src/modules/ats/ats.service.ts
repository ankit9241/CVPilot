import { prisma } from '../../prisma/client';
import { NotFoundError, UnauthorizedError } from '../../utils/errors';
import { analyzeATS } from './ats.utils';
import { ATSReport, ATSRecruiterFeedback, RecruiterReview } from './ats.types';
import { GeneratedResume } from '../../ai/types';
import { getLLMClient } from '../../ai/llm/client';
import { parseJSON } from '../../ai/utils/json-parser';
import { validateRecruiterStatements } from './statement-validator';

const SYSTEM_PROMPT_RECRUITER_REVIEW = `You are a senior technical recruiter with 15+ years of experience hiring engineers at top-tier companies (FAANG, unicorn startups, high-growth Series A-D). You have reviewed thousands of resumes and conducted hundreds of interviews. You have a reputation for being brutally honest but fair — candidates and hiring managers both respect your judgment because you're never vague, never diplomatic, and never wrong.

Your job: give a candid, senior-recruiter review of this candidate for this specific role. Write like a human recruiter, not like an AI. No bullet-point padding, no filler, no "great communicator" platitudes. If something is weak, say why. If something is strong, say what specifically makes it strong.

FORMAT RULES:
- "firstImpression": 2-3 sentences. Write exactly what you'd say in the hiring committee when someone asks "give me the quick take." No hedging.
- "interviewRecommendation": One clear sentence: HIRE, STRONG HIRE, MAYBE, or PASS. Then 1-2 sentences explaining your reasoning.
- "hiringConfidence": Integer 1-10. 1-3 = pass, 4-5 = risky, 6-7 = solid maybe, 8-10 = strong hire.
- "strengths": 3-6 items. Each is a specific strength with a concrete example from the resume. No generic praise.
- "weaknesses": 3-5 items. Each is a specific gap or concern, explained in one sentence. Be direct.
- "biggestConcerns": 2-3 items. These are the things that would make you lose sleep if you recommended this person and they failed. Be unflinching.
- "topImprovements": 3-5 items. Each is one specific, actionable change. "Add quantified metrics to the second experience bullet" level of specificity, not "improve your resume."
- "likelyInterviewQuestions": 4-6 questions. These are the real questions you'd prep this candidate for, based on what you see (and don't see) in the resume. Include why you'd ask each one.

GROUNDING RULES (non-negotiable):
- Every positive and negative observation MUST be grounded in text that actually appears in the resume. If a claim cannot be tied to a specific bullet, section, company, project, date, or number in the resume, do not make it.
- Never invent: dates, skill ratings, proficiency levels, missing education, years of experience, achievements, companies, or technologies. If the resume does not show it, it does not exist.
- Never claim a resume "lacks metrics" or "has no quantified impact" when the resume contains numbers such as hours, users, percentages, $, counts, or "+N" figures. Acknowledge any quantified impact that is present.
- Do not mention skill "levels" or ratings — they are not present in the resume.
- If information is genuinely absent (e.g. no graduation date, no metric), say it is absent rather than guessing a value.

INFERENCE CONTROL (non-negotiable):
- Distinguish three things in your review: FACT (stated in the resume), INFERENCE (your judgment derived from it), and RECOMMENDATION (a suggested next step). Never present an inference or a recommendation as a fact.
- A role is "future-dated" ONLY if its start date is AFTER the analysis date provided in the prompt. A start date on or before the analysis date is in the PAST — never call it "future-dated", "inaccurate", or "suspicious".
- Overlapping education, student-organization, and employment dates are NORMAL and completely plausible (students work while studying). Never describe overlapping dates as impossible, fraudulent, fabricated, contradictory, future-dated, inaccurate, suspicious, or an "integrity concern".
- Report a date contradiction ONLY when ONE of these is true:
  1. a single record has an end date before its own start date, OR
  2. a start date is after the analysis date (truly future-dated), OR
  3. the resume explicitly states mutually exclusive full-time commitments.
- Otherwise, overlapping dates are NOT a contradiction. Allowed wording: "Education overlaps with professional/organizational experience; this is plausible, though the nature and time commitment of the roles may be worth clarifying."

RECOMMENDATION GROUNDING (non-negotiable):
- Every recommendation must fall into exactly one of these forms:
  A. Resume improvement — e.g. "Quantify the Thrive Wellness bullets if measurable outcomes are available."
  B. Missing-skill disclosure — e.g. "PostgreSQL is required by the JD but is not demonstrated in the resume."
  C. Genuine-experience reminder — e.g. "If you have genuine Docker experience, add it with a supporting project or experience bullet."
- NEVER tell the candidate to "add", "learn", "implement", or "claim" a technology they do not possess merely to raise an ATS score. This applies to every technology: Docker, Kubernetes, PostgreSQL, GraphQL, WebSockets, CI/CD, GitHub Actions, and any other missing skill.
- For a technology required by the JD but absent from the resume, state ONLY that it is not demonstrated, and add the conditional "If you have genuine experience with X, add it with evidence." Do not instruct them to fabricate or pad it.
- Do not suggest skills-gap learning plans (courses, "learn X") unless the candidate explicitly asks for one.`;

/**
 * Strip synthetic fields before handing a resume to the LLM so it cannot
 * fabricate ratings or metadata that were never on the original document.
 */
function sanitizeResumeForLLM(resume: GeneratedResume): GeneratedResume {
  return {
    ...resume,
    skills: (resume.skills || []).map(({ name, category }) => ({ name, category })),
    metadata: {
      targetRole: resume.metadata?.targetRole || '',
      companyName: resume.metadata?.companyName || '',
      generationSessionId: resume.metadata?.generationSessionId || '',
      generatedAt: resume.metadata?.generatedAt || '',
      keywordMatches: resume.metadata?.keywordMatches || [],
      selectionRationale: resume.metadata?.selectionRationale || '',
    },
  };
}

function buildRecruiterReviewPrompt(resume: GeneratedResume, jobDescription: string, report: ATSReport): string {
  const jdSection = jobDescription.trim()
    ? `=== TARGET JOB DESCRIPTION ===\n${jobDescription}`
    : `=== TARGET JOB DESCRIPTION ===\nNone provided — assess the candidate's overall marketability and resume quality (general assessment, not role-specific).`;

  // Anchor "today" so the reviewer can judge past vs future dates correctly.
  const today = new Date();
  const todayIso = today.toISOString().slice(0, 10); // YYYY-MM-DD
  const analysisContext = `=== ANALYSIS CONTEXT ===
Analysis date (today): ${todayIso}
Any start date on or before ${todayIso} is in the PAST, not future-dated.
Overlapping education and employment dates are normal and plausible.`;

  return `=== CANDIDATE RESUME ===
${JSON.stringify(sanitizeResumeForLLM(resume), null, 2)}

${jdSection}

${analysisContext}

=== DETERMINISTIC ATS REPORT ===
Overall Score: ${report.overallScore}/100
${report.detailedBreakdown.map((d) => `${d.category}: ${d.score}/${d.max}`).join('\n')}
Matched Keywords: ${report.matchedKeywords.join(', ') || 'None'}
Missing Keywords: ${report.missingKeywords.join(', ') || 'None'}
Warnings: ${report.warnings.join('; ') || 'None'}

Write your review now. Output ONLY valid JSON matching the schema provided — no markdown, no fences, no commentary outside the JSON.`;
}

export class AtsService {
  /**
   * Run deterministic ATS scoring, then LLM qualitative review.
   */
  async analyze(userId: string, resumeVersionId: string, customJobDescription?: string): Promise<ATSReport> {
    const db = prisma as any;

    // 1. Fetch resume version and verify ownership
    const version = await db.resumeVersion.findUnique({
      where: { id: resumeVersionId },
      include: { session: true },
    });
    if (!version) throw new NotFoundError('Resume version not found');
    if (version.session.userId !== userId) throw new UnauthorizedError('Unauthorized access to resume version');

    // 2. Determine Job Description
    const jobDescription = (customJobDescription || version.session.originalJobDescription || '').trim();
    if (!jobDescription) throw new Error('Job description is required for ATS analysis');

    // 3. Deterministic scoring
    const report = analyzeATS(version.resumeJson as GeneratedResume, jobDescription);

    // 4. AI qualitative review (non-blocking on failure — report stands on its own)
    try {
      const feedback = await this.generateAIReview(
        version.resumeJson as GeneratedResume,
        jobDescription,
        report,
      );
      report.recruiterFeedback = feedback;
    } catch (err) {
      console.error('[ATS] AI review failed — proceeding with deterministic report only.', err);
    }

    // 5. Save ATSRun record
    const nextIter =
      (await db.aTSRun.count({ where: { resumeVersionId } })) + 1;

    await db.aTSRun.create({
      data: {
        generationSessionId: version.sessionId,
        resumeVersionId: version.id,
        overallScore: report.overallScore,
        keywordScore: report.scoreBreakdown.keywordMatch,
        formattingScore: report.scoreBreakdown.formatting,
        readabilityScore: report.scoreBreakdown.readability,
        experienceScore: report.scoreBreakdown.experienceRelevance,
        suggestions: report as any,
        missingKeywords: report.missingKeywords as any,
        iterationNumber: nextIter,
      },
    });

    return report;
  }

  /**
   * Retrieve the latest ATS report for a SavedResume.
   */
  async latest(userId: string, resumeId: string): Promise<ATSReport> {
    const db = prisma as any;

    const sr = await db.savedResume.findFirst({
      where: { id: resumeId, vault: { userId }, deletedAt: null },
      include: { version: { include: { session: true } } },
    });
    if (!sr) throw new NotFoundError('Resume not found');
    if (!sr.version) throw new NotFoundError('Associated resume version not found');

    const latestRun = await db.aTSRun.findFirst({
      where: { resumeVersionId: sr.versionId },
      orderBy: { iterationNumber: 'desc' },
    });

    if (latestRun?.suggestions) {
      try {
        const report = latestRun.suggestions as unknown as ATSReport;
        if (report.overallScore !== undefined && report.scoreBreakdown) {
          return report;
        }
      } catch { /* fall through */ }
    }

    return this.analyze(userId, sr.versionId, sr.version.session.originalJobDescription);
  }

  /**
   * Run deterministic ATS scoring + AI recruiter feedback on an arbitrary
   * (uploaded) resume — no ResumeVersion/DB required. Stateless.
   */
  async analyzeResume(resume: GeneratedResume, jobDescription: string): Promise<ATSReport> {
    const report = analyzeATS(resume, jobDescription);
    try {
      report.recruiterFeedback = await this.generateAIReview(resume, jobDescription, report);
    } catch (err) {
      console.error('[ATS] AI review failed — proceeding with deterministic report only.', err);
    }
    return report;
  }

  /**
   * Run a senior-recruiter persona review against an arbitrary (uploaded)
   * resume + JD. Stateless — no ResumeVersion/DB required.
   */
  /**
   * Run a senior-recruiter persona review against an arbitrary (uploaded)
   * resume. Without a JD it returns a generic marketability review.
   */
  async recruiterReviewResume(resume: GeneratedResume, jobDescription: string): Promise<RecruiterReview> {
    const atsReport = analyzeATS(resume, jobDescription);
    return this.runRecruiterReview(resume, jobDescription, atsReport);
  }

  /**
   * Run a senior-recruiter persona review against a stored resume version.
   * Returns a structured review distinct from the deterministic ATS score.
   */
  async recruiterReview(userId: string, resumeVersionId: string, customJobDescription?: string): Promise<RecruiterReview> {
    const db = prisma as any;

    const version = await db.resumeVersion.findUnique({
      where: { id: resumeVersionId },
      include: { session: true },
    });
    if (!version) throw new NotFoundError('Resume version not found');
    if (version.session.userId !== userId) throw new UnauthorizedError('Unauthorized access to resume version');

    const jobDescription = (customJobDescription || version.session.originalJobDescription || '').trim();
    if (!jobDescription) throw new Error('Job description is required for recruiter review');

    // Reuse existing ATS report or generate fresh
    let atsReport: ATSReport;
    const latestRun = await db.aTSRun.findFirst({
      where: { resumeVersionId: version.id },
      orderBy: { iterationNumber: 'desc' },
    });
    if (latestRun?.suggestions) {
      try {
        const cached = latestRun.suggestions as unknown as ATSReport;
        if (cached.overallScore !== undefined && cached.scoreBreakdown) {
          atsReport = cached;
        } else {
          atsReport = analyzeATS(version.resumeJson as GeneratedResume, jobDescription);
        }
      } catch {
        atsReport = analyzeATS(version.resumeJson as GeneratedResume, jobDescription);
      }
    } else {
      atsReport = analyzeATS(version.resumeJson as GeneratedResume, jobDescription);
    }

    return this.runRecruiterReview(version.resumeJson as GeneratedResume, jobDescription, atsReport);
  }

  /** Shared recruiter-review LLM call (used by both stored-version and uploaded flows). */
  private async runRecruiterReview(
    resume: GeneratedResume,
    jobDescription: string,
    atsReport: ATSReport,
  ): Promise<RecruiterReview> {
    const client = getLLMClient();
    const response = await client.call(
      [
        {
          role: 'system',
          content: SYSTEM_PROMPT_RECRUITER_REVIEW,
        },
        {
          role: 'user',
          content: buildRecruiterReviewPrompt(resume, jobDescription, atsReport),
        },
      ],
      { json: true, temperature: 0.4 },
    );

    const parsed = parseJSON<RecruiterReview>(response.content);
    if (
      parsed &&
      parsed.firstImpression &&
      parsed.hiringConfidence !== undefined &&
      Array.isArray(parsed.strengths)
    ) {
      // Deterministic grounding: drop unsupported statements, backfill from the
      // deterministic ATS report (its findings override LLM opinions).
      const validated = validateRecruiterStatements(
        resume,
        parsed.strengths,
        parsed.weaknesses || [],
        atsReport,
      );
      return {
        firstImpression: parsed.firstImpression,
        interviewRecommendation: parsed.interviewRecommendation || '',
        hiringConfidence: Math.min(10, Math.max(1, Math.round(parsed.hiringConfidence))),
        strengths: validated.strengths,
        weaknesses: validated.weaknesses,
        biggestConcerns: parsed.biggestConcerns || [],
        topImprovements: parsed.topImprovements || [],
        likelyInterviewQuestions: parsed.likelyInterviewQuestions || [],
      };
    }

    throw new Error('Failed to parse recruiter review response');
  }

  /**
   * Send resume + JD + deterministic ATS report to LLM for qualitative feedback.
   * The LLM does NOT produce scores — only recruiter-oriented text.
   */
  private async generateAIReview(
    resume: GeneratedResume,
    jobDescription: string,
    report: ATSReport,
  ): Promise<ATSRecruiterFeedback> {
    const prompt = `You are an experienced technical recruiter analyzing a resume against a job description.

You will receive:
1. The candidate's resume JSON
2. The target job description
3. A deterministic ATS score report (scores are computed algorithmically — do NOT modify or re-score them)

YOUR TASK: Provide qualitative recruiter feedback ONLY. Do NOT produce any scores.

Job Description:
${jobDescription}

Resume JSON:
${JSON.stringify(sanitizeResumeForLLM(resume), null, 2)}

ATS Score Report:
- Overall Score: ${report.overallScore}/100
${report.detailedBreakdown.map((d) => `- ${d.category}: ${d.score}/${d.max}`).join('\n')}
- Missing Keywords: ${report.missingKeywords.join(', ') || 'None'}
- Warnings: ${report.warnings.join('; ') || 'None'}
- Strengths: ${report.strengths.join('; ') || 'None'}

Respond with a JSON object matching this exact shape:
{
  "strengths": ["string", ...],
  "weaknesses": ["string", ...],
  "recruiterComments": ["string", ...],
  "topImprovements": ["string", ...],
  "keywordRecommendations": ["string", ...],
  "formattingAdvice": ["string", ...]
}

Rules:
- Each array should have 3-6 items.
- Be specific to THIS resume and THIS job — generic advice is useless.
- Ground every observation in the resume text: quote the exact bullet or section. Never invent dates, skill ratings, years of experience, achievements, or missing information. Never claim the resume "lacks metrics" or "has no quantified impact" when it contains numbers such as hours, users, percentages, $, or "+N" figures.
- GROUNDING: Every observation must cite the exact resume text it refers to. Never invent dates, skill ratings, years of experience, or achievements. Never claim the resume "lacks metrics" when it contains numbers (hours, users, %, $, +N) — acknowledge them.
- "strengths": what this resume does well for THIS role.
- "weaknesses": concrete gaps a recruiter would flag.
- "recruiterComments": how a real recruiter would describe this candidate in 10 seconds.
- "topImprovements": ranked list of highest-impact changes, each under 20 words.
- "keywordRecommendations": specific terms to add and WHERE to add them (section name).
- "formattingAdvice": structural changes to improve ATS parsing.
- Do NOT mention or modify scores — they are fixed.

Respond with ONLY the JSON object, no markdown fences.`;

    const client = getLLMClient();
    const response = await client.call(
      [
        { role: 'system', content: 'You are a JSON-only ATS feedback assistant. Output only valid JSON.' },
        { role: 'user', content: prompt },
      ],
      { json: true, temperature: 0.3 },
    );

    const parsed = parseJSON<ATSRecruiterFeedback>(response.content);
    if (parsed && parsed.strengths && parsed.weaknesses) {
      // Deterministic grounding + ATS backfill (same rules as the recruiter review).
      const validated = validateRecruiterStatements(
        resume,
        Array.isArray(parsed.strengths) ? parsed.strengths : [],
        Array.isArray(parsed.weaknesses) ? parsed.weaknesses : [],
        report,
      );
      return {
        strengths: validated.strengths,
        weaknesses: validated.weaknesses,
        recruiterComments: Array.isArray(parsed.recruiterComments) ? parsed.recruiterComments : [],
        topImprovements: Array.isArray(parsed.topImprovements) ? parsed.topImprovements : [],
        keywordRecommendations: Array.isArray(parsed.keywordRecommendations) ? parsed.keywordRecommendations : [],
        formattingAdvice: Array.isArray(parsed.formattingAdvice) ? parsed.formattingAdvice : [],
      };
    }

    throw new Error('Failed to parse AI review response');
  }
}

export const atsService = new AtsService();
