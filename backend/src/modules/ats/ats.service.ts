import { prisma } from '../../prisma/client';
import { NotFoundError, UnauthorizedError } from '../../utils/errors';
import {
  analyzeATS,
  sanitizeRecommendationText,
  deduplicateRecommendations,
  extractResumeFacts,
  extractJdFacts,
  computeResumeJdGap,
  generateOpportunityDossier,
} from './ats.utils';
import { ATSReport, ATSRecruiterFeedback, RecruiterReview } from './ats.types';
import { GeneratedResume } from '../../ai/types';
import { getLLMClient } from '../../ai/llm/client';
import { parseJSON } from '../../ai/utils/json-parser';
import { validateRecruiterStatements, validateRecommendationList } from './statement-validator';

const SYSTEM_PROMPT_RECRUITER_REVIEW = `You are a senior technical recruiter with 15+ years of experience hiring engineers at top-tier companies (FAANG, unicorn startups, high-growth Series A-D). You have reviewed thousands of resumes and conducted hundreds of interviews. You have a reputation for being brutally honest but fair — candidates and hiring managers both respect your judgment because you're never vague, never diplomatic, and never wrong.

Your job: give a candid, senior-recruiter review of this candidate for this specific role. Write like a human recruiter, not like an AI. No bullet-point padding, no filler, no "great communicator" platitudes. If something is weak, say why. If something is strong, say what specifically makes it strong.

FORMAT RULES:
- "firstImpression": 2-3 sentences. Write exactly what you'd say in the hiring committee when someone asks "give me the quick take." No hedging.
- "interviewRecommendation": One clear sentence: HIRE, STRONG HIRE, MAYBE, or PASS. Then 1-2 sentences explaining your reasoning.
- "hiringConfidence": Integer 1-10. 1-3 = pass, 4-5 = risky, 6-7 = solid maybe, 8-10 = strong hire.
- "strengths": 3-6 items. Each is a specific strength with a concrete example from the resume. No generic praise.
- "weaknesses": 2-4 items. Each is a specific gap or concern, explained in one sentence. Be direct.
- "biggestConcerns": 2-3 items. These are the things that would make you lose sleep if you recommended this person and they failed. Be unflinching.
- "topImprovements": 3-5 items. Each is one specific, highly personalized actionable change. Must cite the candidate's actual company, project, or exact bullet text (e.g. "In your [Company] role, refine the bullet '[Text]' to..."). Never produce generic unanchored advice like "Add metrics to resume" or "Include cloud skills".
- "likelyInterviewQuestions": 4-6 questions. These are the real questions you'd prep this candidate for, based on what you see (and don't see) in the resume. Include why you'd ask each one.

PRIORITY ORDERING (non-negotiable):
- Always evaluate in this order: (1) required qualifications, (2) strongly relevant demonstrated experience, (3) major resume weaknesses, (4) preferred/nice-to-have gaps.
- Missing nice-to-have or optional technologies are LOW priority — do NOT treat them like missing core qualifications.
- If multiple technologies from the JD are absent from the resume, consolidate them into ONE weakness statement rather than listing each separately. Example: "The JD mentions PostgreSQL, Docker, Kubernetes, CI/CD, and GraphQL, but none are demonstrated in the resume." Do NOT create one weakness per technology.
- Do not repeat the same finding across weaknesses, biggestConcerns, topImprovements, and strengths. Each section must contain genuinely distinct observations.

ACKNOWLEDGE EXISTING EVIDENCE (non-negotiable):
- NEVER claim a resume "lacks metrics", "has no quantified impact", or "needs more quantification" when the resume contains numbers such as hours, users, percentages, $, counts, or "+N" figures. If quantified achievements exist, acknowledge them by name.
- Example: The bullet "Reduced editing time by 10+ hours per podcast" IS quantified. Say so. You may note that OTHER specific bullets lack metrics, but do not make a blanket claim.
- If the resume shows production deployment, ownership, or scale signals, acknowledge them.

GROUNDING RULES (non-negotiable):
- Every positive and negative observation MUST be grounded in text that actually appears in the resume. If a claim cannot be tied to a specific bullet, section, company, project, date, or number in the resume, do not make it.
- Never invent: dates, skill ratings, proficiency levels, missing education, years of experience, achievements, companies, or technologies. If the resume does not show it, it does not exist.
- Do not mention skill "levels" or ratings — they are not present in the resume.
- If information is genuinely absent (e.g. no graduation date), say it is absent rather than guessing a value.

INFERENCE CONTROL (non-negotiable):
- Distinguish three things in your review: FACT (stated in the resume), INFERENCE (your judgment derived from it), and RECOMMENDATION (a suggested next step). Never present an inference or a recommendation as a fact.
- A role is "future-dated" ONLY if its start date is AFTER the analysis date provided in the prompt. A start date on or before the analysis date is in the PAST — never call it "future-dated", "inaccurate", or "suspicious".
- Overlapping education, student-organization, and employment dates are NORMAL and completely plausible (students work while studying). Never describe overlapping dates as impossible, fraudulent, fabricated, contradictory, future-dated, inaccurate, suspicious, or an "integrity concern".
- Report a date contradiction ONLY when ONE of these is true:
  1. a single record has an end date before its own start date, OR
  2. a start date is after the analysis date (truly future-dated), OR
  3. the resume explicitly states mutually exclusive full-time commitments.
- Otherwise, overlapping dates are NOT a contradiction. Allowed wording: "Education overlaps with professional/organizational experience; this is plausible, though the nature and time commitment of the roles may be worth clarifying."
- Never use words like "impossible timeline", "factual contradiction", "integrity concern", "future-dated employment", "inaccurate dates", "suspicious overlap", or "undermines trust" unless there is an objectively impossible date relationship per the three rules above.

EXPERIENCE DURATION (non-negotiable):
- Calculate years of experience ONLY from actual experience startDate/endDate fields in the resume. Never invent or round up years.
- Projects do NOT automatically equal professional work experience. A project listed in the Projects section is not employment.
- Student organizations or campus roles should not be treated as full-time professional employment.
- If experience is below the JD requirement, report the factual gap neutrally (e.g. "Candidate has approximately X years, below the Y+ year requirement").

RECOMMENDATION GROUNDING (non-negotiable):
- Every recommendation must fall into exactly one of these forms:
  A. Resume improvement — e.g. "Quantify the Thrive Wellness bullets if measurable outcomes are available."
  B. Missing-skill disclosure — e.g. "PostgreSQL is required by the JD but is not demonstrated in the resume."
  C. Genuine-experience reminder — e.g. "If you have genuine Docker experience, add it with a supporting project or experience bullet."
- NEVER tell the candidate to "add", "learn", "implement", or "claim" a technology they do not possess merely to raise an ATS score. This applies to every technology: Docker, Kubernetes, PostgreSQL, GraphQL, WebSockets, CI/CD, GitHub Actions, and any other missing skill.
- NEVER suggest creating fake projects, fabricating experience, or inventing metrics to improve the resume.
- For a technology required by the JD but absent from the resume, state ONLY that it is not demonstrated, and add the conditional "If you have genuine experience with X, add it with evidence." Do not instruct them to fabricate or pad it.
- Do not suggest skills-gap learning plans (courses, "learn X") unless the candidate explicitly asks for one.
- EXISTING EVIDENCE RULE: If a technology already appears in the candidate's resume (in Skills, Experience, or Projects), do NOT recommend adding it to bullets or projects merely to increase keyword density. Never invent a project association (e.g. never suggest 'Add TypeScript to Project X' unless Project X in the resume already establishes TypeScript was used there). If already adequately represented, omit the recommendation.
- UNIQUE FINDINGS & DEDUPLICATION: Every recommendation, strength, and weakness must represent a distinct issue. Never produce duplicate or semantically equivalent findings with different wording (e.g. do not produce both 'Missing summary section' and 'Resume lacks a summary').
- NO FACTUAL LOCATION MODIFICATION: Never suggest changing factual location information (e.g. never suggest changing 'Remote' to 'Remote, Global'). 'Remote' is valid location information.
- METRIC RECOMMENDATIONS: Never imply that a metric exists. Never invent example numbers (15%, 20%, 30%, 500 users). If a bullet lacks metrics, say: 'Quantify the existing [Company] bullets if verified metrics are available; otherwise leave the claims unchanged.'
- ACTIONABLE RECOMMENDATIONS: Maximum 5 items. Prioritize actual errors, clarity, and redundancy. If only 2-3 strong recommendations exist, return 2-3. Do not pad with low-value formatting suggestions.`;

/**
 * Strip synthetic fields before handing a resume to the LLM so it cannot
 * fabricate ratings or metadata that were never on the original document.
 */
function sanitizeResumeForLLM(resume: GeneratedResume): GeneratedResume {
  const isUploaded = resume.metadata?.generationSessionId?.startsWith('upload-');
  const clean: any = {
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

  if (isUploaded) {
    if (clean.projects) {
      clean.projects = clean.projects.map((p: any) => {
        const { impact, ...rest } = p;
        return rest;
      });
    }
    clean.metadata = {
      targetRole: '',
      companyName: '',
      generationSessionId: '',
      generatedAt: '',
      keywordMatches: [],
      selectionRationale: '',
    };
  }

  return clean;
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

  const resumeFacts = extractResumeFacts(resume);
  const jdFacts = extractJdFacts(jobDescription);
  const gap = computeResumeJdGap(resumeFacts, jdFacts);
  const dossier = generateOpportunityDossier(resumeFacts, jdFacts, gap);

  return `=== CANDIDATE RESUME ===
${JSON.stringify(sanitizeResumeForLLM(resume), null, 2)}

${jdSection}

${analysisContext}

${dossier}

=== DETERMINISTIC ATS REPORT ===
Overall Score: ${report.overallScore}/100
${report.detailedBreakdown.map((d) => `${d.category}: ${d.score}/${d.max}`).join('\n')}
Matched Keywords: ${report.matchedKeywords.join(', ') || 'None'}
Missing Keywords: ${report.missingKeywords.join(', ') || 'None'}
Warnings: ${report.warnings.join('; ') || 'None'}

PERSONALIZATION & GROUNDING MANDATE:
- Every strength, weakness, concern, and improvement MUST cite the specific company, project, or exact bullet text from the candidate's resume.
- NEVER produce generic boilerplate recommendations like "Add quantified metrics", "Improve summary", or "Include cloud skills".
- Anchor your recommendations to the specific bullet anchors listed in the Opportunity Dossier above.
- If a skill is listed in Skills without experience evidence, advise tying that skill to the specific role where it was applied.
- For missing JD technologies, state factually that they are not demonstrated; use conditional phrasing only ("If you have genuine experience with X, add it with supporting evidence; otherwise leave it out").

Write your review now. Output ONLY valid JSON matching the schema provided — no markdown, no fences, no commentary outside the JSON.`;
}

export class AtsService {
  private async getEnrichedResume(userId: string, resumeJson: any): Promise<GeneratedResume> {
    const resume = JSON.parse(JSON.stringify(resumeJson));
    try {
      const profile = await prisma.profile.findUnique({
        where: { userId },
        include: { user: true },
      });
      if (profile) {
        if (profile.phone) resume.phone = profile.phone;
        if (profile.user?.email) resume.email = profile.user.email;
      }
    } catch (err) {
      console.warn('[ATS] Failed to fetch user profile for contact info enrichment:', err);
    }
    return resume;
  }

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

    // Enrich resume with contact details from profile
    const enrichedResume = await this.getEnrichedResume(userId, version.resumeJson);

    // 3. Deterministic scoring
    const report = analyzeATS(enrichedResume, jobDescription);

    // 4. AI qualitative review (non-blocking on failure — report stands on its own)
    try {
      const feedback = await this.generateAIReview(
        enrichedResume,
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

    // Enrich resume with contact details from profile
    const enrichedResume = await this.getEnrichedResume(userId, version.resumeJson);

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
          atsReport = analyzeATS(enrichedResume, jobDescription);
        }
      } catch {
        atsReport = analyzeATS(enrichedResume, jobDescription);
      }
    } else {
      atsReport = analyzeATS(enrichedResume, jobDescription);
    }

    return this.runRecruiterReview(enrichedResume, jobDescription, atsReport);
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
        strengths: validateRecommendationList(validated.strengths || [], resume, jobDescription),
        weaknesses: validateRecommendationList(validated.weaknesses || [], resume, jobDescription),
        biggestConcerns: validateRecommendationList(parsed.biggestConcerns || [], resume, jobDescription),
        topImprovements: validateRecommendationList(parsed.topImprovements || [], resume, jobDescription, { isQuickWin: false }).slice(0, 5),
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
    const today = new Date();
    const todayIso = today.toISOString().slice(0, 10);

    const resumeFacts = extractResumeFacts(resume);
    const jdFacts = extractJdFacts(jobDescription);
    const gap = computeResumeJdGap(resumeFacts, jdFacts);
    const dossier = generateOpportunityDossier(resumeFacts, jdFacts, gap);

    const prompt = `You are an experienced technical recruiter analyzing a resume against a job description.

You will receive:
1. The candidate's resume JSON
2. The target job description
3. A deterministic ATS score report (scores are computed algorithmically — do NOT modify or re-score them)
4. A deterministic opportunity & evidence dossier

YOUR TASK: Provide qualitative recruiter feedback ONLY. Do NOT produce any scores.

Analysis date (today): ${todayIso}
Any start date on or before ${todayIso} is in the PAST, not future-dated.
Overlapping education and employment dates are normal and plausible.

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

${dossier}

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
- GROUNDING & GAP CONSTRAINTS:
  - Do NOT recommend adding technologies that already appear in the resume.
  - For genuinely missing technologies, use ONLY conditional phrasing: "The JD mentions X, but X is not demonstrated in the resume. If you have genuine experience with X, add it with supporting evidence; otherwise leave it out."
  - Do NOT recommend adding a summary if summary is already present.
  - Do NOT recommend adding locations if locations are already present.
  - Never invent metrics, dates, or numbers.
- "strengths": what this resume does well for THIS role. Quote actual text.
- "weaknesses": concrete gaps a recruiter would flag.
- "recruiterComments": how a real recruiter would describe this candidate in 10 seconds.
- "topImprovements": 3-5 ranked, highly personalized changes. Focus on improving existing text.
  * PERSONALIZATION FORMULA: [Specific Role/Project Anchor] + [What to refine] + [Concrete outcome or technical detail].
  * FORBIDDEN (GENERIC): "Add metrics to quantify achievements", "Highlight full-stack experience", "Include cloud skills", "Improve formatting".
  * REQUIRED (PERSONALIZED): "In your [Company] role, expand the bullet '[Text]' to quantify [Metric/Outcome if available; otherwise clarify scope]."
  * SKILLS CONTEXTUALIZATION: If a skill is listed in Skills without project evidence, recommend demonstrating how that skill was applied in a specific role/project.
- "keywordRecommendations": If a technology required by the JD is missing from the resume, format ONLY as conditional: "The JD mentions X, but X is not demonstrated in the resume. If you have genuine experience with X, add it with supporting evidence." NEVER instruct the candidate to add, learn, or claim technologies or experience they do not have.
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
        strengths: validateRecommendationList(validated.strengths || [], resume, jobDescription),
        weaknesses: validateRecommendationList(validated.weaknesses || [], resume, jobDescription),
        recruiterComments: validateRecommendationList(Array.isArray(parsed.recruiterComments) ? parsed.recruiterComments : [], resume, jobDescription),
        topImprovements: validateRecommendationList(Array.isArray(parsed.topImprovements) ? parsed.topImprovements : [], resume, jobDescription, { isQuickWin: false }).slice(0, 5),
        keywordRecommendations: validateRecommendationList(Array.isArray(parsed.keywordRecommendations) ? parsed.keywordRecommendations : [], resume, jobDescription),
        formattingAdvice: validateRecommendationList(Array.isArray(parsed.formattingAdvice) ? parsed.formattingAdvice : [], resume, jobDescription),
      };
    }

    throw new Error('Failed to parse AI review response');
  }
}

export const atsService = new AtsService();
