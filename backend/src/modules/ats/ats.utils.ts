import { GeneratedResume } from '../../ai/types';
import { ATSReport, ATSScoreBreakdown } from './ats.types';

// ─── Reference word lists ────────────────────────────────────────────────────

export const TECH_KEYWORDS = [
  'javascript', 'typescript', 'python', 'java', 'c++', 'c#', 'golang', 'rust', 'ruby', 'php', 'swift', 'kotlin', 'sql',
  'react', 'angular', 'vue', 'nextjs', 'next.js', 'nuxt', 'svelte', 'remix', 'solidjs', 'tailwind', 'sass', 'css', 'html',
  'nodejs', 'node.js', 'express', 'nestjs', 'django', 'flask', 'fastapi', 'spring boot', 'laravel', 'rails',
  'postgresql', 'postgres', 'mysql', 'mongodb', 'redis', 'elasticsearch', 'dynamodb', 'sqlite', 'mariadb', 'oracle',
  'aws', 'gcp', 'azure', 'docker', 'kubernetes', 'k8s', 'terraform', 'ci/cd', 'github actions', 'jenkins', 'git',
  'microservices', 'rest api', 'restful', 'graphql', 'grpc', 'websockets', 'webassembly', 'wasm',
  'agile', 'scrum', 'kanban', 'jira', 'confluence', 'webpack', 'vite', 'esbuild', 'jest', 'cypress', 'playwright',
  'observability', 'prometheus', 'grafana', 'datadog', 'elk', 'sentry', 'monorepo', 'lerna', 'turborepo',
  'machine learning', 'artificial intelligence', 'ai/ml', 'nlp', 'llm', 'tensorflow', 'pytorch',
  'unix', 'linux', 'macos', 'windows', 'serverless', 'lambda', 'cloudfront', 's3', 'route53', 'rds', 'ecs', 'eks',
];

const ACTION_VERBS = [
  'achieved', 'acquired', 'adapted', 'addressed', 'administered', 'advised', 'allocated', 'analyzed',
  'architected', 'assembled', 'assessed', 'audited', 'authored', 'automated', 'budgeted', 'built',
  'calculated', 'championed', 'clarified', 'coached', 'collaborated', 'compiled', 'completed', 'composed',
  'computed', 'conceptualized', 'conducted', 'consolidated', 'constructed', 'consulted', 'contracted',
  'coordinated', 'counseled', 'created', 'critiqued', 'cultivated', 'customized', 'decreased', 'defined',
  'delegated', 'delivered', 'designed', 'detected', 'determined', 'developed', 'devised', 'directed',
  'documented', 'drafted', 'edited', 'eliminated', 'engineered', 'established', 'evaluated', 'examined',
  'executed', 'expanded', 'expedited', 'facilitated', 'focused', 'forecasted', 'formulated', 'fostered',
  'founded', 'generated', 'guided', 'handled', 'identified', 'implemented', 'improved', 'increased',
  'influenced', 'informed', 'initiated', 'inspected', 'inspired', 'installed', 'instituted', 'instructed',
  'integrated', 'interpreted', 'introduced', 'invented', 'investigated', 'launched', 'led', 'managed',
  'marketed', 'maximized', 'mediated', 'mentored', 'merged', 'minimized', 'moderated', 'monitored',
  'negotiated', 'obtained', 'operated', 'optimized', 'organized', 'originated', 'overhauled', 'oversaw',
  'participated', 'partnered', 'performed', 'pioneered', 'planned', 'prepared', 'presented', 'prioritized',
  'produced', 'programmed', 'projected', 'promoted', 'proposed', 'provided', 'published', 'purchased',
  'recommended', 'reconciled', 'recorded', 'recruited', 'redesigned', 'reduced', 'referred', 'regulated',
  'reorganized', 'represented', 'researched', 'resolved', 'restructured', 'retrieved', 'reviewed',
  'revitalized', 'scheduled', 'screened', 'selected', 'served', 'shaped', 'solved', 'spearheaded',
  'standardized', 'stimulated', 'streamlined', 'strengthened', 'structured', 'supervised', 'supported',
  'surpassed', 'synthesized', 'systematized', 'tabulated', 'targeted', 'taught', 'tested', 'trained',
  'transferred', 'transformed', 'translated', 'upgraded', 'validated', 'verified', 'wrote',
];

const WEAK_WORDS = [
  'helped', 'assisted', 'responsible for', 'duties included', 'worked on', 'participated in',
  'attempted', 'tried', 'strived', 'hopeful', 'some', 'few', 'various', 'approximately',
];

const PASSIVE_PATTERNS = [
  /\bwas\s+\w+ed\b/i,
  /\bwere\s+\w+ed\b/i,
  /\bbeen\s+\w+ed\b/i,
  /\bbeing\s+\w+ed\b/i,
  /\bis\s+\w+ed\b/i,
  /\bare\s+\w+ed\b/i,
];

const FILLER_WORDS = [
  'synergy', 'leverage', 'utilize', 'utilised', 'streamline', 'optimize',
  'innovative', 'cutting-edge', 'best-in-class', 'world-class', 'results-driven',
  'detail-oriented', 'team player', 'go-getter', 'self-starter', 'dynamic',
];

const LEADERSHIP_SIGNALS = [
  'led', 'managed', 'directed', 'supervised', 'mentored', 'coached',
  'architected', 'spearheaded', 'championed', 'owned', 'drove',
  'oversaw', 'guided', 'directed', 'coordinated', 'organized',
];

const DEGREE_HIERARCHY: Record<string, number> = {
  'phd': 4, 'ph.d.': 4, 'doctorate': 4, 'doctoral': 4,
  'master': 3, 'm.s.': 3, 'ms': 3, 'm.a.': 3, 'ma': 3, 'mba': 3, 'mtech': 3, 'mca': 3,
  'bachelor': 2, 'b.s.': 2, 'bs': 2, 'b.a.': 2, 'ba': 2, 'btech': 2, 'bca': 2,
  'associate': 1, 'diploma': 1,
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function escapeRegExp(s: string) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function capitalizeWord(w: string) {
  return w ? w.charAt(0).toUpperCase() + w.slice(1) : '';
}

function clamp(val: number, min: number, max: number) {
  return Math.max(min, Math.min(max, val));
}

export function extractAllResumeText(resume: GeneratedResume): string {
  const parts: string[] = [resume.summary || ''];
  for (const exp of resume.experiences || []) {
    parts.push(exp.companyName, exp.role, exp.description || '');
    if (exp.bulletPoints) parts.push(...exp.bulletPoints);
  }
  for (const proj of resume.projects || []) {
    parts.push(proj.name, proj.description || '');
    if (proj.technologies) parts.push(...proj.technologies);
    if (proj.bulletPoints) parts.push(...proj.bulletPoints);
  }
  if (resume.skills) parts.push(...resume.skills.map((s) => s.name));
  for (const edu of resume.education || []) {
    parts.push(edu.school, edu.degree, edu.field || '');
  }
  for (const cert of resume.certificates || []) {
    parts.push(cert.name, cert.issuer);
  }
  if (resume.achievements) parts.push(...resume.achievements);
  return parts.filter(Boolean).join(' ');
}

export function getAllBullets(resume: GeneratedResume): string[] {
  const bullets: string[] = [];
  for (const exp of resume.experiences || []) {
    if (exp.bulletPoints) bullets.push(...exp.bulletPoints);
  }
  for (const proj of resume.projects || []) {
    if (proj.bulletPoints) bullets.push(...proj.bulletPoints);
  }
  return bullets;
}

function truncate(s: string, n: number): string {
  return s.length > n ? `${s.slice(0, n)}…` : s;
}

// ─── Synonym-aware keyword matching ───────────────────────────────────────────

export const SYNONYMS: Record<string, string[]> = {
  'node.js': ['node', 'nodejs', 'node js'],
  'nodejs': ['node', 'node.js', 'node js'],
  'react': ['react.js', 'reactjs', 'react js'],
  'express': ['express.js', 'expressjs'],
  'mongodb': ['mongo', 'mongo db'],
  'postgresql': ['postgres', 'postgres db'],
  'kubernetes': ['k8s'],
  'aws': ['amazon web services', 'amazon webservices', 'amazon'],
  'gcp': ['google cloud', 'google cloud platform'],
  'azure': ['microsoft azure'],
  'ci/cd': ['continuous integration', 'continuous deployment', 'cicd', 'ci cd'],
  'github actions': ['github workflows', 'github-actions', 'gha'],
  'next.js': ['nextjs', 'next js'],
  'graphql': ['graph ql'],
  'tailwind': ['tailwind css', 'tailwindcss'],
  'framer motion': ['framer-motion', 'framermotion'],
  'machine learning': ['ml'],
  'artificial intelligence': ['ai'],
  'ai/ml': ['ai', 'ml', 'machine learning', 'artificial intelligence'],
  'rest api': ['restful api', 'rest apis', 'restful', 'rest'],
  'serverless': ['serverless computing', 'faas'],
  'lambda': ['aws lambda'],
  's3': ['amazon s3', 's3 bucket'],
};

/** All surface forms of a keyword (canonical + synonyms + punctuation-normalized). */
export function keywordVariants(kw: string): string[] {
  const base = kw.toLowerCase().trim();
  const variants = new Set<string>([base, ...(SYNONYMS[base] || [])]);
  for (const v of [...variants]) {
    variants.add(v.replace(/[^a-z0-9+#]+/g, ' ').trim().replace(/\s+/g, ' '));
  }
  return [...variants].filter(Boolean);
}

/** True if `kw` (or any synonym) appears as a word in `text`. */
export function textHasKeyword(text: string, kw: string): boolean {
  const lower = text.toLowerCase();
  return keywordVariants(kw).some((v) => new RegExp(`\\b${escapeRegExp(v)}\\b`, 'i').test(lower));
}

// Every keyword form -> its canonical concept (the SYNONYMS key). Used to stop
// "nodejs" + "node.js" + "rest api" + "restful" from counting as separate
// concepts — each concept is matched exactly once.
const CONCEPT_OF: Record<string, string> = (() => {
  const map: Record<string, string> = {};
  for (const [canon, forms] of Object.entries(SYNONYMS)) {
    map[canon] = canon;
    for (const f of forms) map[f] = canon;
  }
  return map;
})();

/**
 * Extract JD keywords deduped to one per canonical concept. Preserves the JD's
 * own wording for display (prefers the longest form present in the JD text).
 */
export function extractJdKeywords(jd: string): string[] {
  const matched = TECH_KEYWORDS.filter((kw) => textHasKeyword(jd, kw));
  const seen = new Set<string>();
  const out: string[] = [];
  for (const kw of matched) {
    const canon = CONCEPT_OF[kw] ?? kw;
    if (seen.has(canon)) continue;
    seen.add(canon);
    const forms = [canon, ...(SYNONYMS[canon] || [])];
    const inJd = forms.filter((f) => textHasKeyword(jd, f)).sort((a, b) => b.length - a.length);
    out.push(inJd[0] || canon);
  }
  return out;
}

/** Weighted match across resume sections (experience/project/summary/skills). */
function matchKeywordWeighted(resume: GeneratedResume, kw: string): number {
  const sectionWeight = { experience: 4, project: 3, summary: 2, skills: 1 };
  let weight = 0;
  for (const exp of resume.experiences || []) {
    const text = [exp.role, exp.description || '', ...(exp.bulletPoints || [])].join(' ');
    if (textHasKeyword(text, kw)) weight += sectionWeight.experience;
  }
  for (const proj of resume.projects || []) {
    const text = [proj.description || '', ...(proj.bulletPoints || []), ...(proj.technologies || [])].join(' ');
    if (textHasKeyword(text, kw)) weight += sectionWeight.project;
  }
  if (textHasKeyword(resume.summary || '', kw)) weight += sectionWeight.summary;
  for (const s of resume.skills || []) {
    if (textHasKeyword(s.name, kw)) weight += sectionWeight.skills;
  }
  return weight;
}

/**
 * Presence-based match strength. A keyword found anywhere in the resume
 * (experience/project/summary/skills, synonym- or partial-aware) counts as
 * matched — section weighting is used only for evidence ordering, not to
 * halve a genuine match.
 */
function keywordMatchStrength(resume: GeneratedResume, kw: string): number {
  return matchKeywordWeighted(resume, kw) > 0 ? 1 : 0;
}

const METRIC_UNITS =
  'hours?|minutes?|seconds?|milliseconds?|ms|mb|gb|kb|tb|users?|customers?|clients?|students?|' +
  'requests?|downloads?|deployments?|transactions?|revenue|downtime|latency|throughput|' +
  'queries?|records?|rows?|files?|jobs?|builds?|releases?|endpoints?|countries?|regions?|' +
  'projects?|repos?|stars?|followers?|members?|events?|clubs?|registrations?|impressions?|' +
  'clicks?|conversions?|leads?|sales?|orders?|pages?|views?|sessions?|apps?|devices?|platforms?';

// Trailing `\b` after a non-word symbol (`+`, `%`, `×`) never matches before a
// space or end-of-string, so "40%", "10+", "90%" were invisible. Use a lookahead
// that accepts whitespace / punctuation / end-of-string instead.
const AFTER_NUM = '(?=\\s|[.,;:!?)]|$)';
const METRIC_PATTERNS = [
  new RegExp(`\\b\\d+(?:\\.\\d+)?\\s*%+${AFTER_NUM}`),                       // 40%, 2.5%
  /\$\s?\d+(?:[.,]\d+)?\s*[kmb]?(?=\s|[.,;:!?)]|$)/i,                       // $50k, $1.2M, $500
  /\b\d+(?:\.\d+)?\s*(?:x|×)\s*(?:faster|improvement|speedup|reduction|boost|increase|decrease)(?=\s|[.,;:!?)]|$)/i, // 3x faster
  new RegExp(`\\b\\d+(?:\\.\\d+)?\\s*(?:x|×)${AFTER_NUM}`),                 // 2.5x, 3x
  new RegExp(`\\b\\d+\\s*\\+{1,2}${AFTER_NUM}`),                            // 10+, 500+, 1,000+
  /\b\d+(?:\.\d+)?\s*-\s*\d+(?=\s|[.,;:!?)]|$)/,                            // ranges 10-20, 200-500ms
  new RegExp(`\\b\\d+(?:\\.\\d+)?\\s*(?:${METRIC_UNITS})(?=\\s|[.,;:!?)]|$)`, 'i'), // 500MB, 100k requests, 20 clubs
  /\b\d{1,3}(?:,\d{3})+(?:\.\d+)?(?=\s|[.,;:!?)]|$)/,                       // 1,000+
  new RegExp(`\\b\\d+(?:\\.\\d+)?[kmb]${AFTER_NUM}`, 'i'),                  // 100k, 1m, 2.5k
  new RegExp(`\\b\\d+(?:\\.\\d+)?\\s*percent${AFTER_NUM}`, 'i'),            // 40 percent
  new RegExp(`\\b(?:under|less than|over|more than|<|>)\\s*\\d+${AFTER_NUM}`, 'i'), // <200ms, over 500
];

export function hasMetric(text: string): boolean {
  return METRIC_PATTERNS.some((re) => re.test(text));
}

function wordCount(text: string): number {
  return text.split(/\s+/).filter(Boolean).length;
}

function countOccurrences(text: string, word: string): number {
  const regex = new RegExp(`\\b${escapeRegExp(word)}\\b`, 'gi');
  return (text.match(regex) || []).length;
}

function extractDegreeLevel(degreeText: string): number {
  const lower = degreeText.toLowerCase();
  let best = 0;
  for (const [key, level] of Object.entries(DEGREE_HIERARCHY)) {
    if (lower.includes(key) && level > best) best = level;
  }
  return best;
}

// ─── 1. Parseability (0–15) ──────────────────────────────────────────────────

function analyzeParseability(resume: GeneratedResume, jd: string): {
  score: number; warnings: string[]; errors: string[]; strengths: string[]; description: string;
} {
  let score = 0;
  const warnings: string[] = [];
  const errors: string[] = [];
  const strengths: string[] = [];

  // Contact extraction (0–2)
  const text = extractAllResumeText(resume);
  const hasEmail = /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}\b/.test(text);
  if (hasEmail) { score += 1; }
  else { warnings.push('Email not found in resume text — ATS may fail to extract contact info.'); }
  // Phone heuristic: 7+ digit sequences
  const hasPhone = /\b\d{7,}\b/.test(text);
  if (hasPhone) { score += 1; }
  else { warnings.push('Phone number not detected in resume text.'); }

  // Experience extraction (0–2)
  if (resume.experiences && resume.experiences.length > 0) {
    score += 1;
    const validExp = resume.experiences.filter((e) => e.companyName && e.role);
    if (validExp.length > 0) score += 1;
    else { warnings.push('Experience entries missing company name or role — hard for ATS to parse.'); }
  } else {
    errors.push('No experience section found — ATS cannot extract work history.');
  }

  // Education extraction (0–1)
  if (resume.education && resume.education.length > 0) { score += 1; }
  else { warnings.push('No education section found — ATS may flag as incomplete profile.'); }

  // Skills extraction (0–2)
  if (resume.skills && resume.skills.length > 0) {
    score += 1;
    if (resume.skills.length >= 3) score += 1;
    else { warnings.push('Very few skills listed — ATS keyword matching will be weak.'); }
  } else {
    warnings.push('No skills section found — critical for ATS keyword extraction.');
  }

  // Dates (0–2)
  const exps = resume.experiences || [];
  const hasDates = exps.length > 0 && exps.some((e) => e.startDate);
  if (hasDates) {
    score += 1;
    const allHaveDates = exps.every((e) => e.startDate);
    if (allHaveDates) score += 1;
    else { warnings.push('Some experience entries missing start date — ATS may rank them lower.'); }
  } else if (exps.length > 0) {
    warnings.push('Experience entries have no dates — ATS cannot determine career timeline.');
  }

  // Section recognition (0–3)
  const sections = [
    resume.summary, resume.experiences, resume.projects, resume.skills, resume.education,
  ];
  const presentSections = sections.filter((s) => {
    if (typeof s === 'string') return s.trim().length > 0;
    return Array.isArray(s) && s.length > 0;
  });
  score += Math.min(3, presentSections.length);

  if (presentSections.length < 3) {
    warnings.push(`Only ${presentSections.length}/5 standard sections detected — ATS may classify as low quality.`);
  }

  // Penalty for very short resume
  const wc = wordCount(text);
  if (wc < 80) {
    errors.push('Resume is extremely sparse (under 80 words) — ATS may reject or rank very low.');
    score = Math.max(0, score - 3);
  }

  score = clamp(score, 0, 15);

  if (score >= 13) strengths.push('Excellent ATS parseability — all sections and contact info detected.');
  if (errors.length === 0 && warnings.length <= 1) strengths.push('Clean structure that ATS parsers can extract without issues.');

  return { score, warnings, errors, strengths, description: `Parseability score: ${score}/15. ${presentSections.length}/5 sections present.` };
}

// ─── 2. Formatting (0–15) ────────────────────────────────────────────────────

function analyzeFormatting(resume: GeneratedResume): {
  score: number; warnings: string[]; strengths: string[]; description: string;
} {
  // Penalty model: start at max and subtract for concrete defects. This
  // discriminates quality instead of rewarding structural presence that every
  // decent resume already satisfies (which made formatting a flat ~7/15).
  let score = 15;
  const warnings: string[] = [];
  const strengths: string[] = [];
  const text = extractAllResumeText(resume);

  // Missing sections
  if (!resume.summary?.trim()) { score -= 2; warnings.push('Missing summary section.'); }
  const hasExp = (resume.experiences || []).length > 0;
  if (!hasExp) { score -= 3; warnings.push('No experience section.'); }
  else if (!(resume.projects || []).length) { score -= 1; warnings.push('No projects section.'); }
  if (!(resume.skills || []).length) { score -= 2; warnings.push('No skills section.'); }
  if (!(resume.education || []).length) { score -= 1; warnings.push('No education section.'); }

  // Contact completeness
  const hasEmail = /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}\b/.test(text);
  const hasPhone = /\b\d{7,}\b/.test(text);
  if (!hasEmail) { score -= 1; warnings.push('Email not found.'); }
  if (!hasPhone) { score -= 1; warnings.push('Phone number not detected.'); }

  // Word count
  const wc = wordCount(text);
  if (wc > 0 && wc < 150) { score -= 2; warnings.push('Resume is very sparse (under 150 words).'); }
  else if (wc > 700) { score -= 2; warnings.push('Resume likely exceeds 1 page (over 700 words).'); }
  else if (wc >= 250 && wc <= 550) strengths.push('Word count is in the optimal 1-page range.');
  else { score -= 1; warnings.push(`Word count (${wc}) is slightly off the optimal 1-page range.`); }

  // Bullet formatting — penalize length variance, not just consistency presence.
  const bullets = getAllBullets(resume);
  if (bullets.length === 0) {
    score -= 2;
    warnings.push('No bullet points found — formatting assessment limited.');
  } else {
    const lengths = bullets.map((b) => b.trim().length);
    const avgLen = lengths.reduce((a, b) => a + b, 0) / lengths.length;
    const cv = avgLen > 0
      ? Math.sqrt(lengths.reduce((a, l) => a + (l - avgLen) ** 2, 0) / lengths.length) / avgLen
      : 0;
    if (cv > 0.6) { score -= 3; warnings.push('Highly inconsistent bullet lengths.'); }
    else if (cv > 0.35) { score -= 1; warnings.push('Some bullet length inconsistency.'); }
    const reasonableLen = lengths.filter((l) => l >= 30 && l <= 200).length / lengths.length;
    if (reasonableLen < 0.7) { score -= 1; warnings.push('Many bullets too short or too long.'); }
    if (cv <= 0.35) strengths.push('Bullet lengths are consistent and clean.');
  }

  // Dates
  if (hasExp && !(resume.experiences || []).every((e) => e.startDate)) {
    score -= 1;
    warnings.push('Inconsistent date formatting across experiences.');
  }

  if (score === 15) strengths.push('Clean, consistent formatting with complete sections.');
  else if (score >= 12) strengths.push('Good overall formatting.');

  score = clamp(Math.round(score), 0, 15);
  return { score, warnings, strengths, description: `Formatting score: ${score}/15.` };
}

// ─── 3. Keyword Match (0–20) ─────────────────────────────────────────────────

function analyzeKeywordMatch(jd: string, resume: GeneratedResume): {
  score: number; matched: string[]; missing: string[]; warnings: string[]; strengths: string[];
  evidence: string[]; deductions: string[]; reason: string;
} {
  // Find which tech keywords appear in the JD (synonym-aware)
  const jdKeywords = extractJdKeywords(jd);

  if (jdKeywords.length === 0) {
    // JD present but mentions no tech keywords — nothing required, nothing missed.
    return {
      score: 20, matched: [], missing: [],
      strengths: ['No technical keywords detected in the JD — nothing required to match.'],
      warnings: [],
      evidence: [], deductions: [], reason: 'No technical keywords in the JD.',
    };
  }

  // Classify into required / preferred / optional based on surrounding context
  const sentences = jd.split(/[.!?\n]+/);
  const required: string[] = [];
  const preferred: string[] = [];
  const optional: string[] = [];

  for (const kw of jdKeywords) {
    const sentenceHas = (re: RegExp) =>
      sentences.some((s) => s.toLowerCase().includes(kw.toLowerCase()) && re.test(s.toLowerCase()));
    if (sentenceHas(/optional|nice to have|bonus|desired|plus/i)) optional.push(kw);
    else if (sentenceHas(/preferred|good to have|familiarity with/i)) preferred.push(kw);
    else required.push(kw);
  }

  // Per-tier match strength (synonym + partial aware), tiered weights:
  // required 0.6, preferred 0.25, optional 0.15 — missing optional barely hurts.
  const tierWeight: Record<string, number> = { required: 0.6, preferred: 0.25, optional: 0.15 };
  const matched: string[] = [];
  const missing: string[] = [];
  const evidence: string[] = [];
  const deductions: string[] = [];

  let totalWeight = 0;
  let matchedWeight = 0;

  const scoreTier = (tier: 'required' | 'preferred' | 'optional', kws: string[]) => {
    for (const kw of kws) {
      const strength = keywordMatchStrength(resume, kw);
      totalWeight += tierWeight[tier];
      matchedWeight += tierWeight[tier] * strength;
      if (strength > 0) {
        matched.push(kw);
        evidence.push(`✓ ${kw}`);
      } else {
        missing.push(kw);
        deductions.push(`Missing ${tier} keyword: ${kw}`);
      }
    }
  };

  scoreTier('required', required);
  scoreTier('preferred', preferred);
  scoreTier('optional', optional);

  const rawScore = totalWeight > 0 ? (matchedWeight / totalWeight) * 20 : 20;

  // Keyword stuffing penalty (unchanged behaviour)
  const fullText = extractAllResumeText(resume).toLowerCase();
  let stuffedCount = 0;
  for (const kw of matched) {
    if (countOccurrences(fullText, kw) > 5) stuffedCount++;
  }
  const stuffingPenalty = stuffedCount > 0 ? Math.min(4, stuffedCount) : 0;

  const score = clamp(Math.round(rawScore - stuffingPenalty), 0, 20);

  const warnings: string[] = [];
  const strengths: string[] = [];
  if (deductions.length > 0) {
    warnings.push(`Missing keywords: ${missing.slice(0, 5).map(capitalizeWord).join(', ')}.`);
  }
  if (stuffedCount > 0) {
    warnings.push(`Keyword stuffing detected for ${stuffedCount} term(s) — ATS may flag as spam.`);
  }
  if (matched.length / jdKeywords.length >= 0.8) strengths.push('Strong keyword alignment with the job description.');
  if (matched.length / jdKeywords.length < 0.4) warnings.push('Low keyword match — resume will rank poorly in ATS filters.');

  const reason = deductions.length > 0
    ? `Matched ${matched.length}/${jdKeywords.length} keywords. Missing ${deductions.length} ${deductions.length === 1 ? 'term' : 'terms'} (required/optional weighted).`
    : `Matched all ${jdKeywords.length} keywords.`;

  return { score, matched, missing, warnings, strengths, evidence, deductions, reason };
}

// ─── 4. Skills Match (0–15) ──────────────────────────────────────────────────

function analyzeSkillsMatch(jd: string, resume: GeneratedResume): {
  score: number; warnings: string[]; strengths: string[];
  evidence: string[]; deductions: string[]; reason: string;
} {
  const candidateSkills = (resume.skills || []).map((s) => s.name);
  const jdLower = jd.toLowerCase();

  const jdSkills = extractJdKeywords(jd);

  if (jdSkills.length === 0) {
    // JD present but mentions no tech skills — nothing required, nothing missed.
    return {
      score: 15, warnings: [], strengths: ['No specific skills required in JD — nothing to miss.'],
      evidence: [], deductions: [], reason: 'No skills required in the JD.',
    };
  }

  // Required / preferred / optional split
  const sentences = jd.split(/[.!?\n]+/);
  const requiredList: string[] = [];
  const preferredList: string[] = [];
  const optionalList: string[] = [];

  for (const skill of jdSkills) {
    const sentenceHas = (re: RegExp) =>
      sentences.some((s) => s.toLowerCase().includes(skill.toLowerCase()) && re.test(s.toLowerCase()));
    if (sentenceHas(/optional|nice to have|bonus|desired|plus/i)) optionalList.push(skill);
    else if (sentenceHas(/preferred|good to have|familiarity with/i)) preferredList.push(skill);
    else requiredList.push(skill);
  }

  const skillMatch = (skill: string) =>
    candidateSkills.some((name) => textHasKeyword(name, skill)) ||
    matchKeywordWeighted(resume, skill) > 0;

  const evidence: string[] = [];
  const deductions: string[] = [];

  // Weights: required 0.6, preferred 0.25, optional 0.15 (scaled to 15).
  const tierWeight: Record<string, number> = { required: 0.6, preferred: 0.25, optional: 0.15 };
  let totalW = 0;
  let matchedW = 0;

  const scoreTier = (tier: 'required' | 'preferred' | 'optional', list: string[]) => {
    for (const skill of list) {
      totalW += tierWeight[tier];
      if (skillMatch(skill)) {
        matchedW += tierWeight[tier];
        evidence.push(`✓ ${skill}`);
      } else {
        deductions.push(`Missing ${tier} skill: ${skill}`);
      }
    }
  };

  scoreTier('required', requiredList);
  scoreTier('preferred', preferredList);
  scoreTier('optional', optionalList);

  const score = totalW > 0 ? clamp(Math.round((matchedW / totalW) * 15), 0, 15) : 0;

  const warnings: string[] = [];
  const strengths: string[] = [];

  const missingRequired = requiredList.filter((s) => !skillMatch(s));
  if (missingRequired.length > 0) {
    warnings.push(`Missing required skills: ${missingRequired.slice(0, 5).map(capitalizeWord).join(', ')}.`);
  }
  if (requiredList.length > 0 && missingRequired.length === 0) {
    strengths.push('Matches 100% of required skills.');
  }
  if (candidateSkills.length === 0) {
    warnings.push('No skills listed on resume — critical for ATS matching.');
  }
  const extraSkills = candidateSkills.filter((s) => !jdSkills.some((k) => textHasKeyword(s, k)));
  if (extraSkills.length > 3) {
    warnings.push(`${extraSkills.length} skills listed that are not mentioned in the JD — may dilute focus.`);
  }

  const reason = deductions.length > 0
    ? `Matched ${evidence.length}/${requiredList.length + preferredList.length + optionalList.length} required/preferred/optional skills.`
    : `Matched all ${requiredList.length + preferredList.length + optionalList.length} skills.`;

  return { score, warnings, strengths, evidence, deductions, reason };
}

// ─── 5. Experience Relevance (0–15) ──────────────────────────────────────────

function analyzeExperienceRelevance(jd: string, resume: GeneratedResume): {
  score: number; warnings: string[]; strengths: string[];
  evidence: string[]; deductions: string[]; reason: string; description: string;
} {
  let score = 0;
  const warnings: string[] = [];
  const strengths: string[] = [];
  const evidence: string[] = [];
  const deductions: string[] = [];
  const experiences = resume.experiences || [];
  const jdLower = jd.toLowerCase();

  // YoE (0–3) — one factor among several, not the primary gate.
  // Unknown/missing dates are skipped gracefully (never guessed).
  let totalMonths = 0;
  for (const exp of experiences) {
    const start = exp.startDate ? new Date(exp.startDate) : null;
    const end = exp.isCurrent || !exp.endDate ? new Date() : new Date(exp.endDate);
    if (start && !isNaN(start.getTime()) && !isNaN(end.getTime())) {
      totalMonths += Math.max(0, (end.getFullYear() - start.getFullYear()) * 12 + (end.getMonth() - start.getMonth()));
    }
  }
  const candidateYoE = Math.round((totalMonths / 12) * 10) / 10;

  let requiredYoE = 0;
  const yoeRegex = /(\d+)\+?\s*(years|yoe|yr)/gi;
  let match;
  while ((match = yoeRegex.exec(jdLower)) !== null) {
    requiredYoE = Math.max(requiredYoE, parseInt(match[1], 10));
  }

  if (requiredYoE > 0) {
    if (candidateYoE >= requiredYoE) {
      score += 3;
      evidence.push(`✓ ${candidateYoE} yrs vs ${requiredYoE}+ required`);
    } else if (candidateYoE >= requiredYoE * 0.7) {
      score += 2;
      evidence.push(`~ ${candidateYoE} yrs vs ${requiredYoE}+ required`);
    } else {
      score += 1;
      deductions.push(`Experience ${candidateYoE}y below ${requiredYoE}y requirement`);
    }
  } else {
    score += 2; // No specific requirement
    if (candidateYoE > 0) evidence.push(`Has ${candidateYoE} years experience`);
  }

  // Role relevance (0–4)
  const targetRole = resume.metadata?.targetRole || '';
  const jdRoleWords = [...new Set(jdLower.split(/\s+/).filter((w) => w.length > 4))];
  let roleMatchScore = 0;
  for (const exp of experiences) {
    const expRole = exp.role.toLowerCase();
    if (jdRoleWords.some((w) => expRole.includes(w))) roleMatchScore += 2;
    if (targetRole) {
      const targetWords = targetRole.toLowerCase().split(/\s+/);
      if (targetWords.some((w) => w.length > 3 && expRole.includes(w))) roleMatchScore += 1;
    }
  }
  score += Math.min(4, roleMatchScore);
  if (roleMatchScore >= 4) strengths.push('Previous roles strongly match the target position.');
  else if (roleMatchScore < 2 && experiences.length > 0) warnings.push('Previous roles do not clearly overlap with the target position.');

  // Technology relevance (0–3) — synonym-aware
  const jdTechs = extractJdKeywords(jd);
  const expText = experiences
    .map((e) => [e.description || '', ...(e.bulletPoints || [])].join(' '))
    .join(' ');
  let techOverlap = 0;
  for (const tech of jdTechs) {
    if (textHasKeyword(expText, tech)) {
      techOverlap++;
      evidence.push(`✓ ${tech}`);
    }
  }
  const techRatio = jdTechs.length > 0 ? techOverlap / jdTechs.length : 0;
  score += Math.round(Math.min(3, techRatio * 3));
  if (techRatio > 0.6) strengths.push('Experience demonstrates strong technology overlap with the job.');

  // Qualitative signals (0–3) — production, ownership, architecture, AI,
  // scale, quantified impact, complexity, leadership.
  const allExpText = experiences
    .map((e) => [e.role, e.description || '', ...(e.bulletPoints || [])].join(' '))
    .join(' ');
  const signalChecks: Array<[string, RegExp | boolean]> = [
    ['production/deployment', /\b(production|deployed|deploy|launched|shipped|live|rollout|released)\b/i],
    ['ownership/leadership', /\b(led|owned|built from scratch|architected|designed|end-to-end|solo|drove|spearheaded)\b/i],
    ['AI/ML', /\b(\bai\b|ml|llm|machine learning|model|pipeline|transcription|nlp|computer vision|gemini|openai)\b/i],
    ['scale', /\b(scalable|scale|concurrent|thousands|millions|high-?availability|load|traffic|users?)\b/i],
    ['quantified impact', hasMetric(allExpText)],
    ['complexity/architecture', /\b(architecture|microservices|distributed|system design|optimized|caching|queues?|refactored|migrated)\b/i],
  ];
  let signalCount = 0;
  const signalLabels: string[] = [];
  for (const [label, re] of signalChecks) {
    const hit = re instanceof RegExp ? re.test(allExpText) : re;
    if (hit) {
      signalCount++;
      signalLabels.push(label);
    }
  }
  const signalScore = Math.min(3, signalCount);
  score += signalScore;
  if (signalScore > 0) {
    evidence.push(`Signals: ${signalLabels.slice(0, 4).join(', ')}`);
    if (signalCount >= 3) strengths.push('Experience shows production scope, ownership and measurable impact.');
  }

  // Career progression (0–2)
  if (experiences.length >= 2) {
    const hasLeadership = experiences.some((e) =>
      LEADERSHIP_SIGNALS.some((sig) => e.role.toLowerCase().includes(sig) || (e.description || '').toLowerCase().includes(sig))
    );
    if (hasLeadership) {
      score += 2;
      evidence.push('✓ increasing responsibility');
      strengths.push('Experience shows leadership or increasing responsibility.');
    } else {
      score += 1;
    }
  } else if (experiences.length === 1) {
    score += 1;
  }

  score = clamp(score, 0, 15);
  const reason = `YoE ${candidateYoE} (${requiredYoE > 0 ? requiredYoE + '+ required' : 'no req'}), role ${roleMatchScore}/4, tech ${techRatio.toFixed(0)}%, ${signalCount} qualitative signals.`;
  return { score, warnings, strengths, evidence, deductions, reason, description: `Experience relevance: ${score}/15.` };
}

// ─── 6. Education (0–5) ──────────────────────────────────────────────────────

function analyzeEducationMatch(jd: string, resume: GeneratedResume): {
  score: number; warnings: string[]; strengths: string[];
} {
  const educations = resume.education || [];
  if (educations.length === 0) {
    return { score: 0, warnings: ['No education section found.'], strengths: [] };
  }

  let score = 0;
  const warnings: string[] = [];
  const strengths: string[] = [];

  // Degree level match (0–3)
  const jdLower = jd.toLowerCase();
  let requiredLevel = 0;
  if (/\b(phd|ph\.d\.|doctorate|doctoral)\b/.test(jdLower)) requiredLevel = 4;
  else if (/\b(master|m\.s\.|ms|m\.a\.|ma|mba|mtech|mca)\b/.test(jdLower)) requiredLevel = 3;
  else if (/\b(bachelor|b\.s\.|bs|b\.a\.|ba|btech|bca|undergraduate)\b/.test(jdLower)) requiredLevel = 2;

  const candidateMaxLevel = Math.max(...educations.map((e) => extractDegreeLevel(e.degree + ' ' + (e.field || ''))));

  if (requiredLevel === 0) {
    score += 3;
    strengths.push('Education section present (no specific degree requirement in JD).');
  } else if (candidateMaxLevel >= requiredLevel) {
    score += 3;
    strengths.push(`Meets or exceeds education requirement (level ${candidateMaxLevel} >= ${requiredLevel}).`);
  } else if (candidateMaxLevel === requiredLevel - 1) {
    score += 2;
    warnings.push(`Degree level is slightly below JD requirement (level ${candidateMaxLevel} vs ${requiredLevel}).`);
  } else {
    score += 1;
    warnings.push(`Significant degree gap (level ${candidateMaxLevel} vs required ${requiredLevel}).`);
  }

  // Field relevance (0–1)
  const fieldKeywords = educations.map((e) => `${e.degree} ${e.field || ''}`).join(' ').toLowerCase();
  const jdFieldWords = jdLower.split(/\s+/).filter((w) => w.length > 4);
  const fieldMatch = jdFieldWords.some((w) => fieldKeywords.includes(w));
  if (fieldMatch) {
    score += 1;
    strengths.push('Education field is relevant to the job description.');
  } else {
    warnings.push('Education field does not clearly relate to the target role.');
  }

  // Complete education entries (0–1)
  const completeEntries = educations.filter((e) => e.school && e.degree).length;
  if (completeEntries > 0) {
    score += 1;
  }

  return { score: clamp(score, 0, 5), warnings, strengths };
}

// ─── 7. Grammar & Spelling (0–5) ─────────────────────────────────────────────

function analyzeGrammarSpelling(resume: GeneratedResume): {
  score: number; warnings: string[]; strengths: string[];
} {
  const bullets = getAllBullets(resume);
  if (bullets.length === 0) {
    return { score: 0, warnings: ['No bullet points to analyze for grammar.'], strengths: [] };
  }

  let score = 5; // Start perfect, deduct
  const warnings: string[] = [];
  const strengths: string[] = [];

  let passiveCount = 0;
  let weakVerbCount = 0;
  let repeatedWordCount = 0;
  let fragmentCount = 0;
  let noPeriodCount = 0;

  for (const bullet of bullets) {
    const clean = bullet.trim();
    if (clean.length === 0) continue;

    // Passive voice
    if (PASSIVE_PATTERNS.some((p) => p.test(clean))) passiveCount++;

    // Weak verbs
    const lower = clean.toLowerCase();
    if (WEAK_WORDS.some((w) => lower.includes(w))) weakVerbCount++;

    // Repeated consecutive words ("the the", "is is")
    if (/\b(\w+)\s+\1\b/i.test(clean)) repeatedWordCount++;

    // Fragments (< 20 chars, no verb-like word)
    if (clean.length < 20 && !/\b\w{3,}\b/.test(clean.slice(3))) fragmentCount++;

    // Missing terminal punctuation
    if (clean.length > 0 && !/[.!?]$/.test(clean)) noPeriodCount++;
  }

  const passiveRatio = passiveCount / bullets.length;
  if (passiveRatio > 0.3) {
    score -= Math.round(passiveRatio * 2);
    warnings.push(`${passiveCount}/${bullets.length} bullets use passive voice.`);
  }

  if (weakVerbCount > 0) {
    score -= Math.min(1, weakVerbCount > 2 ? 1 : 0.5);
    warnings.push(`${weakVerbCount} bullet(s) use weak phrases (e.g. "helped", "responsible for").`);
  }

  if (repeatedWordCount > 0) {
    score -= 0.5;
    warnings.push(`${repeatedWordCount} bullet(s) contain repeated consecutive words.`);
  }

  if (fragmentCount > 2) {
    score -= 0.5;
    warnings.push(`${fragmentCount} bullet(s) appear to be sentence fragments.`);
  }

  if (passiveCount === 0 && weakVerbCount === 0) {
    strengths.push('All bullet points use active voice and strong verbs.');
  }

  score = clamp(Math.round(score * 2) / 2, 0, 5); // Round to nearest 0.5

  return { score, warnings, strengths };
}

// ─── 8. Readability (0–5) ────────────────────────────────────────────────────

function analyzeReadability(resume: GeneratedResume): {
  score: number; warnings: string[]; strengths: string[];
} {
  const bullets = getAllBullets(resume);
  if (bullets.length === 0) {
    return { score: 0, warnings: ['No bullet points to assess readability.'], strengths: [] };
  }

  let score = 5;
  const warnings: string[] = [];
  const strengths: string[] = [];

  // Bullet length (0–2 deducted if bad)
  const wordCounts = bullets.map((b) => wordCount(b));
  const avgWords = wordCounts.reduce((a, b) => a + b, 0) / wordCounts.length;
  const inRange = wordCounts.filter((w) => w >= 10 && w <= 40).length / wordCounts.length;

  if (inRange >= 0.7) {
    strengths.push('Bullet points are well-sized for readability.');
  } else {
    const longBullets = wordCounts.filter((w) => w > 40).length;
    if (longBullets > 0) {
      score -= 1;
      warnings.push(`${longBullets} bullet(s) exceed 40 words — too verbose.`);
    }
    const shortBullets = wordCounts.filter((w) => w < 8).length;
    if (shortBullets > 2) {
      score -= 0.5;
      warnings.push(`${shortBullets} bullet(s) are very short (< 8 words) — add more detail.`);
    }
  }

  // Section balance (0–1)
  const expBulletCounts = (resume.experiences || []).map((e) => (e.bulletPoints || []).length);
  const projBulletCounts = (resume.projects || []).map((p) => (p.bulletPoints || []).length);
  const allCounts = [...expBulletCounts, ...projBulletCounts];
  const hasEmpty = allCounts.some((c) => c === 0);
  const hasExcessive = allCounts.some((c) => c > 6);
  if (hasEmpty) {
    score -= 0.5;
    warnings.push('Some experience or project entries have no bullet points.');
  }
  if (hasExcessive) {
    score -= 0.5;
    warnings.push('Some sections have excessive bullet points (6+) — trim to keep concise.');
  }

  // Filler / buzzwords (0–1)
  const fullText = extractAllResumeText(resume).toLowerCase();
  let fillerHits = 0;
  for (const filler of FILLER_WORDS) {
    if (fullText.includes(filler)) fillerHits++;
  }
  if (fillerHits === 0) {
    strengths.push('No filler buzzwords detected — writing is clear and direct.');
  } else if (fillerHits <= 2) {
    score -= 0.5;
    warnings.push(`Detected ${fillerHits} filler buzzword(s) — consider replacing with specific language.`);
  } else {
    score -= 1;
    warnings.push(`Detected ${fillerHits} filler buzzwords — significantly weakens readability.`);
  }

  return { score: clamp(score, 0, 5), warnings, strengths };
}

// ─── 9. Impact & Quantification (0–5) ────────────────────────────────────────

function analyzeImpact(resume: GeneratedResume): {
  score: number; warnings: string[]; strengths: string[];
  evidence: string[]; deductions: string[]; reason: string;
} {
  const bullets = getAllBullets(resume);
  if (bullets.length === 0) {
    return {
      score: 0, warnings: ['No bullet points to assess impact.'], strengths: [],
      evidence: [], deductions: ['No bullet points to assess impact'], reason: 'No content to score.',
    };
  }

  let score = 0;
  const warnings: string[] = [];
  const strengths: string[] = [];
  const evidence: string[] = [];
  const deductions: string[] = [];

  // Metrics (0–3) — the primary driver. A metric-bearing bullet gets strong credit
  // even when its wording is not a textbook action verb.
  const metricBullets = bullets.filter((b) => hasMetric(b));
  const metricRatio = metricBullets.length / bullets.length;
  if (metricRatio >= 0.5) {
    score += 3;
    strengths.push(`${Math.round(metricRatio * 100)}% of bullets contain quantifiable metrics.`);
    evidence.push(...metricBullets.slice(0, 3).map((b) => `✓ ${truncate(b, 90)}`));
  } else if (metricRatio >= 0.3) {
    score += 2;
    warnings.push(`Only ${Math.round(metricRatio * 100)}% of bullets include metrics — aim for 50%+.`);
    evidence.push(...metricBullets.slice(0, 2).map((b) => `✓ ${truncate(b, 90)}`));
  } else if (metricRatio >= 0.15) {
    score += 1;
    warnings.push(`Low quantification: ${Math.round(metricRatio * 100)}% of bullets have metrics.`);
  } else {
    warnings.push(`Low quantification: ${Math.round(metricRatio * 100)}% of bullets have metrics. Add numbers, percentages, or dollar amounts.`);
    deductions.push(`Only ${Math.round(metricRatio * 100)}% of bullets have quantified metrics`);
  }

  // Action verbs (0–1) — a small bonus, not a gate. Metric-rich bullets must not
  // lose points purely for non-textbook wording.
  let actionVerbCount = 0;
  for (const b of bullets) {
    const firstWord = b.trim().split(/\s+/)[0]?.replace(/[^a-zA-Z]/g, '').toLowerCase();
    if (firstWord && ACTION_VERBS.includes(firstWord)) actionVerbCount++;
  }
  const verbRatio = actionVerbCount / bullets.length;
  if (verbRatio >= 0.6) {
    score += 1;
    strengths.push(`${Math.round(verbRatio * 100)}% of bullets start with strong action verbs.`);
  } else if (verbRatio >= 0.3) {
    score += 0.5;
  } else {
    warnings.push(`Weak action verb usage (${Math.round(verbRatio * 100)}%) — most bullets lack strong openings.`);
  }

  // Business outcomes (0–1)
  // Check for outcome-oriented language (reduced, increased, improved, saved, etc.)
  const outcomeVerbs = ['reduced', 'increased', 'improved', 'saved', 'generated', 'achieved', 'delivered', 'launched', 'shipped', 'drove', 'boosted', 'accelerated', 'cut', 'eliminated'];
  let outcomeCount = 0;
  for (const b of bullets) {
    const firstWord = b.trim().split(/\s+/)[0]?.replace(/[^a-zA-Z]/g, '').toLowerCase();
    if (firstWord && outcomeVerbs.includes(firstWord)) outcomeCount++;
  }
  const outcomeRatio = outcomeCount / bullets.length;
  if (outcomeRatio >= 0.3) {
    score += 1;
    strengths.push('Strong focus on business outcomes in bullet points.');
  } else if (outcomeRatio >= 0.1) {
    score += 0.5;
  } else {
    warnings.push('Bullet points focus on activities rather than outcomes — describe the impact of your work.');
    deductions.push('Few bullets quantify business outcomes');
  }

  const finalScore = clamp(Math.round(score * 2) / 2, 0, 5);
  const reason = `Impact ${finalScore}/5 — ${Math.round(metricRatio * 100)}% metrics, ${Math.round(verbRatio * 100)}% action verbs, ${Math.round(outcomeRatio * 100)}% outcome-focused.`;
  return { score: finalScore, warnings, strengths, evidence, deductions, reason };
}

// ─── Main entry point ────────────────────────────────────────────────────────

// Max points each scorer emits internally (before rubric reweighting).
const NATURAL_MAXES: Record<keyof ATSScoreBreakdown, number> = {
  parseability: 15,
  formatting: 15,
  keywordMatch: 20,
  skillsMatch: 15,
  experienceRelevance: 15,
  education: 5,
  grammarSpelling: 5,
  readability: 5,
  impact: 5,
};

// Rubric weights. JD-relevance dominates (keyword+skills+experience = 70) over
// structural categories (30) so that a totally unrelated resume can score below
// 20, a partial match lands ~40-60, and a strong match reaches ~75-90 — without
// any post-hoc rescaling.
const ATS_MAXES: Record<keyof ATSScoreBreakdown, number> = {
  parseability: 5,
  formatting: 5,
  keywordMatch: 30,
  skillsMatch: 20,
  experienceRelevance: 20,
  education: 5,
  grammarSpelling: 5,
  readability: 5,
  impact: 5,
};

/** Map a scorer's natural output onto its rubric weight (keeps category math, not artificial scaling). */
function scaleToMax(naturalScore: number, key: keyof ATSScoreBreakdown): number {
  const scaled = (naturalScore / NATURAL_MAXES[key]) * ATS_MAXES[key];
  return Math.round(scaled * 2) / 2;
}

// Shape shared by every scorer's return object.
interface ScorerResult {
  score: number;
  matched?: string[];
  missing?: string[];
  warnings?: string[];
  errors?: string[];
  strengths?: string[];
  description?: string;
  reason?: string;
  deductions?: string[];
  evidence?: string[];
}

const NOT_APPLICABLE_STUB: ScorerResult = {
  score: 0,
  matched: [],
  missing: [],
  warnings: [],
  strengths: [],
  description: 'Not applicable — add a job description to evaluate.',
};

/**
 * Deterministically analyzes a resume JSON against a target Job Description.
 * Produces a point-based rubric score across 9 categories.
 *
 * When NO job description is supplied, JD-dependent categories
 * (keyword match, skills match, experience relevance) are marked
 * "not applicable" and EXCLUDED from the overall score — they neither
 * inflate nor deflate it. The overall score is recalculated over the
 * applicable categories only.
 */
export function analyzeATS(
  resume: GeneratedResume,
  jobDescription: string,
): ATSReport {
  const allWarnings: string[] = [];
  const allErrors: string[] = [];
  const allStrengths: string[] = [];

  const hasJd = !!jobDescription.trim();

  // JD-independent scorers always run.
  const parseability = analyzeParseability(resume, jobDescription);
  const formatting = analyzeFormatting(resume);
  const education = analyzeEducationMatch(jobDescription, resume);
  const grammar = analyzeGrammarSpelling(resume);
  const readability = analyzeReadability(resume);
  const impact = analyzeImpact(resume);

  // JD-dependent scorers: skipped entirely when there is no JD.
  const notApplicable: Array<keyof ATSScoreBreakdown> = [];
  let keywordMatch: ScorerResult = NOT_APPLICABLE_STUB;
  let skillsMatch: ScorerResult = NOT_APPLICABLE_STUB;
  let experienceRelevance: ScorerResult = NOT_APPLICABLE_STUB;

  if (hasJd) {
    keywordMatch = analyzeKeywordMatch(jobDescription, resume);
    skillsMatch = analyzeSkillsMatch(jobDescription, resume);
    experienceRelevance = analyzeExperienceRelevance(jobDescription, resume);
  } else {
    notApplicable.push('keywordMatch', 'skillsMatch', 'experienceRelevance');
  }

  // Collect warnings/errors/strengths
  allWarnings.push(
    ...parseability.warnings, ...formatting.warnings, ...(keywordMatch.warnings || []),
    ...(skillsMatch.warnings || []), ...(experienceRelevance.warnings || []),
    ...education.warnings, ...grammar.warnings, ...readability.warnings, ...impact.warnings,
  );
  allErrors.push(...parseability.errors);
  allStrengths.push(
    ...parseability.strengths, ...formatting.strengths, ...(keywordMatch.strengths || []),
    ...(skillsMatch.strengths || []), ...(experienceRelevance.strengths || []),
    ...education.strengths, ...grammar.strengths, ...readability.strengths, ...impact.strengths,
  );

  // Build breakdown (scaled from natural scorer output onto rubric weights)
  const breakdown: ATSScoreBreakdown = {
    parseability: scaleToMax(parseability.score, 'parseability'),
    formatting: scaleToMax(formatting.score, 'formatting'),
    keywordMatch: scaleToMax(keywordMatch.score || 0, 'keywordMatch'),
    skillsMatch: scaleToMax(skillsMatch.score || 0, 'skillsMatch'),
    experienceRelevance: scaleToMax(experienceRelevance.score || 0, 'experienceRelevance'),
    education: scaleToMax(education.score, 'education'),
    grammarSpelling: scaleToMax(grammar.score, 'grammarSpelling'),
    readability: scaleToMax(readability.score, 'readability'),
    impact: scaleToMax(impact.score, 'impact'),
  };

  const applicableCategories = (Object.keys(ATS_MAXES) as Array<keyof ATSScoreBreakdown>).filter(
    (k) => !notApplicable.includes(k),
  );

  // Recalculate overall score over applicable categories ONLY.
  const applicableSum = applicableCategories.reduce((sum, k) => sum + breakdown[k], 0);
  const applicableMax = applicableCategories.reduce((sum, k) => sum + ATS_MAXES[k], 0);
  const overallScore =
    applicableMax > 0 ? clamp(Math.round((applicableSum / applicableMax) * 1000) / 10, 0, 100) : 0;

  // Detailed breakdown — excludes N/A categories so downstream consumers
  // (e.g. recruiter prompt) never see a misleading "0/20".
  const detailedBreakdown: ATSReport['detailedBreakdown'] = [];
  const pushCategory = (
    category: string,
    key: keyof ATSScoreBreakdown,
    description: string,
    detail?: { reason?: string; deductions?: string[]; evidence?: string[] },
  ) => {
    if (notApplicable.includes(key)) return;
    detailedBreakdown.push({
      category,
      score: breakdown[key],
      max: ATS_MAXES[key],
      description,
      ...(detail?.reason ? { reason: detail.reason } : {}),
      ...(detail?.deductions?.length ? { deductions: detail.deductions } : {}),
      ...(detail?.evidence?.length ? { evidence: detail.evidence } : {}),
    });
  };

  pushCategory('Parseability', 'parseability', parseability.description || '');
  pushCategory('Formatting', 'formatting', formatting.description || '');
  pushCategory('Keyword Match', 'keywordMatch',
    `Matched ${keywordMatch.matched?.length ?? 0}/${(keywordMatch.matched?.length ?? 0) + (keywordMatch.missing?.length ?? 0)} keywords from JD.`,
    { reason: keywordMatch.reason, deductions: keywordMatch.deductions, evidence: keywordMatch.evidence });
  pushCategory('Skills Match', 'skillsMatch',
    `Skills scored ${breakdown.skillsMatch}/15 based on required/preferred/optional match.`,
    { reason: skillsMatch.reason, deductions: skillsMatch.deductions, evidence: skillsMatch.evidence });
  pushCategory('Experience Relevance', 'experienceRelevance', experienceRelevance.description || '',
    { reason: experienceRelevance.reason, deductions: experienceRelevance.deductions, evidence: experienceRelevance.evidence });
  pushCategory('Education', 'education', `Education scored ${breakdown.education}/5.`);
  pushCategory('Grammar & Spelling', 'grammarSpelling', `Grammar scored ${breakdown.grammarSpelling}/5.`);
  pushCategory('Readability', 'readability', `Readability scored ${breakdown.readability}/5.`);
  pushCategory('Impact & Quantification', 'impact', `Impact scored ${breakdown.impact}/5.`,
    { reason: impact.reason, deductions: impact.deductions, evidence: impact.evidence });

  return {
    overallScore,
    scoreBreakdown: breakdown,
    matchedKeywords: keywordMatch.matched || [],
    missingKeywords: keywordMatch.missing || [],
    warnings: allWarnings,
    errors: allErrors,
    strengths: allStrengths,
    detailedBreakdown,
    notApplicable,
    applicableCategories,
  };
}
