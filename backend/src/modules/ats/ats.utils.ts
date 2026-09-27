import { GeneratedResume } from '../../ai/types';
import { ATSReport, ATSScoreBreakdown, QualityReport, RecruiterReview } from './ats.types';

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
  if ((resume as any).email) parts.push((resume as any).email);
  if ((resume as any).phone) parts.push((resume as any).phone);
  for (const exp of resume.experiences || []) {
    parts.push(exp.companyName, exp.role, exp.description || '');
    if (exp.location) parts.push(exp.location);
    if (exp.startDate) parts.push(exp.startDate);
    if (exp.endDate) parts.push(exp.endDate);
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
    if ((edu as any).location) parts.push((edu as any).location);
    if (edu.startDate) parts.push(edu.startDate);
    if (edu.endDate) parts.push(edu.endDate);
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

export function analyzeParseability(resume: GeneratedResume, jd: string = ''): {
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

export function analyzeFormatting(resume: GeneratedResume): {
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

export function analyzeGrammarSpelling(resume: GeneratedResume): {
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

export function analyzeReadability(resume: GeneratedResume): {
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

export function analyzeImpact(resume: GeneratedResume): {
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

function formatTechName(t: string): string {
  const low = t.toLowerCase();
  if (low === 'nextjs' || low === 'next.js') return 'Next.js';
  if (low === 'nodejs' || low === 'node.js') return 'Node.js';
  if (low === 'ci/cd') return 'CI/CD';
  if (low === 'aws') return 'AWS';
  if (low === 'gcp') return 'GCP';
  if (low === 'postgresql' || low === 'postgres') return 'PostgreSQL';
  if (low === 'mongodb') return 'MongoDB';
  if (low === 'mysql') return 'MySQL';
  if (low === 'mariadb') return 'MariaDB';
  if (low === 'sqlite') return 'SQLite';
  if (low === 'dynamodb') return 'DynamoDB';
  if (low === 'graphql') return 'GraphQL';
  if (low === 'grpc') return 'gRPC';
  if (low === 'websockets') return 'WebSockets';
  if (low === 'webassembly') return 'WebAssembly';
  if (low === 'typescript') return 'TypeScript';
  if (low === 'javascript') return 'JavaScript';
  if (low === 'html') return 'HTML';
  if (low === 'css') return 'CSS';
  if (low === 'api' || low === 'rest api' || low === 'restful') return 'REST APIs';
  return t.charAt(0).toUpperCase() + t.slice(1);
}


function isMetricGrounded(match: string, normResume: string): boolean {
  const cleanMatch = match.toLowerCase().trim();
  
  // 1. Percentage match (e.g. 20%)
  if (cleanMatch.includes('%') || cleanMatch.includes('percent')) {
    const digits = cleanMatch.match(/\d+(?:\.\d+)?/);
    if (digits) {
      const d = digits[0];
      const percentRe = new RegExp(`${escapeRegExp(d)}\\s*(?:%|percent)`, 'i');
      return percentRe.test(normResume);
    }
  }

  // 2. Currency match (e.g. $50k)
  if (cleanMatch.includes('$')) {
    const digits = cleanMatch.match(/\d+(?:\.\d+)?/);
    if (digits) {
      const d = digits[0];
      const usdRe = new RegExp(`\\$\\s*${escapeRegExp(d)}`, 'i');
      return usdRe.test(normResume);
    }
  }

  // 3. Suffix / unit match (e.g. 10+, 100k, 2x, 10 hours, 500+ users)
  const digits = cleanMatch.match(/\d+(?:\.\d+)?/);
  if (digits) {
    const d = digits[0];
    const suffix = cleanMatch.split(d)[1]?.trim() || '';
    if (suffix) {
      const cleanSuffix = escapeRegExp(suffix).replace(/\s+/g, '\\s*');
      const suffixRe = new RegExp(`\\b${escapeRegExp(d)}\\s*${cleanSuffix}`, 'i');
      return suffixRe.test(normResume);
    } else {
      const numRe = new RegExp(`\\b${escapeRegExp(d)}\\b`, 'i');
      return numRe.test(normResume);
    }
  }

  return false;
}

function hasActualDateContradiction(resume: GeneratedResume): boolean {
  const experiences = resume.experiences || [];
  for (const exp of experiences) {
    if (exp.startDate && exp.endDate) {
      const start = new Date(exp.startDate);
      const end = new Date(exp.endDate);
      if (start > end) return true;
    }
  }
  const education = resume.education || [];
  for (const edu of education) {
    if (edu.startDate && edu.endDate) {
      const start = new Date(edu.startDate);
      const end = new Date(edu.endDate);
      if (start > end) return true;
    }
  }
  
  const today = new Date();
  for (const exp of experiences) {
    if (exp.startDate) {
      const start = new Date(exp.startDate);
      if (start > today) return true;
    }
  }
  for (const edu of education) {
    if (edu.startDate) {
      const start = new Date(edu.startDate);
      if (start > today) return true;
    }
  }

  return false;
}

// ─── Structured Fact & Gap Analysis ─────────────────────────────────────────

export interface BulletOpportunity {
  section: string;
  roleOrProject: string;
  text: string;
  type: 'unquantified' | 'weak_verb' | 'verbose' | 'short';
  suggestedAction: string;
}

export interface ResumeFacts {
  rawText: string;
  normalizedText: string;
  hasSummary: boolean;
  summaryText: string;
  experiencesCount: number;
  hasExperienceLocations: boolean;
  experiencesWithoutLocation: string[];
  technologies: Set<string>;
  technologiesInSkills: Set<string>;
  technologiesInContent: Set<string>;
  skillsInSkillsOnly: string[];
  metrics: string[];
  calculatedYoE: number;
  duplicates: string[];
  bulletOpportunities: BulletOpportunity[];
}

export function extractResumeFacts(resume: GeneratedResume): ResumeFacts {
  const rawText = extractAllResumeText(resume);
  const normalizedText = rawText.toLowerCase();
  const hasSummary = Boolean(resume.summary && resume.summary.trim().length > 0);
  const summaryText = resume.summary?.trim() || '';

  const experiences = resume.experiences || [];
  const experiencesCount = experiences.length;
  const experiencesWithoutLocation: string[] = [];
  for (const exp of experiences) {
    if (!exp.location || !exp.location.trim()) {
      experiencesWithoutLocation.push(exp.companyName || 'experience entry');
    }
  }
  const hasExperienceLocations = experiencesCount > 0 && experiencesWithoutLocation.length === 0;

  const technologies = new Set<string>();
  for (const kw of TECH_KEYWORDS) {
    if (textHasKeyword(normalizedText, kw)) {
      technologies.add(kw);
    }
  }

  const technologiesInSkills = new Set<string>();
  for (const s of resume.skills || []) {
    const sName = s.name.toLowerCase();
    for (const kw of TECH_KEYWORDS) {
      if (textHasKeyword(sName, kw)) {
        technologiesInSkills.add(kw);
      }
    }
  }

  const contentParts: string[] = [];
  for (const exp of experiences) {
    contentParts.push(exp.role, exp.companyName, exp.description || '', ...(exp.bulletPoints || []));
  }
  for (const proj of resume.projects || []) {
    contentParts.push(proj.name, proj.role || '', proj.description || '', ...(proj.technologies || []), ...(proj.bulletPoints || []));
  }
  const contentText = contentParts.join(' ').toLowerCase();

  const technologiesInContent = new Set<string>();
  for (const kw of TECH_KEYWORDS) {
    if (textHasKeyword(contentText, kw)) {
      technologiesInContent.add(kw);
    }
  }

  const skillsInSkillsOnly = [...technologiesInSkills].filter(
    (t) => !technologiesInContent.has(t),
  );

  const bullets = getAllBullets(resume);
  const metrics: string[] = [];
  for (const b of bullets) {
    if (hasMetric(b)) metrics.push(b);
  }

  const duplicates: string[] = [];
  const seenContent = new Map<string, number>();
  for (const b of bullets) {
    const norm = b.trim().toLowerCase();
    if (norm.length > 15) {
      seenContent.set(norm, (seenContent.get(norm) || 0) + 1);
    }
  }
  for (const [text, count] of seenContent.entries()) {
    if (count > 1) duplicates.push(text);
  }

  let totalMonths = 0;
  for (const exp of experiences) {
    const start = exp.startDate ? new Date(exp.startDate) : null;
    const end = exp.isCurrent || !exp.endDate ? new Date() : new Date(exp.endDate);
    if (start && !isNaN(start.getTime()) && !isNaN(end.getTime())) {
      totalMonths += Math.max(0, (end.getFullYear() - start.getFullYear()) * 12 + (end.getMonth() - start.getMonth()));
    }
  }
  const calculatedYoE = Math.round((totalMonths / 12) * 10) / 10;

  const bulletOpportunities: BulletOpportunity[] = [];
  const WEAK_OPENERS = /^(?:worked on|helped with|assisted with|responsible for|duties included|supported with|participated in|collaborate with|tasked with)\b/i;

  for (const exp of experiences) {
    const secName = exp.companyName || 'Experience';
    const roleName = exp.role || '';
    if (exp.description && exp.description.trim().length >= 12) {
      const dTrimmed = exp.description.trim();
      if (WEAK_OPENERS.test(dTrimmed)) {
        bulletOpportunities.push({
          section: secName,
          roleOrProject: roleName,
          text: dTrimmed,
          type: 'weak_verb',
          suggestedAction: 'Replace weak opening verb with a strong, active technical verb (e.g. Engineered, Architected, Built) and specify key achievements.',
        });
      } else if (!hasMetric(dTrimmed)) {
        bulletOpportunities.push({
          section: secName,
          roleOrProject: roleName,
          text: dTrimmed,
          type: 'unquantified',
          suggestedAction: 'Add a measurable outcome (e.g. users, throughput, latency) if verified data is available; otherwise describe project scale.',
        });
      }
    }
    for (const b of exp.bulletPoints || []) {
      const trimmed = b.trim();
      if (trimmed.length < 10) continue;
      const wordCount = trimmed.split(/\s+/).length;
      if (WEAK_OPENERS.test(trimmed)) {
        bulletOpportunities.push({
          section: secName,
          roleOrProject: roleName,
          text: trimmed,
          type: 'weak_verb',
          suggestedAction: 'Replace weak opening verb with a strong, active engineering verb (e.g. Architected, Engineered, Built, Deployed) and describe the concrete technical deliverable.',
        });
      } else if (!hasMetric(trimmed)) {
        if (wordCount < 5) {
          bulletOpportunities.push({
            section: secName,
            roleOrProject: roleName,
            text: trimmed,
            type: 'short',
            suggestedAction: 'Expand with specific technical details, tools used, and measurable outcomes (currently very brief).',
          });
        } else {
          bulletOpportunities.push({
            section: secName,
            roleOrProject: roleName,
            text: trimmed,
            type: 'unquantified',
            suggestedAction: 'Add a measurable outcome (e.g. users, performance gain, throughput, time savings) if verified data is available; otherwise describe project scale.',
          });
        }
      } else if (wordCount > 40) {
        bulletOpportunities.push({
          section: secName,
          roleOrProject: roleName,
          text: trimmed,
          type: 'verbose',
          suggestedAction: 'Condense into two concise sentences or trim filler words for better ATS parseability.',
        });
      }
    }
  }

  for (const proj of resume.projects || []) {
    const secName = proj.name || 'Project';
    for (const b of proj.bulletPoints || []) {
      const trimmed = b.trim();
      if (trimmed.length < 10) continue;
      const wordCount = trimmed.split(/\s+/).length;
      if (WEAK_OPENERS.test(trimmed)) {
        bulletOpportunities.push({
          section: secName,
          roleOrProject: 'Project',
          text: trimmed,
          type: 'weak_verb',
          suggestedAction: 'Replace weak opening verb with a strong, active engineering verb and specify the implementation details.',
        });
      } else if (!hasMetric(trimmed)) {
        if (wordCount < 5) {
          bulletOpportunities.push({
            section: secName,
            roleOrProject: 'Project',
            text: trimmed,
            type: 'short',
            suggestedAction: 'Expand with technical implementation details and project outcomes.',
          });
        } else {
          bulletOpportunities.push({
            section: secName,
            roleOrProject: 'Project',
            text: trimmed,
            type: 'unquantified',
            suggestedAction: 'Add a measurable outcome (e.g. users, performance gain, throughput, time savings) if verified data is available; otherwise describe project scale.',
          });
        }
      }
    }
  }

  return {
    rawText,
    normalizedText,
    hasSummary,
    summaryText,
    experiencesCount,
    hasExperienceLocations,
    experiencesWithoutLocation,
    technologies,
    technologiesInSkills,
    technologiesInContent,
    skillsInSkillsOnly,
    metrics,
    calculatedYoE,
    duplicates,
    bulletOpportunities,
  };
}

export interface JdFacts {
  requiredTech: string[];
  preferredTech: string[];
  allJdTech: string[];
  requiredYoE: number | null;
}

export function extractJdFacts(jobDescription: string): JdFacts {
  const jdLower = jobDescription.toLowerCase();
  const allJdTech = extractJdKeywords(jobDescription);

  const requiredSectionMatch = jdLower.match(/(?:required|qualifications|requirements|must\s+have|core\s+skills)([\s\S]*?)(?:preferred|nice\s+to\s+have|bonus|plus|about\s+the|responsibilities|$)/i);
  const preferredSectionMatch = jdLower.match(/(?:preferred|nice\s+to\s+have|bonus|plus|desired)([\s\S]*?)(?:required|qualifications|about\s+the|responsibilities|$)/i);

  const requiredTech: string[] = [];
  const preferredTech: string[] = [];

  const reqText = requiredSectionMatch ? requiredSectionMatch[1] : '';
  const prefText = preferredSectionMatch ? preferredSectionMatch[1] : '';

  for (const tech of allJdTech) {
    if (prefText && textHasKeyword(prefText, tech)) {
      preferredTech.push(tech);
    } else if (reqText && textHasKeyword(reqText, tech)) {
      requiredTech.push(tech);
    } else {
      requiredTech.push(tech);
    }
  }

  let requiredYoE: number | null = null;
  const yoeRegex = /(\d+)\+?\s*(years|yoe|yr)/gi;
  let m;
  while ((m = yoeRegex.exec(jdLower)) !== null) {
    const val = parseInt(m[1], 10);
    if (!isNaN(val) && val > 0 && val <= 30) {
      requiredYoE = Math.max(requiredYoE || 0, val);
    }
  }

  return {
    requiredTech: [...new Set(requiredTech)],
    preferredTech: [...new Set(preferredTech)],
    allJdTech,
    requiredYoE,
  };
}

export interface ResumeJdGap {
  genuinelyMissingRequired: string[];
  genuinelyMissingPreferred: string[];
  allMissingJdTech: string[];
  alreadyDemonstrated: string[];
  demonstratedInSkillsOnly: string[];
  yoeGap: number;
  structuralGaps: {
    missingSummary: boolean;
    missingLocations: string[];
  };
}

export function computeResumeJdGap(resumeFacts: ResumeFacts, jdFacts: JdFacts): ResumeJdGap {
  const genuinelyMissingRequired = jdFacts.requiredTech.filter((t) => !resumeFacts.technologies.has(t));
  const genuinelyMissingPreferred = jdFacts.preferredTech.filter((t) => !resumeFacts.technologies.has(t));
  const allMissingJdTech = jdFacts.allJdTech.filter((t) => !resumeFacts.technologies.has(t));
  const alreadyDemonstrated = jdFacts.allJdTech.filter((t) => resumeFacts.technologies.has(t));

  const demonstratedInSkillsOnly = [...resumeFacts.technologiesInSkills].filter(
    (t) => !resumeFacts.technologiesInContent.has(t),
  );

  const yoeGap = jdFacts.requiredYoE ? Math.max(0, jdFacts.requiredYoE - resumeFacts.calculatedYoE) : 0;

  return {
    genuinelyMissingRequired,
    genuinelyMissingPreferred,
    allMissingJdTech,
    alreadyDemonstrated,
    demonstratedInSkillsOnly,
    yoeGap,
    structuralGaps: {
      missingSummary: !resumeFacts.hasSummary,
      missingLocations: resumeFacts.experiencesWithoutLocation,
    },
  };
}

/**
 * Generates a rich, structured Opportunity & Evidence Dossier for LLM prompts.
 * Eliminates generic hallucinations by giving the LLM concrete bullet anchors,
 * verified matches, exact missing skills, and skills needing project context.
 */
export function generateOpportunityDossier(
  resumeFacts: ResumeFacts,
  jdFacts: JdFacts,
  gap: ResumeJdGap,
): string {
  const lines: string[] = [];
  lines.push('=== FACT-BASED OPPORTUNITY & EVIDENCE DOSSIER ===');

  lines.push(`1. VERIFIED CANDIDATE STRENGTHS (Matched in JD):`);
  lines.push(`   ${gap.alreadyDemonstrated.length > 0 ? gap.alreadyDemonstrated.join(', ') : 'None directly matched'}`);

  lines.push(`2. GENUINELY MISSING JD REQUIREMENTS:`);
  if (gap.genuinelyMissingRequired.length > 0) {
    lines.push(`   - Core Required Missing: ${gap.genuinelyMissingRequired.join(', ')}`);
  } else {
    lines.push(`   - Core Required Missing: None`);
  }
  if (gap.genuinelyMissingPreferred.length > 0) {
    lines.push(`   - Preferred/Nice-to-Have Missing: ${gap.genuinelyMissingPreferred.join(', ')}`);
  }

  lines.push(`3. SKILLS LISTED IN SKILLS SECTION WITHOUT EXPERIENCE/PROJECT EVIDENCE:`);
  if (resumeFacts.skillsInSkillsOnly.length > 0) {
    lines.push(`   ${resumeFacts.skillsInSkillsOnly.slice(0, 8).join(', ')}`);
    lines.push(`   -> PERSONALIZATION TIP: Advise candidate to tie these skills into specific role/project bullets where they actually applied them, or leave them as foundational skills.`);
  } else {
    lines.push(`   All listed skills appear in experience or project descriptions.`);
  }

  lines.push(`4. SPECIFIC BULLET REVISION ANCHORS (Use these exact anchors to produce personalized recommendations):`);
  if (resumeFacts.bulletOpportunities.length > 0) {
    for (const opp of resumeFacts.bulletOpportunities.slice(0, 5)) {
      lines.push(`   * [${opp.section}${opp.roleOrProject ? ' - ' + opp.roleOrProject : ''}] "${opp.text}"`);
      lines.push(`     Opportunity: ${opp.suggestedAction}`);
    }
  } else {
    lines.push(`   No obvious bullet structural defects found.`);
  }

  lines.push(`5. FACTUAL STRUCTURE & METRICS CONTEXT:`);
  lines.push(`   - Verified Total Professional Experience: ${resumeFacts.calculatedYoE} years (JD specifies: ${jdFacts.requiredYoE ? jdFacts.requiredYoE + '+ years' : 'Not specified'})`);
  lines.push(`   - Summary Section: ${resumeFacts.hasSummary ? 'Present' : 'Empty (needs summary)'}`);
  lines.push(`   - Verified Metrics Already Present: ${resumeFacts.metrics.length > 0 ? resumeFacts.metrics.slice(0, 4).map((m) => `"${m}"`).join('; ') : 'None detected'}`);

  return lines.join('\n');
}

/**
 * Deterministic current-resume state validation.
 * Rejects recommendations referencing conditions that do not hold in the current resume.
 */
export function validateCurrentResumeState(
  statement: string,
  resume: GeneratedResume,
  jd: string = '',
  options?: { isQuickWin?: boolean },
): string | null {
  const facts = extractResumeFacts(resume);
  const normResume = facts.normalizedText;
  const lower = statement.toLowerCase().trim();

  // 0. QUICK WIN ISOLATION: Quick Wins is strictly for polish of existing resume content.
  // Never propose missing JD technologies, learning plans, or role-fit skills in Quick Wins.
  if (options?.isQuickWin) {
    if (
      lower.includes('the jd mentions') ||
      lower.includes('genuine experience') ||
      lower.includes('not demonstrated') ||
      lower.includes('missing keyword') ||
      lower.includes('missing skill') ||
      lower.includes('required by the jd') ||
      lower.includes('cloud orchestration') ||
      lower.includes('learn ') ||
      lower.includes('take a course') ||
      lower.includes('study ') ||
      lower.includes('get certified')
    ) {
      return null;
    }
    // If statement instructs adding a technology not in the resume, reject it in Quick Wins
    for (const kw of TECH_KEYWORDS) {
      if (textHasKeyword(lower, kw) && !facts.technologies.has(kw)) {
        return null;
      }
    }
  }

  // 1. INTERNAL SCHEMA LEAKAGE PREVENTION:
  // Disallow leaking internal JSON schema field names ('role', 'isCurrent', 'startDate', 'endDate', 'bulletPoints', 'generationSessionId', etc.)
  const SCHEMA_FIELD_RE = /\b(?:isCurrent|startDate|endDate|bulletPoints?|generationSessionId|targetRole|companyName)\b/i;
  if (SCHEMA_FIELD_RE.test(statement)) {
    // If it's about dates or isCurrent, rewrite to human-facing date verification
    if (/\b(?:isCurrent|startDate|endDate)\b/i.test(statement)) {
      let matchedName = '';
      for (const exp of resume.experiences || []) {
        if (exp.companyName && statement.toLowerCase().includes(exp.companyName.toLowerCase())) {
          matchedName = exp.companyName;
          break;
        }
      }
      const containsIsCurrent = lower.includes('iscurrent') || lower.includes('current role');
      if (matchedName && !containsIsCurrent) {
        return `Verify the ${matchedName} start date. If the displayed date is correct, retain it. If it is incorrect, replace it only with the actual start date.`;
      }
      return 'Verify that employment dates and current-role status accurately reflect your actual employment history.';
    }
    // Otherwise it's a technical schema reference like "empty role" or "bulletPoints array" -> drop
    return null;
  }
  if (/\b(?:empty|missing)\s+(?:role|role\s+field|role\s+string)\b/i.test(lower)) {
    return null;
  }

  // 2. STALE "CHANGE X TO Y" / "REPLACE X WITH Y" VALIDATION:
  // If the recommendation instructs changing X to Y, X MUST actually exist in the current resume text.
  // If X is not in the resume (e.g. user already changed "Collaborate" to "Collaborated"), REJECT!
  const CHANGE_X_TO_Y_RE = /\b(?:change|replace|swap|switch|correct|update)\s+['"‘“]?([a-zA-Z0-9+#.-]+(?: [a-zA-Z0-9+#.-]+){0,3})['"’”]?\s+(?:to|with|for|in\s+favor\s+of)\s+['"‘“]?([a-zA-Z0-9+#.-]+(?: [a-zA-Z0-9+#.-]+){0,3})['"’”]?/i;
  const changeMatch = statement.match(CHANGE_X_TO_Y_RE);
  if (changeMatch) {
    const targetX = changeMatch[1].trim().toLowerCase();
    // Exclude date patterns like "2026-02" or years (which have specialized verification handlers)
    const isDatePattern = /\b\d{4}(?:-\d{2})?\b/.test(targetX);
    const isStylisticTerm = /\b(?:passive|active|voice|phrasing|wording|tense|verbs?|filler|first person|third person)\b/i.test(targetX);
    if (!isDatePattern && !isStylisticTerm && targetX.length >= 3 && !['the', 'a', 'an', 'your', 'this', 'bullet', 'bullets'].includes(targetX)) {
      const parts = targetX.split(/\s+(?:and|or|,)\s+/).map((p) => p.trim()).filter(Boolean);
      const allPartsPresent = parts.every((part) => {
        const pRegex = new RegExp(`(?:^|[^a-zA-Z0-9+#.-])${escapeRegExp(part)}(?![a-zA-Z0-9+#.-])`, 'i');
        return pRegex.test(normResume);
      });
      if (!allPartsPresent) {
        return null; // Target X is absent from the resume -> stale recommendation! Reject!
      }
    }
  }

  // 3. STALE SUMMARY RECOMMENDATION:
  // If statement suggests adding / creating / providing a summary section / profile:
  // If resume ALREADY has a summary, REJECT the recommendation!
  const SUMMARY_REC_RE = /\b(?:add|include|create|write|provide|missing|empty|lacks?)\s+(?:a\s+)?(?:concise\s+)?(?:professional\s+)?(?:career\s+)?(?:summary|profile\s+summary|summary\s+section|profile\s+overview|executive\s+summary)\b/i;
  if (SUMMARY_REC_RE.test(lower)) {
    if (facts.hasSummary) {
      return null; // Summary already present -> reject!
    }
  }

  // 4. STALE LOCATION RECOMMENDATION:
  // If statement suggests adding a location field or missing location:
  // If all experiences already have location, REJECT!
  const LOCATION_REC_RE = /\b(?:add|include|missing|specify|provide)\s+(?:location|locations|location\s+information|location\s+field|city|workplace\s+location)\b/i;
  if (LOCATION_REC_RE.test(lower)) {
    if (facts.hasExperienceLocations) {
      return null; // All experiences already have location -> reject!
    }
  }

  // 5. STALE DUPLICATE RECOMMENDATION:
  // If statement suggests removing duplicate / redundant content:
  // If no duplicate content exists in the current resume, REJECT!
  const DUPLICATE_REC_RE = /\b(?:remove|delete|eliminate)\s+(?:duplicate|redundant|repeated)\s+([a-zA-Z0-9+#.-]+)/i;
  const dupMatch = statement.match(DUPLICATE_REC_RE);
  if (dupMatch) {
    const subject = dupMatch[1].toLowerCase();
    const regex = new RegExp(`\\b${escapeRegExp(subject)}\\b`, 'gi');
    const occurrences = (normResume.match(regex) || []).length;
    if (occurrences < 2 && facts.duplicates.length === 0) {
      return null; // Duplicate is not present -> reject!
    }
  }

  return statement;
}

export function sanitizeRecommendationText(
  statement: string,
  resume: GeneratedResume,
  jd: string = '',
  options?: { isQuickWin?: boolean },
): string {
  // Current-state invariant validation
  const validatedState = validateCurrentResumeState(statement, resume, jd, options);
  if (validatedState === null || validatedState === '') {
    return '';
  }
  if (validatedState !== statement) {
    statement = validatedState;
  }

  const txt = extractAllResumeText(resume);
  const normResume = txt.toLowerCase();

  // 1. Check if the statement is already a safe/grounded statement.
  const lowerStatement = statement.toLowerCase();
  const isAlreadyGrounded = lowerStatement.includes('genuine experience') ||
                            lowerStatement.includes('if you have experience') ||
                            lowerStatement.includes('not demonstrated') ||
                            lowerStatement.includes('is demonstrated') ||
                            (lowerStatement.includes('no ') && lowerStatement.includes('demonstrated'));

  // 2. Fabricated date replacements — run BEFORE the year/metric check so that
  //    "change 2026-02 to 2023-02" is caught here (with a date-verification
  //    rewrite) rather than falling through to the metric check and producing
  //    the wrong "Do not invent a metric" message.
  const FABRICATED_DATE_RE = /\b(?:change|swap|set|replace|correct|adjust|update|move)\b[^.]*\b(\d{4}-\d{2})\s+(?:to|for)\s+(\d{4}-\d{2})\b/i;
  const FABRICATED_DATE_BARE_RE = /\b(?:change|swap|set|replace|correct|adjust|update|move)\b[^.]*\b(\d{4})\s+(?:to|for)\s+(?!\d)(\d{4})\b/i;
  const FABRICATED_MONTH_RE = /\b(\d{4}-\d{2})\s+to\s+(\d{4}-\d{2})\b/i;
  const FABRICATED_YR_RE = /\b(\d{4})\s+to\s+(?!\d)(\d{4})\b/i;
  const FABRICATED_EXAMPLE_RE = /\(\s*e\.?\s*g\.?\s*(\d{4}-\d{2})\s*\)/i;

  const dateMatch =
    statement.match(FABRICATED_DATE_RE) ||
    statement.match(FABRICATED_DATE_BARE_RE) ||
    statement.match(FABRICATED_MONTH_RE) ||
    statement.match(FABRICATED_YR_RE) ||
    statement.match(FABRICATED_EXAMPLE_RE);

  if (dateMatch) {
    const yrA = parseInt(dateMatch[1], 10);
    const yrB = parseInt(dateMatch[2], 10);
    const yearsInResume = (resume.experiences || []).flatMap((e) => [
      e.startDate ? parseInt(e.startDate.slice(0, 4), 10) : null,
      e.endDate   ? parseInt(e.endDate.slice(0, 4), 10) : null,
    ]).filter(Boolean) as number[];
    const bothPresent = yearsInResume.includes(yrA) && yearsInResume.includes(yrB);
    if (!bothPresent) {
      let matchedName = '';
      for (const exp of resume.experiences || []) {
        if (exp.companyName && statement.toLowerCase().includes(exp.companyName.toLowerCase())) {
          matchedName = exp.companyName; break;
        }
      }
      if (!matchedName) {
        for (const edu of resume.education || []) {
          if (edu.school && statement.toLowerCase().includes(edu.school.toLowerCase())) {
            matchedName = edu.school; break;
          }
        }
      }
      const containsIsCurrent = lowerStatement.includes('iscurrent') || lowerStatement.includes('current role') || lowerStatement.includes('current-role');
      if (matchedName && !containsIsCurrent) {
        return `Verify the ${matchedName} start date. If the displayed date is correct, retain it. If it is incorrect, replace it only with the actual start date.`;
      } else {
        return 'Verify that employment dates and current-role status accurately reflect your actual employment history.';
      }
    }
  }

  // 3. Timeline / general date/isCurrent/timeline warning check.
  const DATE_WARNING_RE = /\b(?:startDate|endDate|start\s+date|end\s+date|date\s+correction|correct\s+date|change\s+dates?|change\s+the\s+dates?|adjust\s+dates?|change\s+startDate|change\s+endDate|set\s+isCurrent|isCurrent\s+false|isCurrent\s+to\s+false|past\s+month|arbitrary\s+date|current\s+roles?|employment\s+dates)\b/i;
  if (DATE_WARNING_RE.test(statement)) {
    let matchedName = '';
    for (const exp of resume.experiences || []) {
      if (exp.companyName && statement.toLowerCase().includes(exp.companyName.toLowerCase())) {
        matchedName = exp.companyName; break;
      }
    }
    if (!matchedName) {
      for (const edu of resume.education || []) {
        if (edu.school && statement.toLowerCase().includes(edu.school.toLowerCase())) {
          matchedName = edu.school; break;
        }
      }
    }

    const containsIsCurrent = lowerStatement.includes('iscurrent') || lowerStatement.includes('current role') || lowerStatement.includes('current-role');
    if (matchedName && !containsIsCurrent) {
      return `Verify the ${matchedName} start date. If the displayed date is correct, retain it. If it is incorrect, replace it only with the actual start date.`;
    } else {
      return 'Verify that employment dates and current-role status accurately reflect your actual employment history.';
    }
  }

  // 4. Unsupported years-of-experience claim — run BEFORE the generic digit
  //    check so that "2+ years" is caught as a YoE claim rather than as an
  //    ungrounded metric.
  const YOE_PATTERN = /\b(\d+(?:\.\d+)?)\+?\s*(?:years?|yoe|yrs?|yr)\b/gi;
  let yoeMatch;
  let hasUnsupportedYoE = false;
  
  let totalMonths = 0;
  for (const exp of resume.experiences || []) {
    const start = exp.startDate ? new Date(exp.startDate) : null;
    const end = exp.endDate ? new Date(exp.endDate) : (exp.isCurrent ? new Date() : new Date());
    if (start && !isNaN(start.getTime()) && !isNaN(end.getTime())) {
      totalMonths += Math.max(0, (end.getFullYear() - start.getFullYear()) * 12 + (end.getMonth() - start.getMonth()));
    }
  }
  const calculatedYears = Math.round((totalMonths / 12) * 10) / 10;

  YOE_PATTERN.lastIndex = 0;
  while ((yoeMatch = YOE_PATTERN.exec(statement)) !== null) {
    const claimedYears = parseFloat(yoeMatch[1]);
    if (calculatedYears < claimedYears) {
      hasUnsupportedYoE = true;
      break;
    }
  }

  if (hasUnsupportedYoE) {
    if (lowerStatement.includes('summary') || lowerStatement.includes('profile') || lowerStatement.includes('introduction')) {
      if (resume.summary && resume.summary.trim().length > 0) {
        return '';
      }
      return "Add a concise summary highlighting your full-stack and AI/SaaS experience.";
    } else if (lowerStatement.includes('full-stack') || lowerStatement.includes('full stack')) {
      return "Highlight your full-stack and technical experience.";
    } else {
      return statement.replace(/\b\d+(?:\.\d+)?\+?\s*(?:years?|yoe|yrs?|yr)\s*(?:of\s+)?/gi, 'hands-on ').trim();
    }
  }

  // 5. Years not in the resume (catch fabricated years like 2027).
  //    Skip numbers that are part of a YoE pattern (e.g. "2+ years") since
  //    those are already handled above.
  const digitMatches = statement.match(/\b\d+(?:\.\d+)?\b/g);
  if (digitMatches) {
    for (const d of digitMatches) {
      const numVal = parseFloat(d);
      if (numVal >= 1900 && numVal <= 2100) continue;
      // Skip if this digit is part of a YoE expression (e.g. "2+ years")
      const yoeContext = new RegExp(`\\b${escapeRegExp(d)}\\+?\\s*(?:years?|yoe|yrs?|yr)\\b`, 'i');
      if (yoeContext.test(statement)) continue;
      // Skip if this digit is part of an ISO date in the statement that matches the resume
      const dateInStatement = statement.match(/\b\d{4}[-/]\d{2}(?:[-/]\d{2})?\b/);
      if (dateInStatement) {
        const resumeDates = (resume.experiences || []).flatMap((e) => [e.startDate, e.endDate])
          .concat((resume.education || []).flatMap((e) => [e.startDate, e.endDate]))
          .filter(Boolean) as string[];
        if (resumeDates.some((rd) => rd.includes(dateInStatement[0]) || dateInStatement[0].includes(rd))) {
          continue;
        }
      }
      if (!normResume.includes(d)) {
        return 'Add a measurable outcome if you have one. Do not invent a metric.';
      }
    }
  }

  // 6. Fabricated metrics / example numbers.
  //    Skip matches that are part of a YoE expression (already handled in step 4).
  const METRIC_PATTERN = /(\$\s?\d+(?:[.,]\d+)?[kmb]?|\b\d+(?:\.\d+)?\s*%|\b\d+(?:\.\d+)?\s*(?:\+|k\b|x\b|×|hours?\b|users?\b|requests?\b))/gi;
  const metricMatches = statement.match(METRIC_PATTERN);
  let matchedCompanyForMetric = '';
  for (const exp of resume.experiences || []) {
    if (exp.companyName && statement.toLowerCase().includes(exp.companyName.toLowerCase())) {
      matchedCompanyForMetric = exp.companyName;
      break;
    }
  }

  // 6a. Prescriptive metric recommendation without concrete numbers or with unverified metrics
  //     (e.g., "Revise Thrive Wellness bullets to include metrics such as % performance gain or user count.")
  const PRESCRIPTIVE_METRIC_RE = /\b(?:revise|update|modify|edit|rewrite|add|include)\b[^.]*\b(?:bullets?|experience|roles?)\b[^.]*\b(?:metrics?\s+such\s+as|metrics?\s+like|to\s+include\s+metrics|include\s+metrics|metrics?\b)/i;
  const METRIC_SUCH_AS_RE = /\bmetrics?\s+(?:such\s+as|like)\s+(?:%|percent|user\s+count|performance\s+gain|growth|latency|throughput)/i;
  const allGroundedMetrics = metricMatches ? metricMatches.every((m) => isMetricGrounded(m, normResume)) : false;

  if (!allGroundedMetrics && (PRESCRIPTIVE_METRIC_RE.test(statement) || METRIC_SUCH_AS_RE.test(statement))) {
    if (matchedCompanyForMetric) {
      return `Quantify the existing ${matchedCompanyForMetric} bullets if verified metrics are available; otherwise leave the claims unchanged.`;
    }
    return 'Quantify existing bullets if verified metrics are available; otherwise leave the claims unchanged.';
  }

  if (metricMatches) {
    for (const match of metricMatches) {
      // Extract the digit portion and check if it's part of a YoE expression
      const digitPart = match.match(/\d+(?:\.\d+)?/);
      if (digitPart) {
        const yoeCtx = new RegExp(`\\b${escapeRegExp(digitPart[0])}\\+?\\s*(?:years?|yoe|yrs?|yr)\\b`, 'i');
        if (yoeCtx.test(statement)) continue;
      }
      if (!isMetricGrounded(match, normResume)) {
        if (matchedCompanyForMetric) {
          return `Quantify the existing ${matchedCompanyForMetric} bullets if verified metrics are available; otherwise leave the claims unchanged.`;
        }
        return 'Add a measurable outcome if you have one. Do not invent a metric.';
      }
    }
  }

  // 7. Skills deletion / replacement.
  const DELETE_SKILLS_RE = /\b(?:replace|remove|delete|drop|exclude|omit|swap|get rid of)\b/i;
  const SKILLS_REF_RE = /\b(?:skills?|technolog(?:y|ies))\b/i;
  const candidateSkills = resume.skills || [];
  const hasSkillsRef = SKILLS_REF_RE.test(statement) || candidateSkills.some(s => textHasKeyword(statement, s.name));

  if (DELETE_SKILLS_RE.test(statement) && hasSkillsRef) {
    const jdRelevant = candidateSkills
      .map(s => s.name)
      .filter(name => textHasKeyword(jd, name));
    const displaySkills = jdRelevant.length > 0 ? jdRelevant : candidateSkills.slice(0, 3).map(s => s.name);
    const formattedSkills = displaySkills.slice(0, 3).map(t => formatTechName(t));

    if (formattedSkills.length > 0) {
      const skillList = formattedSkills.join(', ').replace(/, ([^,]*)$/, ' and $1');
      return `Prioritize JD-relevant skills such as ${skillList} near the beginning while retaining other genuine skills.`;
    }
  }

  // 7a. Location formatting check: never recommend changing factual location like "Remote" to "Remote, Global".
  const REMOTE_LOCATION_RE = /\b(?:change|switch|update|standardize|replace|format)\b[^.]*\bRemote\b[^.]*\b(?:to|as)\s+['"]?Remote,\s*(?:Global|Worldwide|US|USA|Anywhere)['"]?/i;
  const REMOTE_TO_GLOBAL_RE = /\bRemote,\s*Global\b/i;
  if (REMOTE_LOCATION_RE.test(statement) || REMOTE_TO_GLOBAL_RE.test(statement)) {
    const locations = (resume.experiences || []).map(e => (e.location || '').trim()).filter(Boolean);
    const hasCityState = locations.some(l => l.includes(','));
    const hasSingleWord = locations.some(l => !l.includes(',') && l.length > 0);
    const hasInconsistentFormatting = locations.length >= 2 && hasCityState && hasSingleWord;
    if (hasInconsistentFormatting) {
      return 'Standardize location formatting across entries while preserving the actual location information.';
    }
    return ''; // Drop recommendation if no real formatting inconsistency
  }

  // 7b. Fabricated coursework check — run BEFORE missing tech check so that
  //     coursework recommendations mentioning subjects like AI/ML or Web Development
  //     are rewritten to the safe coursework phrasing.
  const ADD_COURSE_RE = /\b(?:add|include|list|mention|insert)\b[^.]*\b(?:coursework|courses?|classes)\b|\b(?:coursework|courses?|classes)\b[^.]*\b(?:add|include|list|mention|insert)\b/i;
  if (ADD_COURSE_RE.test(statement)) {
    return 'If you have coursework directly relevant to the role, consider listing it.';
  }

  // 7c. Low-value vague recommendations (reject).
  const VAGUE_LOW_VALUE_RE = /\b(?:improve\s+(?:your\s+)?resume\s+formatting|make\s+bullets\s+more\s+impactful|consider\s+adding\s+more\s+keywords|enhance\s+overall\s+presentation)\b/i;
  if (VAGUE_LOW_VALUE_RE.test(statement)) {
    return '';
  }

  // 7d. Recommendations requiring candidate to gain new experience or learn new skills (reject or make conditional).
  const LEARN_NEW_EXP_RE = /\b(?:learn|take\s+a\s+course|study|gain\s+experience|acquire\s+experience|get\s+certified)\b/i;
  if (LEARN_NEW_EXP_RE.test(statement)) {
    const mentionedTech = TECH_KEYWORDS.find(kw => textHasKeyword(statement, kw) && !textHasKeyword(txt, kw));
    if (mentionedTech) {
      return `The JD mentions ${formatTechName(mentionedTech)}, but ${formatTechName(mentionedTech)} is not demonstrated in the resume. If you have genuine experience with ${formatTechName(mentionedTech)}, add it with supporting evidence.`;
    }
    return ''; // Reject recommendation requiring new experience
  }

  // 8a. Technology placement & existing evidence rule.
  // Prohibit inventing project associations or recommending adding technologies
  // that are already adequately represented in the resume.
  const PLACEMENT_ACTION_RE = /\b(?:revise\s+.*to\s+note|note\s+.*usage|include|add|feature|incorporate|insert)\b/i;
  const PLACEMENT_TARGET_RE = /\b(?:in|to)\s+(?:the\s+|a\s+|your\s+)?(?:bullets?|projects?|experience\s+section|experience\s+bullets?|ui-focused)\b|\b(?:bullet|project)\b/i;
  if (!isAlreadyGrounded && PLACEMENT_ACTION_RE.test(statement) && PLACEMENT_TARGET_RE.test(statement)) {
    const presentTechsMentioned = TECH_KEYWORDS.filter(kw => textHasKeyword(statement, kw) && textHasKeyword(txt, kw));
    for (const tech of presentTechsMentioned) {
      const inSkills = (resume.skills || []).some(s => textHasKeyword(s.name, tech));
      const inExp = (resume.experiences || []).some(e =>
        textHasKeyword([e.role, e.companyName, e.description, ...(e.bulletPoints || [])].join(' '), tech)
      );
      const inProj = (resume.projects || []).some(p =>
        textHasKeyword([p.name, p.role, p.description, ...(p.technologies || []), ...(p.bulletPoints || [])].join(' '), tech)
      );

      // If already present in skills AND (experience OR projects), it's adequately represented.
      // Omit recommendation rather than cluttering with low-value keyword-density advice.
      if (inSkills && (inExp || inProj)) {
        return '';
      }

      // If present in skills but not in experience/projects, only recommend surfacing
      // if evidence supports it; do not invent a project association.
      if (inSkills && !inExp && !inProj) {
        return `${formatTechName(tech)} is already demonstrated in the resume. If it is used in a project that is currently described without the technology, explicitly connect it to that project only where the resume evidence supports the connection.`;
      }
    }
  }

  // 8b. Missing JD technologies.
  const missingTechs: string[] = [];
  for (const kw of TECH_KEYWORDS) {
    if (textHasKeyword(statement, kw) && !textHasKeyword(txt, kw)) {
      missingTechs.push(kw);
    }
  }

  if (missingTechs.length > 0 && !isAlreadyGrounded) {
    const techNames = missingTechs.map(t => formatTechName(t));
    const techList = techNames.join(', ').replace(/, ([^,]*)$/, ' and $1');
    if (techNames.length === 1) {
      return `The JD mentions ${techNames[0]}, but ${techNames[0]} is not demonstrated in the resume. If you have genuine experience with ${techNames[0]}, add it with supporting evidence.`;
    } else {
      return `The JD mentions ${techList}, but these technologies are not demonstrated in the resume. If you have genuine experience with any of them, add the relevant technology together with supporting evidence; otherwise, leave them out.`;
    }
  }

  // 9. Employment date overlap warning.
  const OVERLAP_WARNING_RE = /\b(?:overlap|overlapping|date\s+contradiction|employment\s+dates|impossible\s+timeline|integrity\s+concern|undermines\s+trust|suspicious\s+overlap|factual\s+contradiction|inaccurate\s+dates|future.dated\s+employment|suspicious|contradict|fraudulent|dishonest|inaccurate)\b/i;
  if (OVERLAP_WARNING_RE.test(statement)) {
    if (!hasActualDateContradiction(resume)) {
      return 'Clarify the nature or time commitment of overlapping roles if needed.';
    }
  }

  // 10. Summary recommendation (drop if summary already exists; ground if missing).
  const SUMMARY_REC_RE = /\b(?:add|include|create|write|provide|missing|empty|lacks?)\s+(?:a\s+)?(?:concise\s+)?(?:professional\s+)?(?:career\s+)?(?:summary|profile\s+summary|summary\s+section|profile\s+overview|executive\s+summary)\b/i;
  if (SUMMARY_REC_RE.test(statement)) {
    if (resume.summary && resume.summary.trim().length > 0) {
      return ''; // Drop this recommendation
    }
    if (/\b\d+\+?\s*years?\b/i.test(statement) || hasUnsupportedYoE) {
      return "Add a concise summary highlighting the candidate's demonstrated full-stack and AI/SaaS experience.";
    }
  }

  // 11. General willingness-to-learn check.
  if (lowerStatement.includes('willingness to learn') || lowerStatement.includes('willing to learn') || lowerStatement.includes('interest in learning')) {
    return '';
  }

  // 12. False future-dated claim check.
  const FUTURE_DATED_RE = /\bfuture[- ]dated\b/i;
  if (FUTURE_DATED_RE.test(statement)) {
    if (!hasActualDateContradiction(resume)) {
      return '';
    }
  }

  return statement;
}

// ─── Deterministic Quality Scoring ──────────────────────────────────────────

export interface DeterministicQualityBreakdown {
  overallQualityScore: number;
  writingQuality: number;
  professionalTone: number;
  conciseness: number;
  readability: number;
  consistency: number;
  impact: number;
  redundancy: number;
  criteria: {
    grammarSpelling: number;
    readability: number;
    formatting: number;
    parseability: number;
    impact: number;
    conciseness: number;
    consistency: number;
  };
}

/**
 * Compute deterministic resume quality score across explicit criteria:
 * - Grammar & Spelling: 15%
 * - Readability: 15%
 * - Formatting: 15%
 * - Parseability: 15%
 * - Impact: 20%
 * - Conciseness: 10%
 * - Consistency: 10%
 * Stable and reproducible across runs for identical resumes.
 */
export function computeDeterministicQuality(resume: GeneratedResume): DeterministicQualityBreakdown {
  const grammar = analyzeGrammarSpelling(resume);
  const grammarScore = clamp(Math.round((grammar.score / 5) * 100), 0, 100);

  const readability = analyzeReadability(resume);
  const readabilityScore = clamp(Math.round((readability.score / 5) * 100), 0, 100);

  const formatting = analyzeFormatting(resume);
  const formattingScore = clamp(Math.round((formatting.score / 15) * 100), 0, 100);

  const parseability = analyzeParseability(resume);
  const parseabilityScore = clamp(Math.round((parseability.score / 15) * 100), 0, 100);

  const impact = analyzeImpact(resume);
  const impactScore = clamp(Math.round((impact.score / 5) * 100), 0, 100);

  // Conciseness criteria (0-100)
  const bullets = getAllBullets(resume);
  let concisenessScore = 75;
  if (bullets.length > 0) {
    const idealBullets = bullets.filter((b) => {
      const wc = wordCount(b);
      return wc >= 10 && wc <= 30;
    }).length;
    const idealRatio = idealBullets / bullets.length;
    const longBullets = bullets.filter((b) => wordCount(b) > 38).length;
    const shortBullets = bullets.filter((b) => wordCount(b) < 7).length;
    const fullTxt = extractAllResumeText(resume).toLowerCase();
    let fillerHits = 0;
    for (const f of FILLER_WORDS) {
      if (fullTxt.includes(f)) fillerHits++;
    }
    const summaryWords = resume.summary ? wordCount(resume.summary) : 0;
    const summaryPenalty = summaryWords > 80 ? 10 : 0;
    concisenessScore = clamp(
      Math.round(idealRatio * 100 - longBullets * 5 - shortBullets * 4 - fillerHits * 3 - summaryPenalty),
      20,
      100,
    );
  }

  // Consistency criteria (0-100)
  let consistencyScore = 80;
  if (bullets.length > 0) {
    const withPeriod = bullets.filter((b) => /[.!?]$/.test(b.trim())).length;
    const withoutPeriod = bullets.length - withPeriod;
    const punctUniformity = Math.max(withPeriod, withoutPeriod) / bullets.length;
    const punctScore = Math.round(punctUniformity * 100);

    const experiences = resume.experiences || [];
    const hasValidDates = experiences.every((e) => e.startDate && !isNaN(new Date(e.startDate).getTime()));
    const dateScore = hasValidDates ? 100 : 70;
    consistencyScore = clamp(Math.round(punctScore * 0.6 + dateScore * 0.4), 20, 100);
  }

  // Redundancy criteria (0-100, higher = less redundancy)
  let duplicateCount = 0;
  const seenBullets = new Set<string>();
  for (const b of bullets) {
    const norm = b.trim().toLowerCase();
    if (seenBullets.has(norm)) duplicateCount++;
    seenBullets.add(norm);
  }
  const seenSkills = new Set<string>();
  for (const s of resume.skills || []) {
    const norm = s.name.trim().toLowerCase();
    if (seenSkills.has(norm)) duplicateCount++;
    seenSkills.add(norm);
  }
  const redundancyScore = clamp(100 - duplicateCount * 15, 20, 100);

  const professionalToneScore = clamp(Math.round(0.5 * readabilityScore + 0.5 * grammarScore), 20, 100);

  const overallQualityScore = clamp(
    Math.round(
      grammarScore * 0.15 +
      readabilityScore * 0.15 +
      formattingScore * 0.15 +
      parseabilityScore * 0.15 +
      impactScore * 0.20 +
      concisenessScore * 0.10 +
      consistencyScore * 0.10,
    ),
    0,
    100,
  );

  return {
    overallQualityScore,
    writingQuality: grammarScore,
    professionalTone: professionalToneScore,
    conciseness: concisenessScore,
    readability: readabilityScore,
    consistency: consistencyScore,
    impact: impactScore,
    redundancy: redundancyScore,
    criteria: {
      grammarSpelling: grammarScore,
      readability: readabilityScore,
      formatting: formattingScore,
      parseability: parseabilityScore,
      impact: impactScore,
      conciseness: concisenessScore,
      consistency: consistencyScore,
    },
  };
}

// ─── Semantic Concept Normalization & Deduplication ─────────────────────────

/**
 * Extract semantic concept from a recommendation / weakness statement.
 */
export function getStatementConcept(statement: string): string | null {
  const lower = statement.toLowerCase().trim();

  // Summary concept (e.g. "Missing summary section", "Resume lacks a summary", "Add summary")
  if (/\b(?:summary|professional\s+summary|summary\s+section|profile\s+summary)\b/i.test(lower)) {
    return 'concept:summary';
  }

  // Tense / Verb form
  if (/\b(?:tense|past\s+tense|present\s+tense|collaborate\s+to\s+collaborated|verb\s+tense)\b/i.test(lower)) {
    return 'concept:tense';
  }

  // Punctuation / Period
  if (/\b(?:punctuation|terminal\s+punctuation|periods?\s+at\s+the\s+end|bullet\s+punctuation)\b/i.test(lower)) {
    return 'concept:punctuation';
  }

  // Passive voice
  if (/\b(?:passive\s+voice|active\s+voice)\b/i.test(lower)) {
    return 'concept:passive_voice';
  }

  // Weak action verbs
  if (/\b(?:weak\s+verbs?|weak\s+action\s+verbs?|weak\s+phrases?|responsible\s+for|duties\s+included)\b/i.test(lower)) {
    return 'concept:weak_verbs';
  }

  // Coursework
  if (/\b(?:coursework|relevant\s+coursework|courses?)\b/i.test(lower)) {
    return 'concept:coursework';
  }

  // Contact info
  if (/\b(?:contact\s+info(?:rmation)?|missing\s+phone|missing\s+email|phone\s+number|email\s+address)\b/i.test(lower)) {
    return 'concept:contact_info';
  }

  // Overlapping roles / timeline
  if (/\b(?:overlap|overlapping|concurrent\s+roles|employment\s+dates|time\s+commitment)\b/i.test(lower)) {
    return 'concept:timeline_overlap';
  }

  // Redundancy / duplicate content
  const redundMatch = lower.match(/\b(?:duplicate|redundant|repeated|repetition)\b[^.]*\b([a-z0-9+#.-]{3,})\b/i);
  if (redundMatch) {
    return `concept:redundancy:${redundMatch[1]}`;
  }
  if (/\b(?:duplicate|redundant|repeated|repetition)\b/i.test(lower)) {
    return 'concept:redundancy:general';
  }

  // Specific technology (missing or placement)
  for (const kw of TECH_KEYWORDS) {
    if (textHasKeyword(lower, kw)) {
      if (lower.includes('not demonstrated') || lower.includes('missing') || lower.includes('the jd mentions')) {
        return `concept:missing_tech:${CONCEPT_OF[kw] ?? kw}`;
      }
      return `concept:tech:${CONCEPT_OF[kw] ?? kw}`;
    }
  }

  // Bullet length / verbosity
  if (/\b(?:bullet\s+length|words?\s+long|exceed\s+40\s+words|too\s+verbose|too\s+long)\b/i.test(lower)) {
    return 'concept:bullet_length';
  }

  // Metric / quantification
  if (/\b(?:metric|quantif|measurable\s+outcome|numbers?|percentages?|dollar\s+amounts?)\b/i.test(lower)) {
    return 'concept:metrics';
  }

  return null;
}

/**
 * Check if two statements are semantically equivalent findings.
 */
export function areStatementsSemanticallyEquivalent(a: string, b: string): boolean {
  if (a.trim().toLowerCase() === b.trim().toLowerCase()) return true;

  const ca = getStatementConcept(a);
  const cb = getStatementConcept(b);
  if (ca && cb && ca === cb) return true;

  // Token similarity fallback
  const cleanA = a.toLowerCase().replace(/[^a-z0-9\s]/g, ' ').split(/\s+/).filter((w) => w.length > 3);
  const cleanB = b.toLowerCase().replace(/[^a-z0-9\s]/g, ' ').split(/\s+/).filter((w) => w.length > 3);
  if (cleanA.length === 0 || cleanB.length === 0) return false;
  const setA = new Set(cleanA);
  const setB = new Set(cleanB);
  let intersection = 0;
  for (const w of setA) {
    if (setB.has(w)) intersection++;
  }
  const union = new Set([...setA, ...setB]).size;
  return union > 0 && intersection / union >= 0.6;
}

/**
 * Deduplicate recommendations by semantic concept and word similarity.
 */
export function deduplicateRecommendations(statements: string[]): string[] {
  const result: string[] = [];
  const seenConcepts = new Set<string>();

  for (const s of statements) {
    const trimmed = s.trim();
    if (!trimmed) continue;

    const concept = getStatementConcept(trimmed);
    if (concept) {
      if (seenConcepts.has(concept)) {
        // Concept already represented — keep the more informative / longer finding
        const existingIdx = result.findIndex((r) => getStatementConcept(r) === concept);
        if (existingIdx >= 0 && trimmed.length > result[existingIdx].length + 20) {
          result[existingIdx] = trimmed;
        }
        continue;
      }
      seenConcepts.add(concept);
    }

    // Token-similarity check against already kept items
    const isDup = result.some((kept) => areStatementsSemanticallyEquivalent(kept, trimmed));
    if (isDup) continue;

    result.push(trimmed);
  }

  return result;
}

/**
 * Cross-engine deduplication across ATS Report, Quality Report, and Recruiter Review.
 * Guarantees zero overlapping findings across Quick Wins, Actionable Recommendations,
 * and Recruiter Review.
 */
export function deduplicateCrossEngineResults(
  ats?: ATSReport | null,
  quality?: QualityReport | null,
  recruiter?: RecruiterReview | null,
): void {
  // 1. Deduplicate within recruiter review
  if (recruiter) {
    recruiter.strengths = deduplicateRecommendations(recruiter.strengths || []);
    recruiter.weaknesses = deduplicateRecommendations(recruiter.weaknesses || []);
    recruiter.biggestConcerns = deduplicateRecommendations(recruiter.biggestConcerns || []);
    recruiter.topImprovements = deduplicateRecommendations(recruiter.topImprovements || []);
  }

  // 2. Deduplicate within quality review
  if (quality) {
    quality.strengths = deduplicateRecommendations(quality.strengths || []);
    quality.weaknesses = deduplicateRecommendations(quality.weaknesses || []);
    quality.quickWins = deduplicateRecommendations(quality.quickWins || []);

    // Cross-deduplicate quality weaknesses against recruiter weaknesses:
    // Do not show the same weakness twice across Recruiter Review and Resume Quality!
    if (recruiter?.weaknesses?.length) {
      quality.weaknesses = quality.weaknesses.filter((qw: string) =>
        !recruiter.weaknesses.some((rw: string) => areStatementsSemanticallyEquivalent(qw, rw))
      );
      // Also ensure quickWins don't duplicate recruiter weaknesses
      quality.quickWins = quality.quickWins.filter((qw: string) =>
        !recruiter.weaknesses.some((rw: string) => areStatementsSemanticallyEquivalent(qw, rw))
      );
    }
  }

  // 3. Deduplicate within ATS report
  if (ats?.recruiterFeedback) {
    ats.recruiterFeedback.strengths = deduplicateRecommendations(ats.recruiterFeedback.strengths || []);
    ats.recruiterFeedback.weaknesses = deduplicateRecommendations(ats.recruiterFeedback.weaknesses || []);
    ats.recruiterFeedback.recruiterComments = deduplicateRecommendations(ats.recruiterFeedback.recruiterComments || []);
    ats.recruiterFeedback.topImprovements = deduplicateRecommendations(ats.recruiterFeedback.topImprovements || []);
    ats.recruiterFeedback.keywordRecommendations = deduplicateRecommendations(ats.recruiterFeedback.keywordRecommendations || []);
    ats.recruiterFeedback.formattingAdvice = deduplicateRecommendations(ats.recruiterFeedback.formattingAdvice || []);

    // Cross-deduplicate topImprovements against quality.quickWins:
    // Actionable recommendations must not repeat a quick win!
    if (quality?.quickWins?.length) {
      const distinctFromQuickWins = ats.recruiterFeedback.topImprovements.filter((ti: string) =>
        !quality.quickWins.some((qw: string) => areStatementsSemanticallyEquivalent(ti, qw))
      );
      ats.recruiterFeedback.topImprovements = distinctFromQuickWins;
    }

    // Cross-deduplicate topImprovements against recruiter.weaknesses:
    if (recruiter?.weaknesses?.length) {
      const distinctFromWeaknesses = ats.recruiterFeedback.topImprovements.filter((ti: string) =>
        !recruiter.weaknesses.some((rw: string) => areStatementsSemanticallyEquivalent(ti, rw))
      );
      ats.recruiterFeedback.topImprovements = distinctFromWeaknesses;
    }
  }
}
