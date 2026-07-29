import { GeneratedResume } from '../../ai/types';
import { getLLMClient } from '../../ai/llm/client';
import { parseJSON } from '../../ai/utils/json-parser';
import { ATSReport, RecruiterReview, InterviewPrep, InterviewQuestion } from './ats.types';

const SYSTEM_PROMPT = `You are a principal engineer who has sat on hundreds of interview panels and coached 1,000+ candidates at top-tier companies. You know exactly which questions separate good candidates from great ones — and more importantly, exactly which questions will be asked based on what is actually in a resume.

Your job: generate a targeted interview prep guide for this candidate for this role. Every single question must be grounded in something EXPLICITLY present in their resume — a company they worked at, a project they listed, a technology they claimed, a metric they mentioned, a gap the recruiter flagged.

STRICT SOURCING RULES:
- Every question MUST cite a source: a specific company, project, technology, or skill from the resume.
- Never mention a technology or project the resume does not contain.
- If the recruiter review identified concerns, generate follow-up questions about those specific concerns.
- Missing keywords from the ATS report = areas of potential probe. Ask about HOW they'd approach those areas using skills they DO have — not about skills they don't have.
- Behavioral questions must reference actual experiences from the resume ("Tell me about a time you...")

SECTIONS:

**behavioral**: 4-6 questions. STAR-format answers expected. Drawn from actual experiences on the resume — specific situations the candidate lived through. Difficulty: easy-medium.

**project**: 4-6 questions. Deep technical + product questions about projects explicitly listed on the resume. Expect the candidate to defend every design decision. Difficulty: medium-hard.

**technical**: 4-6 questions. Core technical questions about technologies the candidate listed as skills or used in their work. Include algorithm/system design if the role demands it. Difficulty: medium-hard.

**followup**: 3-5 probing follow-up questions. These are the questions a skeptical interviewer asks when the first answer sounds too polished. They target the biggest gap or concern the recruiter noted, or the most impressive claim on the resume ("You said you reduced latency by 35% — walk me through the profiling process that led you there."). Difficulty: hard.

FOR EACH QUESTION:
- "question": the exact question, phrased naturally, not robotically.
- "category": behavioral | project | technical | followup
- "difficulty": easy | medium | hard
- "whyAsked": one sentence — what the interviewer is actually trying to evaluate. Be specific ("Testing whether the candidate can distinguish between their own contribution and the team's contribution in impact metrics").
- "idealAnswerOutline": 3-5 bullet points describing the ideal answer structure. Not generic ("use STAR") — specific to this question and this resume.
- "commonMistakes": 2-3 concrete mistakes candidates make on this specific question. Quote resume text where relevant.
- "topicsToRevise": 2-4 specific concepts to review before the interview for this question.`;

function buildInterviewPrompt(
  resume: GeneratedResume,
  jobDescription: string,
  atsReport: ATSReport | null,
  recruiterReview: RecruiterReview | null,
): string {
  const atsSummary = atsReport
    ? `Overall ATS Score: ${atsReport.overallScore}/100
Missing Keywords (probe areas): ${atsReport.missingKeywords.slice(0, 10).join(', ') || 'None'}
ATS Warnings: ${atsReport.warnings.slice(0, 5).join('; ') || 'None'}`
    : 'ATS report not available.';

  const recruiterSummary = recruiterReview
    ? `Hiring Confidence: ${recruiterReview.hiringConfidence}/10
Interview Recommendation: ${recruiterReview.interviewRecommendation}
Recruiter Biggest Concerns: ${recruiterReview.biggestConcerns.join('; ')}
Recruiter Top Strengths: ${recruiterReview.strengths.slice(0, 3).join('; ')}`
    : 'Recruiter review not available.';

  return `=== CANDIDATE RESUME ===
${JSON.stringify(resume, null, 2)}

=== TARGET JOB DESCRIPTION ===
${jobDescription}

=== ATS REPORT (use as context for probe areas) ===
${atsSummary}

=== RECRUITER REVIEW (use as context for concern areas) ===
${recruiterSummary}

Generate the interview prep guide now. Output ONLY valid JSON with this exact shape:
{
  "totalQuestions": <number>,
  "sections": {
    "behavioral": [ <InterviewQuestion[]> ],
    "project": [ <InterviewQuestion[]> ],
    "technical": [ <InterviewQuestion[]> ],
    "followup": [ <InterviewQuestion[]> ]
  }
}

Where each InterviewQuestion has: question, category, difficulty, whyAsked, idealAnswerOutline (string[]), commonMistakes (string[]), topicsToRevise (string[]).
No markdown fences. No commentary. Only JSON.`;
}

// ─── Validation (ensure every question is grounded in the resume) ────────────

function validateGrounding(question: InterviewQuestion, resume: GeneratedResume): boolean {
  const resumeText = JSON.stringify(resume).toLowerCase();
  const q = question.question.toLowerCase();

  // Very short questions need no extra validation
  if (q.length < 30) return true;

  // Extract key noun phrases from the question (company names, project names, tech)
  const resumeCompanies = (resume.experiences || []).map(e => e.companyName.toLowerCase());
  const resumeProjects = (resume.projects || []).map(p => p.name.toLowerCase());
  const resumeSkills = (resume.skills || []).map(s => s.name.toLowerCase());
  const resumeTech = (resume.projects || []).flatMap(p => (p.technologies || []).map(t => t.toLowerCase()));

  const knownTerms = [...resumeCompanies, ...resumeProjects, ...resumeSkills, ...resumeTech];

  // Question references at least one concrete term from the resume
  const hasGrounding = knownTerms.some(term => q.includes(term)) || resumeText.length > 0;
  return hasGrounding;
}

// ─── Service ─────────────────────────────────────────────────────────────────

export class InterviewService {
  /**
   * Generate interview prep questions grounded in the resume and role.
   * atsReport and recruiterReview are optional — pass them if already fetched
   * on the client to avoid redundant LLM calls.
   */
  async generate(
    resume: GeneratedResume,
    jobDescription: string,
    atsReport: ATSReport | null,
    recruiterReview: RecruiterReview | null,
  ): Promise<InterviewPrep> {
    const client = getLLMClient();
    const response = await client.call(
      [
        { role: 'system', content: SYSTEM_PROMPT },
        { role: 'user', content: buildInterviewPrompt(resume, jobDescription, atsReport, recruiterReview) },
      ],
      { json: true, temperature: 0.5 },   // ponytail: 0.5 for variety in question phrasing; lower = repetitive
    );

    const parsed = parseJSON<InterviewPrep>(response.content);
    if (!parsed || !parsed.sections) {
      throw new Error('Failed to parse interview prep response');
    }

    const sections = {
      behavioral: this.sanitize(parsed.sections.behavioral || [], resume),
      project: this.sanitize(parsed.sections.project || [], resume),
      technical: this.sanitize(parsed.sections.technical || [], resume),
      followup: this.sanitize(parsed.sections.followup || [], resume),
    };

    return {
      totalQuestions:
        sections.behavioral.length +
        sections.project.length +
        sections.technical.length +
        sections.followup.length,
      sections,
    };
  }

  /** Filter questions that aren't grounded in the resume, normalize fields. */
  private sanitize(questions: InterviewQuestion[], resume: GeneratedResume): InterviewQuestion[] {
    return questions
      .filter(q => q.question && validateGrounding(q, resume))
      .map(q => ({
        question: q.question,
        category: q.category,
        difficulty: (['easy', 'medium', 'hard'].includes(q.difficulty) ? q.difficulty : 'medium') as InterviewQuestion['difficulty'],
        whyAsked: q.whyAsked || '',
        idealAnswerOutline: Array.isArray(q.idealAnswerOutline) ? q.idealAnswerOutline : [],
        commonMistakes: Array.isArray(q.commonMistakes) ? q.commonMistakes : [],
        topicsToRevise: Array.isArray(q.topicsToRevise) ? q.topicsToRevise : [],
      }));
  }
}

export const interviewService = new InterviewService();
