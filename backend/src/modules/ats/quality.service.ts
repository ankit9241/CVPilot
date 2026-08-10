import { GeneratedResume } from '../../ai/types';
import { getLLMClient } from '../../ai/llm/client';
import { parseJSON } from '../../ai/utils/json-parser';
import { QualityReport } from './ats.types';
import { validateQualityStatements } from './statement-validator';
import { env } from '../../config/env';

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

OUTPUT SCHEMA — RETURN ONLY VALID JSON with EXACTLY these fields. Do not omit any, do not rename any, do not wrap in markdown, do not add commentary outside the JSON:
{
  "overallQualityScore": number,
  "strengths": string[],
  "weaknesses": string[],
  "quickWins": string[],
  "professionalReview": string
}

- "overallQualityScore": an integer from 0 to 100 (the weighted average described above). You MUST output this field — never omit it. Base it on: grammar, spelling, readability, formatting, clarity, conciseness, consistency, bullet quality, quantified impact, redundancy, and professional presentation. Do NOT factor in ATS keyword match or job description alignment — that is handled separately.
- "strengths": 3-6 specific things this resume does well as a document. Quote actual text when possible.
- "weaknesses": 3-5 specific writing/presentation problems. Quote the problematic text and explain why it fails.
- "quickWins": 3-5 specific changes that would immediately improve quality. Each should be actionable ("Change 'Responsible for managing' to 'Managed' in the first bullet of Experience #2").
- "professionalReview": 3-5 sentences. Write your overall assessment the way you'd explain it to the candidate in a 1-on-1 coaching session. Be honest, specific, and constructive.

CRITICAL RULES:
- Return ONLY the JSON object above. No markdown fences, no prose before or after it.
- Do NOT reference ATS scores, keyword matching, or job description alignment. This is a quality-only review.
- Do NOT invent problems — only flag what you actually see in the resume text.
- Quote actual resume text in strengths and weaknesses. Generic feedback is worthless.
- Each quickWin must be a concrete, copy-pasteable change.
- Do NOT invent resume facts.
- GROUNDING: Every strength, weakness, and quickWin MUST quote or reference the exact resume text it concerns. Never assert something is absent (e.g. "lacks quantified impact", "no metrics", "no education dates") when the resume actually contains numbers (hours, users, %, $, +N), a graduation date, or any such detail. If a weakness is claimed, cite the offending bullet verbatim.`;

function buildQualityPrompt(resume: GeneratedResume): string {
  return `=== RESUME TO ANALYZE ===
${JSON.stringify(resume, null, 2)}

Analyze this resume's writing and presentation quality. Output ONLY valid JSON matching the schema — no markdown fences, no commentary.`;
}

export type QualityParseResult =
  | { ok: true; report: QualityReport }
  | { ok: false; reason: 'QUALITY_SCORE_MISSING' | 'QUALITY_SCORE_INVALID' | 'QUALITY_PARSE_FAILED' };

/**
 * Robustly parse + validate the LLM quality response.
 * - tolerant to markdown fences / surrounding whitespace / recoverable JSON
 * - REQUIRES `overallQualityScore` (number, or a clearly numeric string "82")
 * - never derives or invents the score from missing data
 * - optional arrays default to []; score range must be 0-100
 * Returns a structured result: QUALITY_SCORE_MISSING / QUALITY_SCORE_INVALID /
 * QUALITY_PARSE_FAILED on failure — never a silent 0.
 */
export function parseQualityResponse(raw: string): QualityParseResult {
  let parsed: any = null;
  try {
    parsed = parseJSON(raw);
  } catch {
    const m = typeof raw === 'string' ? raw.match(/\{[\s\S]*\}/) : null;
    if (m) {
      try { parsed = JSON.parse(m[0]); } catch { /* give up */ }
    }
  }
  if (!parsed || typeof parsed !== 'object') {
    return { ok: false, reason: 'QUALITY_PARSE_FAILED' };
  }

  const rawScore = parsed.overallQualityScore;
  let score: number | null = null;
  if (typeof rawScore === 'number' && !isNaN(rawScore)) {
    score = rawScore;
  } else if (typeof rawScore === 'string' && /^[+-]?\d+(\.\d+)?$/.test(rawScore.trim())) {
    score = Number(rawScore);
  }
  if (score === null) {
    return { ok: false, reason: 'QUALITY_SCORE_MISSING' };
  }
  if (score < 0 || score > 100) {
    return { ok: false, reason: 'QUALITY_SCORE_INVALID' };
  }

  return {
    ok: true,
    report: {
      overallQualityScore: clamp(score),
      writingQuality: clamp(parsed.writingQuality ?? 0),
      professionalTone: clamp(parsed.professionalTone ?? 0),
      conciseness: clamp(parsed.conciseness ?? 0),
      readability: clamp(parsed.readability ?? 0),
      consistency: clamp(parsed.consistency ?? 0),
      impact: clamp(parsed.impact ?? 0),
      redundancy: clamp(parsed.redundancy ?? 0),
      strengths: Array.isArray(parsed.strengths) ? parsed.strengths : [],
      weaknesses: Array.isArray(parsed.weaknesses) ? parsed.weaknesses : [],
      quickWins: Array.isArray(parsed.quickWins) ? parsed.quickWins : [],
      professionalReview: typeof parsed.professionalReview === 'string' ? parsed.professionalReview : '',
    },
  };
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

    if (env.isDev) {
      console.log('[Quality] raw LLM response:\n', response.content);
    }

    const result = parseQualityResponse(response.content);
    if (!result.ok) {
      console.error(`[Quality] parse failed (${result.reason}):`, String(response.content).slice(0, 500));
      throw new Error(`Quality analysis failed: ${result.reason}`);
    }
    const report = result.report;

    // Deterministic grounding: drop unsupported statements, backfill with
    // resume-derived deterministic observations. Never displays a fabricated claim.
    const validated = validateQualityStatements(resume, report.strengths, report.weaknesses);
    return { ...report, strengths: validated.strengths, weaknesses: validated.weaknesses };
  }
}

function clamp(v: number): number {
  return Math.min(100, Math.max(0, Math.round(v)));
}

export const qualityService = new QualityService();
