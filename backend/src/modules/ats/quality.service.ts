import { GeneratedResume } from '../../ai/types';
import { getLLMClient } from '../../ai/llm/client';
import { parseJSON } from '../../ai/utils/json-parser';
import { QualityReport } from './ats.types';

const SYSTEM_PROMPT = `You are a senior technical recruiter and professional resume writer with 18 years of experience reviewing resumes across every industry. You have reviewed over 50,000 resumes and written career guides. You evaluate resumes purely on writing quality and presentation — you do not score for ATS, keyword density, or job-fit.

You receive a resume JSON and analyze it as a standalone document. Your assessment must be job-agnostic: judge the resume on its own merits, not how well it matches any particular role.

SCORING DIMENSIONS (each 0-100):

1. **writingQuality**: Grammar, spelling, punctuation, sentence structure. Deduct for passive voice, weak verbs, typos, inconsistent tense.

2. **professionalTone**: Is the language appropriate for a professional document? Deduct for casual phrases, slang, hyperbole ("best ever"), excessive jargon, or overly formal/stiff language.

3. **conciseness**: Are bullet points and summary tight? Deduct for filler words, redundant phrases, overly long bullets (>25 words), verbose descriptions that could be shorter.

4. **readability**: Can a recruiter scan this in 6 seconds? Deduct for wall-of-text bullets, lack of white space, buried metrics, unclear sentence flow.

5. **consistency**: Are formatting, tense, punctuation style, and bullet structure consistent throughout? Deduct for mixed date formats, inconsistent bullet punctuation, alternating tense within a role.

6. **impact**: Do bullets demonstrate measurable outcomes? Deduct for task descriptions ("Responsible for X") without results, missing metrics, vague accomplishments.

7. **redundancy**: Are there repeated skills, concepts, or phrasing? Higher score = less redundancy. Deduct for the same technology mentioned in multiple sections unnecessarily, bullets that say the same thing differently.

**overallQualityScore**: Weighted average — writingQuality (20%), conciseness (15%), readability (15%), impact (20%), consistency (10%), professionalTone (10%), redundancy (10%).

OUTPUT RULES:
- "strengths": 3-6 specific things this resume does well as a document. Quote actual text when possible.
- "weaknesses": 3-5 specific writing/presentation problems. Quote the problematic text and explain why it fails.
- "quickWins": 3-5 specific changes that would immediately improve quality. Each should be actionable ("Change 'Responsible for managing' to 'Managed' in the first bullet of Experience #2").
- "professionalReview": 3-5 sentences. Write your overall assessment the way you'd explain it to the candidate in a 1-on-1 coaching session. Be honest, specific, and constructive.

CRITICAL RULES:
- Do NOT reference ATS scores, keyword matching, or job description alignment. This is a quality-only review.
- Do NOT invent problems — only flag what you actually see in the resume text.
- Quote actual resume text in strengths and weaknesses. Generic feedback is worthless.
- Each quickWin must be a concrete, copy-pasteable change.`;

function buildQualityPrompt(resume: GeneratedResume): string {
  return `=== RESUME TO ANALYZE ===
${JSON.stringify(resume, null, 2)}

Analyze this resume's writing and presentation quality. Output ONLY valid JSON matching the schema — no markdown fences, no commentary.`;
}

export class QualityService {
  /**
   * Analyze resume writing and presentation quality (job-agnostic).
   */
  async analyzeQuality(resume: GeneratedResume): Promise<QualityReport> {
    const client = getLLMClient();
    const response = await client.call(
      [
        { role: 'system', content: SYSTEM_PROMPT },
        { role: 'user', content: buildQualityPrompt(resume) },
      ],
      { json: true, temperature: 0.2 },
    );

    const parsed = parseJSON<QualityReport>(response.content);
    if (
      parsed &&
      parsed.overallQualityScore !== undefined &&
      Array.isArray(parsed.strengths) &&
      Array.isArray(parsed.weaknesses)
    ) {
      return {
        overallQualityScore: clamp(parsed.overallQualityScore),
        writingQuality: clamp(parsed.writingQuality),
        professionalTone: clamp(parsed.professionalTone),
        conciseness: clamp(parsed.conciseness),
        readability: clamp(parsed.readability),
        consistency: clamp(parsed.consistency),
        impact: clamp(parsed.impact),
        redundancy: clamp(parsed.redundancy),
        strengths: parsed.strengths,
        weaknesses: parsed.weaknesses,
        quickWins: parsed.quickWins || [],
        professionalReview: parsed.professionalReview || '',
      };
    }

    throw new Error('Failed to parse quality analysis response');
  }
}

function clamp(v: number): number {
  return Math.min(100, Math.max(0, Math.round(v)));
}

export const qualityService = new QualityService();
