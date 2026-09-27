import { GeneratedResume } from '../../ai/types';
import { getLLMClient } from '../../ai/llm/client';
import { parseJSON } from '../../ai/utils/json-parser';
import { QualityReport } from './ats.types';
import { validateQualityStatements, validateRecommendationList } from './statement-validator';
import { env } from '../../config/env';
import {
  sanitizeRecommendationText,
  computeDeterministicQuality,
  deduplicateRecommendations,
  extractResumeFacts,
} from './ats.utils';

const SYSTEM_PROMPT = `You are a senior technical recruiter and professional resume writer with 18 years of experience reviewing resumes across every industry. You have reviewed over 50,000 resumes and written career guides. You evaluate resumes purely on writing quality and presentation — you do not score for ATS, keyword density, or job-fit.

You receive a resume JSON and analyze it as a standalone document. Your assessment must be job-agnostic: judge the resume on its own merits, not how well it matches any particular role.

SCORING CRITERIA & EXPLICIT ANCHORS (each scored 1 to 5):

1. **Grammar & Spelling** (Weight: 15%):
   - 5 = essentially error-free; clean sentence structure, no typos or grammatical errors
   - 4 = 1-2 minor issues
   - 3 = several noticeable issues
   - 2 = frequent errors
   - 1 = severe problems

2. **Readability** (Weight: 15%):
   - 5 = exemplary scanability; bullets 10-30 words, clear section hierarchy, no dense text walls
   - 4 = good scanability; 1-2 bullets slightly long or short, minimal filler
   - 3 = moderate scanability; several overly verbose or fragmented bullets, some buzzwords
   - 2 = poor scanability; walls of text, uneven section balance
   - 1 = unreadable, cluttered layout with confusing flow

3. **Formatting** (Weight: 15%):
   - 5 = clean professional structure; standard section headers, clean date formats, proper spacing
   - 4 = 1 minor formatting defect
   - 3 = noticeable formatting inconsistencies
   - 2 = multiple formatting defects across sections
   - 1 = broken, non-standard layout or chaotic hierarchy

4. **Parseability** (Weight: 15%):
   - 5 = complete contact info (email, phone, location), standard section titles, clean extraction
   - 4 = 1 missing non-critical field
   - 3 = missing important contact details or non-standard section titles
   - 2 = missing multiple required fields or obscured headings
   - 1 = unparseable document structure with broken fields

5. **Impact** (Weight: 20%):
   - 5 = strong quantified outcomes on 50%+ of bullets (metrics, %, $, scale), action verbs leading every bullet
   - 4 = solid quantified outcomes on 30-49% of bullets, mostly strong action verbs
   - 3 = few quantified metrics (15-29% of bullets), mix of tasks and outcomes
   - 2 = sparse metrics (<15% of bullets), mostly passive task descriptions ("Responsible for")
   - 1 = zero quantified achievements, entirely generic job responsibilities

6. **Conciseness** (Weight: 10%):
   - 5 = tight, punchy writing; every bullet is impactful without filler phrases or repetition
   - 4 = mostly concise; 1-2 bullets have minor fluff or wordiness
   - 3 = several wordy bullets that could be shortened by 30-50%
   - 2 = pervasive filler phrases, repeated wording, and bloated descriptions
   - 1 = extreme verbosity, rambling narratives, redundant phrasing throughout

7. **Consistency** (Weight: 10%):
   - 5 = flawless consistency; uniform bullet punctuation, consistent date formats (YYYY-MM), consistent past tense for prior roles
   - 4 = 1 minor inconsistency
   - 3 = noticeable inconsistencies across sections
   - 2 = frequent inconsistencies in punctuation, dates, and tenses
   - 1 = chaotic styling with no discernible formatting or grammatical standard

**overallQualityScore**: Calculated as Math.round(((Grammar * 0.15 + Readability * 0.15 + Formatting * 0.15 + Parseability * 0.15 + Impact * 0.20 + Conciseness * 0.10 + Consistency * 0.10) / 5) * 100).

OUTPUT SCHEMA — RETURN ONLY VALID JSON with EXACTLY these fields. Do not omit any, do not rename any, do not wrap in markdown, do not add commentary outside the JSON:
{
  "overallQualityScore": number,
  "strengths": string[],
  "weaknesses": string[],
  "quickWins": string[],
  "professionalReview": string
}

- "overallQualityScore": an integer from 0 to 100 based strictly on the weighted rubric above. You MUST output this field — never omit it.
- "strengths": 3-6 specific things this resume does well as a document. Quote actual text when possible.
- "weaknesses": 3-5 specific writing/presentation problems. Quote the problematic text and explain why it fails.
- "quickWins": 3-5 specific changes that would immediately improve quality. Each should be actionable (e.g. "Change passive phrasing to active voice in the first experience bullet").
- "professionalReview": 3-5 sentences. Write your overall assessment the way you'd explain it to the candidate in a 1-on-1 coaching session. Be honest, specific, and constructive.

CRITICAL RULES:
- Return ONLY the JSON object above. No markdown fences, no prose before or after it.
- Do NOT reference ATS scores, keyword matching, or job description alignment. This is a quality-only review.
- Do NOT invent problems — only flag what you actually see in the resume text.
- Quote actual resume text in strengths and weaknesses. Generic feedback is worthless.
- QUICK WINS RULES: Each quick win must: (1) identify one specific existing issue, (2) explain exactly where it occurs, (3) propose a factual correction, and (4) not invent new information.
- NEVER tell the candidate to add new technologies, new projects, or new responsibilities in Quick Wins.
- NEVER invent a metric or propose hypothetical numbers (e.g. do NOT suggest "add 15% improvement", "20%", "30%", or "500 users"). If an achievement lacks metrics, say "Quantify the existing [Company] bullets if verified metrics are available; otherwise leave the claims unchanged."
- NO FACTUAL LOCATION MODIFICATION: Never suggest changing factual location information (e.g. never suggest changing 'Remote' to 'Remote, Global'). 'Remote' is valid location information.
- NEVER invent coursework (e.g. do not suggest adding courses not in the resume).
- Do NOT invent resume facts, dates, or years of experience.
- GROUNDING: Every strength, weakness, and quickWin MUST quote or reference the exact resume text it concerns. Never assert something is absent (e.g. "lacks quantified impact", "no metrics", "no education dates") when the resume actually contains numbers (hours, users, %, $, +N), a graduation date, or any such detail. If a weakness is claimed, cite the offending bullet verbatim.
- UNIQUE FINDINGS & DEDUPLICATION: Every weakness and quickWin must address a different concrete issue. Never produce duplicate or semantically equivalent findings with different phrasing (e.g. do not produce both 'Missing summary section' and 'Resume lacks a summary').`;

function buildQualityPrompt(resume: GeneratedResume): string {
  const facts = extractResumeFacts(resume);
  let craftSection = '';
  if (facts.bulletOpportunities.length > 0) {
    craftSection = `\n=== WRITING CRAFT REVISION ANCHORS (Use these exact sentences for quickWins) ===\n` +
      facts.bulletOpportunities.slice(0, 5).map(o => `- [${o.section}] "${o.text}": ${o.suggestedAction}`).join('\n') + '\n';
  }

  return `=== RESUME TO ANALYZE ===
${JSON.stringify(resume, null, 2)}
${craftSection}
Analyze this resume's writing and presentation quality.
IMPORTANT FOR QUICK WINS:
- Each quick win must identify one specific existing sentence or bullet, explain where it is, and propose a concrete factual edit.
- Focus on writing craft: action verbs, conciseness, grammar, and metric quantification (only if genuine).
- Never recommend adding missing technologies or job-specific skills in quickWins.

Output ONLY valid JSON matching the schema — no markdown fences, no commentary.`;
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

function sanitizeResumeForQuality(resume: GeneratedResume): GeneratedResume {
  const isUploaded = resume.metadata?.generationSessionId?.startsWith('upload-');
  
  // Clone to avoid side effects
  const clean = JSON.parse(JSON.stringify(resume));

  // If uploaded, strip metadata and project impact to prevent quality LLM from criticizing them
  if (isUploaded) {
    if (clean.projects) {
      for (const p of clean.projects) {
        delete p.impact;
      }
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

  // Also clean up skills level to prevent LLM from commenting on missing skill levels/ratings
  if (clean.skills) {
    clean.skills = clean.skills.map((s: any) => ({ name: s.name, category: s.category }));
  }

  return clean;
}

export class QualityService {
  /**
   * Analyze resume writing and presentation quality (job-agnostic).
   */
  async analyzeQuality(resume: GeneratedResume): Promise<QualityReport> {
    const sanitizedResume = sanitizeResumeForQuality(resume);
    const client = getLLMClient();
    const response = await client.call(
      [
        { role: 'system', content: SYSTEM_PROMPT },
        { role: 'user', content: buildQualityPrompt(sanitizedResume) },
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

    // Constrain Resume Quality scores to an explicit, deterministic rubric.
    // Stable and reproducible across identical runs.
    const deterministic = computeDeterministicQuality(resume);

    // Deterministic grounding: drop unsupported statements, backfill with
    // resume-derived deterministic observations. Never displays a fabricated claim.
    const validated = validateQualityStatements(resume, report.strengths, report.weaknesses);
    return {
      ...report,
      overallQualityScore: deterministic.overallQualityScore,
      writingQuality: deterministic.writingQuality,
      professionalTone: deterministic.professionalTone,
      conciseness: deterministic.conciseness,
      readability: deterministic.readability,
      consistency: deterministic.consistency,
      impact: deterministic.impact,
      redundancy: deterministic.redundancy,
      strengths: validateRecommendationList(validated.strengths || [], resume),
      weaknesses: validateRecommendationList(validated.weaknesses || [], resume),
      quickWins: validateRecommendationList(report.quickWins || [], resume, '', { isQuickWin: true }),
    };
  }
}

function clamp(v: number): number {
  return Math.min(100, Math.max(0, Math.round(v)));
}

export const qualityService = new QualityService();
