import { GeneratedResume } from '../../ai/types';
import { ATSReport, ATSScoreBreakdown } from './ats.types';

// ─── Reference word lists ────────────────────────────────────────────────────

const TECH_KEYWORDS = [
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

function extractAllResumeText(resume: GeneratedResume): string {
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

function getAllBullets(resume: GeneratedResume): string[] {
  const bullets: string[] = [];
  for (const exp of resume.experiences || []) {
    if (exp.bulletPoints) bullets.push(...exp.bulletPoints);
  }
  for (const proj of resume.projects || []) {
    if (proj.bulletPoints) bullets.push(...proj.bulletPoints);
  }
  return bullets;
}

function hasMetric(text: string): boolean {
  return /\b\d+%\b|\b\d+\s*x\b|\$\d+([,.]\d+)?\b|\b\d+\s*(million|billion|k|M|B)\b|\b\d{1,3}(,\d{3})+\b/i.test(text);
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
  let score = 0;
  const warnings: string[] = [];
  const strengths: string[] = [];

  // Section completeness (0–5)
  const sectionChecks = [
    { present: !!resume.summary?.trim(), label: 'Summary', pts: 1 },
    { present: (resume.experiences || []).length > 0, label: 'Experience', pts: 1.5 },
    { present: (resume.projects || []).length > 0, label: 'Projects', pts: 1 },
    { present: (resume.skills || []).length > 0, label: 'Skills', pts: 1 },
    { present: (resume.education || []).length > 0, label: 'Education', pts: 0.5 },
  ];
  for (const sec of sectionChecks) {
    if (sec.present) { score += sec.pts; }
    else { warnings.push(`Missing section: ${sec.label}.`); }
  }
  if (sectionChecks.every((s) => s.present)) strengths.push('All standard resume sections present.');

  // Contact completeness (0–2)
  const text = extractAllResumeText(resume);
  const hasEmail = /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}\b/.test(text);
  if (hasEmail) score += 1;
  const hasPhone = /\b\d{7,}\b/.test(text);
  if (hasPhone) score += 1;
  if (hasEmail && hasPhone) strengths.push('Contact info (email + phone) is complete.');

  // Word count (0–3)
  const wc = wordCount(text);
  if (wc >= 250 && wc <= 550) {
    score += 3;
    strengths.push('Word count is in the optimal 1-page range (250–550 words).');
  } else if ((wc >= 150 && wc < 250) || (wc > 550 && wc <= 700)) {
    score += 2;
    warnings.push(`Word count is ${wc} — slightly ${wc < 250 ? 'low' : 'high'} for a 1-page resume.`);
  } else if (wc > 700) {
    score += 1;
    warnings.push('Word count exceeds 700 — resume is likely 2+ pages. Consider trimming for 1-page format.');
  } else if (wc > 0) {
    score += 0;
    warnings.push('Resume content is very sparse — add more detail to fill at least 1 page.');
  }

  // Consistent dates (0–1)
  const exps = resume.experiences || [];
  if (exps.length > 0) {
    const allHaveDates = exps.every((e) => e.startDate);
    if (allHaveDates) { score += 1; }
    else { warnings.push('Inconsistent date formatting — some experiences lack start dates.'); }
  } else {
    score += 1; // No experiences = no inconsistency
  }

  // Bullet formatting (0–2)
  const bullets = getAllBullets(resume);
  if (bullets.length > 0) {
    const lengths = bullets.map((b) => b.trim().length);
    const avgLen = lengths.reduce((a, b) => a + b, 0) / lengths.length;
    const consistent = lengths.every((l) => Math.abs(l - avgLen) < avgLen * 0.8);
    if (consistent) {
      score += 1;
      strengths.push('Bullet points have consistent length — clean formatting.');
    } else {
      warnings.push('Bullet points have inconsistent lengths — some are much longer than others.');
    }
    const reasonableLen = lengths.filter((l) => l >= 30 && l <= 200).length / lengths.length;
    if (reasonableLen > 0.7) score += 1;
    else { warnings.push('Many bullet points are too short (< 30 chars) or too long (> 200 chars).'); }
  } else {
    warnings.push('No bullet points found — formatting assessment limited.');
  }

  score = clamp(Math.round(score), 0, 15);
  return { score, warnings, strengths, description: `Formatting score: ${score}/15.` };
}

// ─── 3. Keyword Match (0–20) ─────────────────────────────────────────────────

function analyzeKeywordMatch(jd: string, resume: GeneratedResume): {
  score: number; matched: string[]; missing: string[]; warnings: string[]; strengths: string[];
} {
  const jdLower = jd.toLowerCase();

  // Find which tech keywords appear in the JD
  const jdKeywords = TECH_KEYWORDS.filter((kw) => new RegExp(`\\b${escapeRegExp(kw)}\\b`, 'i').test(jdLower));

  if (jdKeywords.length === 0) {
    return {
      score: 20, matched: [], missing: [],
      strengths: ['No technical keywords detected in the JD — full keyword score awarded.'],
      warnings: [],
    };
  }

  // Classify as required vs preferred based on surrounding context
  const sentences = jd.split(/[.!?\n]+/);
  const required: string[] = [];
  const preferred: string[] = [];

  for (const kw of jdKeywords) {
    let isPreferred = false;
    for (const sentence of sentences) {
      if (sentence.toLowerCase().includes(kw)) {
        if (/preferred|nice to have|bonus|plus|desired|optional/i.test(sentence)) {
          isPreferred = true;
          break;
        }
      }
    }
    (isPreferred ? preferred : required).push(kw);
  }

  // Match against resume sections with weighting
  const summaryText = (resume.summary || '').toLowerCase();
  const expText = (resume.experiences || []).map((e) =>
    [e.role, e.companyName, e.description, ...(e.bulletPoints || [])].join(' ').toLowerCase()
  ).join(' ');
  const projText = (resume.projects || []).map((p) =>
    [p.name, p.description, ...(p.bulletPoints || [])].join(' ').toLowerCase()
  ).join(' ');
  const skillsText = (resume.skills || []).map((s) => s.name.toLowerCase()).join(' ');

  // Weights: Experience=4, Projects=3, Summary=2, Skills=1
  const sectionWeight = { experience: 4, project: 3, summary: 2, skills: 1 };

  function matchWeighted(kw: string): number {
    const regex = new RegExp(`\\b${escapeRegExp(kw)}\\b`, 'i');
    let weight = 0;
    if (regex.test(expText)) weight += sectionWeight.experience;
    if (regex.test(projText)) weight += sectionWeight.project;
    if (regex.test(summaryText)) weight += sectionWeight.summary;
    if (regex.test(skillsText)) weight += sectionWeight.skills;
    return weight;
  }

  let totalRequiredWeight = required.length * sectionWeight.experience; // max possible per required kw
  let matchedRequiredWeight = 0;
  let totalPreferredWeight = preferred.length * sectionWeight.skills; // lower max for preferred
  let matchedPreferredWeight = 0;

  const matched: string[] = [];
  const missing: string[] = [];

  for (const kw of required) {
    const w = matchWeighted(kw);
    matchedRequiredWeight += Math.min(w, sectionWeight.experience);
    if (w > 0) matched.push(kw); else missing.push(kw);
  }
  for (const kw of preferred) {
    const w = matchWeighted(kw);
    matchedPreferredWeight += Math.min(w, sectionWeight.skills);
    if (w > 0) matched.push(kw); else missing.push(kw);
  }

  // Required: 80% weight, Preferred: 20% weight, scaled to 20 points
  const reqRatio = totalRequiredWeight > 0 ? matchedRequiredWeight / totalRequiredWeight : 1;
  const prefRatio = totalPreferredWeight > 0 ? matchedPreferredWeight / totalPreferredWeight : 1;
  const rawScore = (reqRatio * 0.8 + prefRatio * 0.2) * 20;

  // Keyword stuffing penalty: if any single keyword appears > 5 times in resume text
  const fullText = extractAllResumeText(resume).toLowerCase();
  let stuffedCount = 0;
  for (const kw of matched) {
    if (countOccurrences(fullText, kw) > 5) stuffedCount++;
  }
  const stuffingPenalty = stuffedCount > 0 ? Math.min(4, stuffedCount) : 0;

  const score = clamp(Math.round(rawScore - stuffingPenalty), 0, 20);

  const warnings: string[] = [];
  const strengths: string[] = [];
  if (missing.length > 0) {
    const topMissing = missing.slice(0, 5).map(capitalizeWord).join(', ');
    warnings.push(`Missing keywords: ${topMissing}.`);
  }
  if (stuffedCount > 0) {
    warnings.push(`Keyword stuffing detected for ${stuffedCount} term(s) — ATS may flag as spam.`);
  }
  if (matched.length / jdKeywords.length >= 0.8) strengths.push('Strong keyword alignment with the job description.');
  if (matched.length / jdKeywords.length < 0.4) warnings.push('Low keyword match — resume will rank poorly in ATS filters.');

  return { score, matched, missing, warnings, strengths };
}

// ─── 4. Skills Match (0–15) ──────────────────────────────────────────────────

function analyzeSkillsMatch(jd: string, resume: GeneratedResume): {
  score: number; warnings: string[]; strengths: string[];
} {
  const candidateSkills = (resume.skills || []).map((s) => s.name.toLowerCase());
  const jdLower = jd.toLowerCase();

  const jdSkills = TECH_KEYWORDS.filter((kw) => new RegExp(`\\b${escapeRegExp(kw)}\\b`, 'i').test(jdLower));

  if (jdSkills.length === 0) {
    return { score: 15, strengths: ['No specific skills required in JD — full score.'], warnings: [] };
  }

  // Required vs preferred split
  const sentences = jd.split(/[.!?\n]+/);
  const requiredList: string[] = [];
  const preferredList: string[] = [];

  for (const skill of jdSkills) {
    let isPreferred = false;
    for (const sentence of sentences) {
      if (sentence.toLowerCase().includes(skill)) {
        if (/preferred|nice to have|bonus|plus|desired|optional/i.test(sentence)) {
          isPreferred = true;
          break;
        }
      }
    }
    (isPreferred ? preferredList : requiredList).push(skill);
  }

  const matchedRequired = requiredList.filter((s) => candidateSkills.includes(s));
  const matchedPreferred = preferredList.filter((s) => candidateSkills.includes(s));
  const missingRequired = requiredList.filter((s) => !candidateSkills.includes(s));

  const reqRatio = requiredList.length > 0 ? matchedRequired.length / requiredList.length : 1;
  const prefRatio = preferredList.length > 0 ? matchedPreferred.length / preferredList.length : 1;

  // 80% required, 20% preferred, scaled to 15
  const rawScore = (reqRatio * 0.8 + prefRatio * 0.2) * 15;
  const score = clamp(Math.round(rawScore), 0, 15);

  const warnings: string[] = [];
  const strengths: string[] = [];

  if (missingRequired.length > 0) {
    warnings.push(`Missing required skills: ${missingRequired.slice(0, 5).map(capitalizeWord).join(', ')}.`);
  }
  if (matchedRequired.length === requiredList.length && requiredList.length > 0) {
    strengths.push('Matches 100% of required skills.');
  }
  if (candidateSkills.length === 0) {
    warnings.push('No skills listed on resume — critical for ATS matching.');
  }
  const extraSkills = candidateSkills.filter((s) => !jdSkills.includes(s));
  if (extraSkills.length > 3) {
    warnings.push(`${extraSkills.length} skills listed that are not mentioned in the JD — may dilute focus.`);
  }

  return { score, warnings, strengths };
}

// ─── 5. Experience Relevance (0–15) ──────────────────────────────────────────

function analyzeExperienceRelevance(jd: string, resume: GeneratedResume): {
  score: number; warnings: string[]; strengths: string[]; description: string;
} {
  let score = 0;
  const warnings: string[] = [];
  const strengths: string[] = [];
  const experiences = resume.experiences || [];
  const jdLower = jd.toLowerCase();

  // YoE requirement (0–5)
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
      score += 5;
      strengths.push(`Meets experience requirement (${candidateYoE} vs ${requiredYoE}+ years).`);
    } else if (candidateYoE >= requiredYoE * 0.7) {
      score += 3;
      warnings.push(`Experience slightly below requirement (${candidateYoE} vs ${requiredYoE}+ years).`);
    } else {
      score += 1;
      warnings.push(`Significant experience gap (${candidateYoE} vs ${requiredYoE}+ years).`);
    }
  } else {
    score += 4; // No specific requirement
    if (candidateYoE > 0) strengths.push(`Has ${candidateYoE} years of experience (no specific requirement in JD).`);
  }

  // Role relevance (0–5)
  const targetRole = resume.metadata?.targetRole || '';
  const jdRoleWords = [...new Set(jdLower.split(/\s+/).filter((w) => w.length > 4))];
  let roleMatchScore = 0;
  for (const exp of experiences) {
    const expRole = exp.role.toLowerCase();
    // Check if any JD role word appears in the experience role
    if (jdRoleWords.some((w) => expRole.includes(w))) {
      roleMatchScore += 2;
    }
    // Check target role words
    if (targetRole) {
      const targetWords = targetRole.toLowerCase().split(/\s+/);
      if (targetWords.some((w) => w.length > 3 && expRole.includes(w))) {
        roleMatchScore += 1;
      }
    }
  }
  score += Math.min(5, roleMatchScore);
  if (roleMatchScore >= 4) strengths.push('Previous roles strongly match the target position.');
  else if (roleMatchScore < 2 && experiences.length > 0) warnings.push('Previous roles do not clearly overlap with the target position.');

  // Technology relevance (0–3)
  const jdTechs = TECH_KEYWORDS.filter((kw) => new RegExp(`\\b${escapeRegExp(kw)}\\b`, 'i').test(jdLower));
  const expTechs = experiences.map((e) =>
    [e.description || '', ...(e.bulletPoints || [])].join(' ')
  ).join(' ').toLowerCase();
  let techOverlap = 0;
  for (const tech of jdTechs) {
    if (new RegExp(`\\b${escapeRegExp(tech)}\\b`, 'i').test(expTechs)) techOverlap++;
  }
  const techRatio = jdTechs.length > 0 ? techOverlap / jdTechs.length : 0;
  score += Math.round(Math.min(3, techRatio * 3));
  if (techRatio > 0.6) strengths.push('Experience demonstrates strong technology overlap with the job.');

  // Career progression (0–2)
  if (experiences.length >= 2) {
    // Check for leadership or increasing responsibility
    const hasLeadership = experiences.some((e) =>
      LEADERSHIP_SIGNALS.some((sig) => e.role.toLowerCase().includes(sig) || (e.description || '').toLowerCase().includes(sig))
    );
    if (hasLeadership) {
      score += 2;
      strengths.push('Experience shows leadership or increasing responsibility.');
    } else {
      score += 1;
    }
  } else if (experiences.length === 1) {
    score += 1;
  }

  score = clamp(score, 0, 15);
  return { score, warnings, strengths, description: `Experience relevance: ${score}/15. Candidate YoE: ${candidateYoE}.` };
}

// ─── 6. Education (0–5) ──────────────────────────────────────────────────────

function analyzeEducationMatch(jd: string, resume: GeneratedResume): {
  score: number; warnings: string[]; strengths: string[];
} {
  const educations = resume.education || [];
  if (educations.length === 0) {
    return { score: 1, warnings: ['No education section found.'], strengths: [] };
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
    return { score: 3, warnings: ['No bullet points to analyze for grammar.'], strengths: [] };
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
    return { score: 2, warnings: ['No bullet points to assess readability.'], strengths: [] };
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
} {
  const bullets = getAllBullets(resume);
  if (bullets.length === 0) {
    return { score: 0, warnings: ['No bullet points to assess impact.'], strengths: [] };
  }

  let score = 0;
  const warnings: string[] = [];
  const strengths: string[] = [];

  // Metrics (0–2)
  let metricCount = 0;
  for (const b of bullets) {
    if (hasMetric(b)) metricCount++;
  }
  const metricRatio = metricCount / bullets.length;
  if (metricRatio >= 0.5) {
    score += 2;
    strengths.push(`${Math.round(metricRatio * 100)}% of bullets contain quantifiable metrics.`);
  } else if (metricRatio >= 0.3) {
    score += 1;
    warnings.push(`Only ${Math.round(metricRatio * 100)}% of bullets include metrics — aim for 50%+.`);
  } else {
    warnings.push(`Low quantification: ${Math.round(metricRatio * 100)}% of bullets have metrics. Add numbers, percentages, or dollar amounts.`);
  }

  // Action verbs (0–2)
  let actionVerbCount = 0;
  for (const b of bullets) {
    const firstWord = b.trim().split(/\s+/)[0]?.replace(/[^a-zA-Z]/g, '').toLowerCase();
    if (firstWord && ACTION_VERBS.includes(firstWord)) actionVerbCount++;
  }
  const verbRatio = actionVerbCount / bullets.length;
  if (verbRatio >= 0.7) {
    score += 2;
    strengths.push(`${Math.round(verbRatio * 100)}% of bullets start with strong action verbs.`);
  } else if (verbRatio >= 0.4) {
    score += 1;
    warnings.push(`Only ${Math.round(verbRatio * 100)}% of bullets start with strong action verbs.`);
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
  }

  return { score: clamp(Math.round(score * 2) / 2, 0, 5), warnings, strengths };
}

// ─── Main entry point ────────────────────────────────────────────────────────

/**
 * Deterministically analyzes a resume JSON against a target Job Description.
 * Produces a point-based rubric score (0–100) across 9 categories.
 */
export function analyzeATS(
  resume: GeneratedResume,
  jobDescription: string,
): ATSReport {
  const allWarnings: string[] = [];
  const allErrors: string[] = [];
  const allStrengths: string[] = [];

  // Run all 9 scorers
  const parseability = analyzeParseability(resume, jobDescription);
  const formatting = analyzeFormatting(resume);
  const keywordMatch = analyzeKeywordMatch(jobDescription, resume);
  const skillsMatch = analyzeSkillsMatch(jobDescription, resume);
  const experienceRelevance = analyzeExperienceRelevance(jobDescription, resume);
  const education = analyzeEducationMatch(jobDescription, resume);
  const grammar = analyzeGrammarSpelling(resume);
  const readability = analyzeReadability(resume);
  const impact = analyzeImpact(resume);

  // Collect warnings/errors/strengths
  allWarnings.push(...parseability.warnings, ...formatting.warnings, ...keywordMatch.warnings,
    ...skillsMatch.warnings, ...experienceRelevance.warnings, ...education.warnings,
    ...grammar.warnings, ...readability.warnings, ...impact.warnings);
  allErrors.push(...parseability.errors);
  allStrengths.push(...parseability.strengths, ...formatting.strengths, ...keywordMatch.strengths,
    ...skillsMatch.strengths, ...experienceRelevance.strengths, ...education.strengths,
    ...grammar.strengths, ...readability.strengths, ...impact.strengths);

  // Build breakdown
  const breakdown: ATSScoreBreakdown = {
    parseability: parseability.score,
    formatting: formatting.score,
    keywordMatch: keywordMatch.score,
    skillsMatch: skillsMatch.score,
    experienceRelevance: experienceRelevance.score,
    education: education.score,
    grammarSpelling: grammar.score,
    readability: readability.score,
    impact: impact.score,
  };

  const overallScore = clamp(
    Object.values(breakdown).reduce((a, b) => a + b, 0),
    0,
    100,
  );

  const detailedBreakdown = [
    { category: 'Parseability', score: breakdown.parseability, max: 15, description: parseability.description },
    { category: 'Formatting', score: breakdown.formatting, max: 15, description: formatting.description },
    { category: 'Keyword Match', score: breakdown.keywordMatch, max: 20,
      description: `Matched ${keywordMatch.matched.length}/${keywordMatch.matched.length + keywordMatch.missing.length} keywords from JD.` },
    { category: 'Skills Match', score: breakdown.skillsMatch, max: 15,
      description: `Skills scored ${breakdown.skillsMatch}/15 based on required/preferred match.` },
    { category: 'Experience Relevance', score: breakdown.experienceRelevance, max: 15, description: experienceRelevance.description },
    { category: 'Education', score: breakdown.education, max: 5,
      description: `Education scored ${breakdown.education}/5.` },
    { category: 'Grammar & Spelling', score: breakdown.grammarSpelling, max: 5,
      description: `Grammar scored ${breakdown.grammarSpelling}/5.` },
    { category: 'Readability', score: breakdown.readability, max: 5,
      description: `Readability scored ${breakdown.readability}/5.` },
    { category: 'Impact & Quantification', score: breakdown.impact, max: 5,
      description: `Impact scored ${breakdown.impact}/5.` },
  ];

  return {
    overallScore,
    scoreBreakdown: breakdown,
    matchedKeywords: keywordMatch.matched,
    missingKeywords: keywordMatch.missing,
    warnings: allWarnings,
    errors: allErrors,
    strengths: allStrengths,
    detailedBreakdown,
  };
}
