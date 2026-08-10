import { GeneratedResume } from '../../ai/types';
import { ATSReport } from './ats.types';
import {
  TECH_KEYWORDS,
  textHasKeyword,
  hasMetric,
  extractAllResumeText,
  getAllBullets,
} from './ats.utils';

/**
 * Deterministic statement validator for LLM-generated recruiter / quality
 * observations. No LLM calls. Every claim is checked against the parsed
 * resume; unsupported statements are dropped, then the result is backfilled
 * with deterministic observations from the ATS report (never fabricated).
 *
 * Priority: deterministic ATS findings override LLM opinions.
 */

const STOPWORDS = new Set([
  // grammatical / structural fillers
  'about','after','again','against','also','because','been','before','being','between','both','could',
  'does','doing','during','each','from','have','having','here','into','just','more','most','much','must',
  'need','never','other','over','same','should','some','such','than','that','their','them','then','there',
  'these','they','this','those','through','under','very','were','what','when','where','which','while','with',
  'would','your','this','there','from','been','will','also','your','their','that','with','have','were','should',
  // resume-structural words that appear in most resumes regardless of content —
  // they must not count as evidence overlap.
  'certified','certificate','certification','certifications','graduated','graduate','graduates','degree',
  'developer','developers','engineer','engineers','engineering','experience','experienced','role','roles',
  'company','companies','university','universities','school','team','product','platform','systems','system',
  'skills','skill','building','built','working','strong','solid','excellent','good','great','technical',
  'demonstrated','demonstrates','demonstrating','showing','shown','provide','provides','provided','including',
  'across','overall','several','various','multiple','extensive','years','year','senior','junior','middle',
  'professional','professionally','results','result','impactful','position','positions','responsibilities',
  'responsibility','projects','project','leader','leadership','solutions','solution','work','worked',
]);

const RATING_RE =
  /\b\d+\s*\/\s*5\b|\b(?:level|rating|ratings?|proficien(?:t|cy))\s*[:=]?\s*\d+\b|\b\d+\s*out\s*of\s*5\b/i;

const NEGATIVE_CLAIM_RE =
  /\b(?:no|not|without|lacks?|missing|absent|doesn'?t|hasn'?t|no experience|no exposure|not familiar|not demonstrated)\b/i;

const NO_METRIC_RE =
  /(?:no|lacks?|without|zero)\s+(?:quantified|quantifiable|measurable|concrete)?\s*(?:impact|metrics?|numbers?|quantification|results?)/i;

const RESUME_METRIC_RE =
  /\$\s?\d+(?:[.,]\d+)?[kmb]?|\b\d+(?:\.\d+)?\s*%+|\b\d+\s*\+\b|\b\d+(?:\.\d+)?\s*(?:x|×)\b|\b\d+(?:\.\d+)?\s*(?:hours|minutes|seconds|milliseconds|ms|mb|gb|kb|tb|users|customers|clients|students|requests|downloads|deployments|transactions|revenue|downtime|latency|throughput|queries|records|rows|files|jobs|builds|releases|endpoints|countries|regions|projects|repos|stars|followers|members|events|clubs|registrations|impressions|clicks|conversions|leads|sales|orders|pages|views|sessions|apps|devices|platforms)\b/i;

function normalize(s: string): string {
  return s.toLowerCase().replace(/\s+/g, ' ').trim();
}

function meaningfulTokens(s: string): string[] {
  return (s.toLowerCase().match(/[a-z][a-z0-9+#.-]*/g) || []).filter(
    (t) => t.length >= 4 && !STOPWORDS.has(t),
  );
}

function resumeYears(resume: GeneratedResume): Set<number> {
  const years = new Set<number>();
  const collect = (d?: string) => {
    if (!d) return;
    const y = parseInt(d.slice(0, 4), 10);
    if (!isNaN(y) && y > 1900) years.add(y);
  };
  for (const e of resume.experiences || []) { collect(e.startDate); collect(e.endDate); }
  for (const ed of resume.education || []) { collect(ed.startDate); collect(ed.endDate); }
  for (const m of extractAllResumeText(resume).match(/\b(19|20)\d{2}\b/g) || []) {
    years.add(parseInt(m, 10));
  }
  return years;
}

function resumeTechSet(resume: GeneratedResume): Set<string> {
  const techs = new Set<string>();
  const txt = extractAllResumeText(resume);
  for (const kw of TECH_KEYWORDS) if (textHasKeyword(txt, kw)) techs.add(kw);
  return techs;
}

/** Specific numeric claims in the statement (e.g. "40%", "10+ hours", "$50k"). */
function metricClaimsIn(statement: string): string[] {
  return (statement.match(RESUME_METRIC_RE) || []).map(normalize);
}

/**
 * Returns a rejection reason string, or null if the statement is supported.
 */
function rejectReason(statement: string, resume: GeneratedResume, ctx: {
  resumeText: string;
  years: Set<number>;
  techs: Set<string>;
}): string | null {
  const { resumeText, years, techs } = ctx;
  const normResume = normalize(resumeText);

  // 1. Fabricated skill ratings.
  if (RATING_RE.test(statement)) return 'skill rating';

  // 2. Fabricated years / dates not present in the resume.
  for (const m of statement.match(/\b(19|20)\d{2}\b/g) || []) {
    if (!years.has(parseInt(m, 10))) return `fabricated year ${m}`;
  }

  // 3. Fabricated specific metrics (numbers the resume never shows).
  const claims = metricClaimsIn(statement);
  if (claims.length > 0 && !claims.every((c) => normResume.includes(c))) {
    return 'fabricated metric';
  }

  // 4. "No quantified impact" asserted while the resume has metrics.
  if (NO_METRIC_RE.test(statement) && hasMetric(resumeText)) {
    return 'fabricated lack of metrics';
  }

  // 5. Negative claims about entities that ARE present ("Docker not demonstrated").
  if (NEGATIVE_CLAIM_RE.test(statement)) {
    for (const kw of TECH_KEYWORDS) {
      if (textHasKeyword(statement, kw) && techs.has(kw)) {
        return `negative claim about present technology ${kw}`;
      }
    }
    // Accurate negatives about absent entities are allowed (no overlap needed).
    return null;
  }

  // 6. Positive claims of technologies the resume does not contain.
  for (const kw of TECH_KEYWORDS) {
    if (textHasKeyword(statement, kw) && !techs.has(kw)) {
      return `technology ${kw} absent from resume`;
    }
  }

  // 7. Token-overlap floor — a positive statement must share vocabulary with the
  //    resume, otherwise it is ungrounded generic filler.
  const stTokens = meaningfulTokens(statement);
  if (stTokens.length > 0) {
    const rt = new Set(meaningfulTokens(resumeText));
    const techOverlap = TECH_KEYWORDS.some((kw) => textHasKeyword(statement, kw) && techs.has(kw));
    if (!techOverlap && !stTokens.some((t) => rt.has(t))) {
      return 'no supporting evidence in resume';
    }
  }

  return null;
}

function filterStatements(statements: string[], resume: GeneratedResume): {
  kept: string[];
  rejected: string[];
} {
  const ctx = {
    resumeText: extractAllResumeText(resume),
    years: resumeYears(resume),
    techs: resumeTechSet(resume),
  };
  const kept: string[] = [];
  const rejected: string[] = [];
  for (const s of statements) {
    const r = rejectReason(s, resume, ctx);
    if (r) rejected.push(`${r}: ${s}`);
    else kept.push(s);
  }
  return { kept, rejected };
}

// ─── Deterministic ATS fallback observations ─────────────────────────────────

function atsStrengthObservations(report: ATSReport): string[] {
  const out = [...(report.strengths || [])];
  const bd = report.scoreBreakdown;
  if (bd.keywordMatch >= 14) out.push('Strong keyword coverage for the target role.');
  if (bd.formatting >= 12) out.push('Good formatting consistency.');
  if (bd.readability >= 4) out.push('Good readability and scanability.');
  if (bd.skillsMatch >= 12) out.push('Strong technical breadth in required skills.');
  if (bd.impact >= 3) out.push('Quantified achievements detected in resume bullets.');
  if (bd.parseability >= 13) out.push('Consistent section organization.');
  return out;
}

function atsWeaknessObservations(report: ATSReport): string[] {
  const out = [...(report.warnings || [])];
  const bd = report.scoreBreakdown;
  if (bd.keywordMatch < 12) out.push('Low keyword coverage against the target role.');
  if (bd.skillsMatch < 10) out.push('Missing preferred or optional backend technologies.');
  if (bd.formatting < 10) out.push('Formatting inconsistencies.');
  if (bd.impact < 2) out.push('Limited quantified impact in bullet points.');
  if (report.missingKeywords?.length) {
    out.push(`Missing keywords: ${report.missingKeywords.slice(0, 5).join(', ')}.`);
  }
  return out;
}

function resumeStrengthObservations(resume: GeneratedResume): string[] {
  const out: string[] = [];
  const txt = extractAllResumeText(resume);
  if (hasMetric(txt)) out.push('Quantified metrics present in resume bullets.');
  if ((resume.experiences?.length ?? 0) >= 2) out.push('Multiple professional experiences documented.');
  if ((resume.projects?.length ?? 0) >= 1) out.push('Projects demonstrate hands-on technical ownership.');
  if (getAllBullets(resume).length > 0) out.push('Detailed bullet points with action-oriented language.');
  return out;
}

function resumeWeaknessObservations(resume: GeneratedResume): string[] {
  const out: string[] = [];
  const txt = extractAllResumeText(resume);
  if (!hasMetric(txt)) out.push('Limited quantified impact — add numbers, percentages, or dollar amounts.');
  if ((resume.experiences?.length ?? 0) === 0) out.push('No professional experience documented.');
  if ((resume.skills?.length ?? 0) === 0) out.push('No technical skills listed.');
  return out;
}

function backfill(kept: string[], observations: string[], min = 3): string[] {
  const result = [...kept];
  for (const o of observations) {
    if (result.length >= min) break;
    if (!result.includes(o)) result.push(o);
  }
  return result;
}

export interface StatementValidationResult {
  strengths: string[];
  weaknesses: string[];
  droppedStrengths: string[];
  droppedWeaknesses: string[];
}

/**
 * Validate recruiter-review statements. ATS report (when available) is the
 * deterministic backfill source; its findings override LLM opinions.
 */
export function validateRecruiterStatements(
  resume: GeneratedResume,
  strengths: string[],
  weaknesses: string[],
  atsReport?: ATSReport | null,
): StatementValidationResult {
  const s = filterStatements(strengths, resume);
  const w = filterStatements(weaknesses, resume);
  const sObs = atsReport ? atsStrengthObservations(atsReport) : resumeStrengthObservations(resume);
  const wObs = atsReport ? atsWeaknessObservations(atsReport) : resumeWeaknessObservations(resume);
  return {
    strengths: backfill(s.kept, sObs),
    weaknesses: backfill(w.kept, wObs),
    droppedStrengths: s.rejected,
    droppedWeaknesses: w.rejected,
  };
}

/**
 * Validate resume-quality statements (job-agnostic). Backfill uses
 * deterministic resume-derived observations; no ATS report required.
 */
export function validateQualityStatements(
  resume: GeneratedResume,
  strengths: string[],
  weaknesses: string[],
): StatementValidationResult {
  const s = filterStatements(strengths, resume);
  const w = filterStatements(weaknesses, resume);
  return {
    strengths: backfill(s.kept, resumeStrengthObservations(resume)),
    weaknesses: backfill(w.kept, resumeWeaknessObservations(resume)),
    droppedStrengths: s.rejected,
    droppedWeaknesses: w.rejected,
  };
}
