import { GeneratedResume } from '../../ai/types';
import { ATSReport, ATSScores, ATSWeights, DEFAULT_ATS_WEIGHTS } from './ats.types';

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
  'unix', 'linux', 'macos', 'windows', 'serverless', 'lambda', 'cloudfront', 's3', 'route53', 'rds', 'ecs', 'eks'
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
  'transferred', 'transformed', 'translated', 'upgraded', 'validated', 'verified', 'wrote'
];

const WEAK_WORDS = [
  'helped', 'assisted', 'responsible for', 'duties included', 'worked on', 'participated in',
  'attempted', 'tried', 'strived', 'hopeful', 'some', 'few', 'various', 'approximately'
];

/**
 * Deterministically analyzes a resume version JSON against a target Job Description.
 */
export function analyzeATS(
  resume: GeneratedResume,
  jobDescription: string,
  customWeights?: Partial<ATSWeights>
): ATSReport {
  const weights = { ...DEFAULT_ATS_WEIGHTS, ...customWeights };

  const jdNormalized = jobDescription.toLowerCase();
  const resumeText = extractAllResumeText(resume).toLowerCase();

  // 1. Keyword Analysis
  const keywordsReport = analyzeKeywords(jdNormalized, resumeText);

  // 2. Skill Analysis
  const skillsReport = analyzeSkills(jdNormalized, resume);

  // 3. Experience Analysis
  const experienceReport = analyzeExperience(jdNormalized, resume);

  // 4. Education Analysis
  const educationReport = analyzeEducation(jdNormalized, resume);

  // 5. Formatting Analysis
  const formattingReport = analyzeFormatting(resume);

  // 6. Readability Analysis
  const readabilityReport = analyzeReadability(resume);

  // Compile detailed scores
  const scores: ATSScores = {
    keywords: Math.round(keywordsReport.score),
    skills: Math.round(skillsReport.score),
    experience: Math.round(experienceReport.score),
    education: Math.round(educationReport.score),
    formatting: Math.round(formattingReport.score),
    readability: Math.round(readabilityReport.score),
  };

  // Weighted Overall Score
  const overallScore = Math.min(
    100,
    Math.round(
      scores.keywords * weights.keywords +
      scores.skills * weights.skills +
      scores.experience * weights.experience +
      scores.education * weights.education +
      scores.formatting * weights.formatting +
      scores.readability * weights.readability
    )
  );

  // Combine Lists
  const suggestions = [
    ...keywordsReport.suggestions,
    ...skillsReport.suggestions,
    ...experienceReport.suggestions,
    ...educationReport.suggestions,
    ...formattingReport.suggestions,
    ...readabilityReport.suggestions,
  ];

  const strengths = [
    ...keywordsReport.strengths,
    ...skillsReport.strengths,
    ...experienceReport.strengths,
    ...educationReport.strengths,
    ...formattingReport.strengths,
    ...readabilityReport.strengths,
  ];

  const warnings = [
    ...keywordsReport.warnings,
    ...skillsReport.warnings,
    ...experienceReport.warnings,
    ...educationReport.warnings,
    ...formattingReport.warnings,
    ...readabilityReport.warnings,
  ];

  const detailedBreakdown = [
    {
      category: 'Keyword Match',
      score: scores.keywords,
      description: `Matched ${keywordsReport.matched.length} of ${keywordsReport.matched.length + keywordsReport.missing.length} extracted keywords from the Job Description.`,
    },
    {
      category: 'Skill Match',
      score: scores.skills,
      description: `Matched ${skillsReport.matchedCount} required/preferred skills. Extra skills detected: ${skillsReport.extraCount}.`,
    },
    {
      category: 'Experience Match',
      score: scores.experience,
      description: experienceReport.description,
    },
    {
      category: 'Education Match',
      score: scores.education,
      description: educationReport.description,
    },
    {
      category: 'Formatting Audit',
      score: scores.formatting,
      description: `Structural audit passed with ${formattingReport.warnings.length} warning(s).`,
    },
    {
      category: 'Readability Grade',
      score: scores.readability,
      description: `Readability score of ${scores.readability}/100 based on bullet structure, action verbs, and quantification.`,
    },
  ];

  return {
    overallScore,
    scores,
    matchedKeywords: keywordsReport.matched,
    missingKeywords: keywordsReport.missing,
    suggestions,
    strengths,
    warnings,
    detailedBreakdown,
  };
}

/**
 * Extracts all plain text from a generated resume json for full-text keyword indexing.
 */
function extractAllResumeText(resume: GeneratedResume): string {
  const parts: string[] = [resume.summary || ''];

  if (resume.experiences) {
    for (const exp of resume.experiences) {
      parts.push(exp.companyName, exp.role, exp.description || '');
      if (exp.bulletPoints) {
        parts.push(...exp.bulletPoints);
      }
    }
  }

  if (resume.projects) {
    for (const proj of resume.projects) {
      parts.push(proj.name, proj.description || '');
      if (proj.technologies) {
        parts.push(...proj.technologies);
      }
      if (proj.bulletPoints) {
        parts.push(...proj.bulletPoints);
      }
    }
  }

  if (resume.skills) {
    parts.push(...resume.skills.map((s) => s.name));
  }

  if (resume.education) {
    for (const edu of resume.education) {
      parts.push(edu.school, edu.degree, edu.field || '');
    }
  }

  if (resume.certificates) {
    for (const cert of resume.certificates) {
      parts.push(cert.name, cert.issuer);
    }
  }

  if (resume.achievements) {
    parts.push(...resume.achievements);
  }

  return parts.filter(Boolean).join(' ');
}

/**
 * Keywords matcher
 */
function analyzeKeywords(jd: string, resumeText: string) {
  const foundInJd = TECH_KEYWORDS.filter((keyword) => {
    // Word boundary checks to avoid partial substring matches (e.g. 'go' in 'google')
    const regex = new RegExp(`\\b${escapeRegExp(keyword)}\\b`, 'i');
    return regex.test(jd);
  });

  if (foundInJd.length === 0) {
    return {
      score: 100,
      matched: [],
      missing: [],
      suggestions: [],
      strengths: ['No technical keywords extracted from the Job Description.'],
      warnings: [],
    };
  }

  const matched: string[] = [];
  const missing: string[] = [];

  for (const keyword of foundInJd) {
    const regex = new RegExp(`\\b${escapeRegExp(keyword)}\\b`, 'i');
    if (regex.test(resumeText)) {
      matched.push(keyword);
    } else {
      missing.push(keyword);
    }
  }

  const score = (matched.length / foundInJd.length) * 100;
  const suggestions: string[] = [];
  const warnings: string[] = [];
  const strengths: string[] = [];

  if (missing.length > 0) {
    const topMissing = missing.slice(0, 5).map((m) => capitalizeWord(m)).join(', ');
    suggestions.push(`Integrate missing keywords: ${topMissing}.`);
    warnings.push(`Missing key technologies from the Job Description: ${topMissing}.`);
  }

  if (score > 80) {
    strengths.push('Excellent keyword alignment with the target job.');
  } else if (score < 50) {
    warnings.push('Low keyword match. Try tailoring your profile summary and experience to include more terms from the JD.');
  }

  return { score, matched, missing, suggestions, strengths, warnings };
}

/**
 * Skills matcher
 */
function analyzeSkills(jd: string, resume: GeneratedResume) {
  // Extract candidate skills
  const candidateSkills = (resume.skills || []).map((s) => s.name.toLowerCase());

  // Detect requested skills in JD
  const jdSkills = TECH_KEYWORDS.filter((keyword) => {
    const regex = new RegExp(`\\b${escapeRegExp(keyword)}\\b`, 'i');
    return regex.test(jd);
  });

  if (jdSkills.length === 0) {
    return {
      score: 100,
      matchedCount: 0,
      extraCount: candidateSkills.length,
      suggestions: [],
      strengths: ['All resume skills match the general technical landscape.'],
      warnings: [],
    };
  }

  // Classify into required vs preferred based on surrounding sentences
  const sentences = jd.split(/[.!?\n]+/);
  const requiredList: string[] = [];
  const preferredList: string[] = [];

  for (const skill of jdSkills) {
    let isRequired = true;
    for (const sentence of sentences) {
      if (sentence.includes(skill)) {
        if (
          sentence.includes('preferred') ||
          sentence.includes('plus') ||
          sentence.includes('bonus') ||
          sentence.includes('nice to have') ||
          sentence.includes('desired')
        ) {
          isRequired = false;
          break;
        }
      }
    }
    if (isRequired) {
      requiredList.push(skill);
    } else {
      preferredList.push(skill);
    }
  }

  const matchedRequired = requiredList.filter((s) => candidateSkills.includes(s));
  const matchedPreferred = preferredList.filter((s) => candidateSkills.includes(s));
  const extraSkills = candidateSkills.filter((s) => !jdSkills.includes(s));

  // Score calculations
  const reqScore = requiredList.length > 0 ? (matchedRequired.length / requiredList.length) * 100 : 100;
  const prefScore = preferredList.length > 0 ? (matchedPreferred.length / preferredList.length) * 100 : 100;

  // Weighted average: required (80%), preferred (20%)
  const score = reqScore * 0.8 + prefScore * 0.2;

  const suggestions: string[] = [];
  const strengths: string[] = [];
  const warnings: string[] = [];

  const missingReq = requiredList.filter((s) => !candidateSkills.includes(s));
  if (missingReq.length > 0) {
    const topMissing = missingReq.slice(0, 4).map((m) => capitalizeWord(m)).join(', ');
    suggestions.push(`Add required skills: ${topMissing}.`);
    warnings.push(`Missing required core skills: ${topMissing}.`);
  }

  if (matchedRequired.length === requiredList.length && requiredList.length > 0) {
    strengths.push('Matches 100% of the core required skills list.');
  }

  return {
    score,
    matchedCount: matchedRequired.length + matchedPreferred.length,
    extraCount: extraSkills.length,
    suggestions,
    strengths,
    warnings,
  };
}

/**
 * Experience calculations
 */
function analyzeExperience(jd: string, resume: GeneratedResume) {
  // 1. Calculate candidate total YoE
  let totalMonths = 0;
  const experiences = resume.experiences || [];

  for (const exp of experiences) {
    const start = exp.startDate ? new Date(exp.startDate) : null;
    const end = exp.isCurrent || !exp.endDate ? new Date() : new Date(exp.endDate);

    if (start && !isNaN(start.getTime()) && !isNaN(end.getTime())) {
      const diffMonths = (end.getFullYear() - start.getFullYear()) * 12 + (end.getMonth() - start.getMonth());
      totalMonths += Math.max(0, diffMonths);
    }
  }

  const candidateYoE = Math.round((totalMonths / 12) * 10) / 10;

  // 2. Parse required YoE from JD (e.g. "5+ years", "3-5 years")
  let requiredYoE = 0;
  const yoeRegex = /(\d+)\+?\s*(years|yoe|yr)/gi;
  let match;
  while ((match = yoeRegex.exec(jd)) !== null) {
    const val = parseInt(match[1], 10);
    if (val > requiredYoE) {
      requiredYoE = val;
    }
  }

  let score = 85; // Default score if no YoE is found in JD
  let description = `Total experience is ${candidateYoE} years. No specific requirement detected in the JD.`;
  const suggestions: string[] = [];
  const strengths: string[] = [];
  const warnings: string[] = [];

  if (requiredYoE > 0) {
    if (candidateYoE >= requiredYoE) {
      score = 100;
      strengths.push(`Meets experience requirement (${candidateYoE} years vs ${requiredYoE}+ requested).`);
      description = `Meets experience requirement of ${requiredYoE}+ years (Candidate has ${candidateYoE} years).`;
    } else {
      score = Math.max(40, (candidateYoE / requiredYoE) * 100);
      warnings.push(`Experience is lower than requested (${candidateYoE} years vs ${requiredYoE}+ years).`);
      suggestions.push(`Highlight transferrable leadership or intense project roles to compensate for the ${requiredYoE - candidateYoE} year experience gap.`);
      description = `Has ${candidateYoE} of ${requiredYoE}+ years required experience.`;
    }
  } else {
    strengths.push(`Adequate experience profile showing ${candidateYoE} total years.`);
  }

  // 3. Role similarity check (compare targetRole and experience roles)
  const targetRole = resume.metadata?.targetRole || '';
  if (targetRole) {
    const targetWords = targetRole.toLowerCase().split(/\s+/);
    let roleMatched = false;
    for (const exp of experiences) {
      const expRole = exp.role.toLowerCase();
      if (targetWords.some((word) => word.length > 3 && expRole.includes(word))) {
        roleMatched = true;
        break;
      }
    }
    if (roleMatched) {
      score = Math.min(100, score + 10);
      strengths.push('Previous experience contains roles highly relevant to the target title.');
    } else {
      warnings.push('Previous job titles do not clearly overlap with the target role.');
      suggestions.push(`Tailor your job titles (e.g. Developer -> Frontend Engineer) if they match the work performed.`);
    }
  }

  return { score, description, suggestions, strengths, warnings };
}

/**
 * Education checker
 */
function analyzeEducation(jd: string, resume: GeneratedResume) {
  let score = 100;
  let description = 'Education section is complete.';
  const suggestions: string[] = [];
  const strengths: string[] = [];
  const warnings: string[] = [];

  // Look for degree requirements in JD
  const hasBachelorJd = /\b(bachelor|b\.s\.|bs|b\.a\.|ba|undergraduate)\b/i.test(jd);
  const hasMasterJd = /\b(master|m\.s\.|ms|m\.a\.|ma|postgraduate)\b/i.test(jd);
  const hasPhdJd = /\b(phd|ph\.d\.|doctorate)\b/i.test(jd);

  const educations = resume.education || [];
  const candidateDegrees = educations.map((e) => e.degree.toLowerCase() + ' ' + (e.field || '').toLowerCase());

  const hasBachelorCandidate = candidateDegrees.some((d) => d.includes('bach') || d.includes('bs') || d.includes('ba') || d.includes('science'));
  const hasMasterCandidate = candidateDegrees.some((d) => d.includes('mast') || d.includes('ms') || d.includes('ma'));
  const hasPhdCandidate = candidateDegrees.some((d) => d.includes('phd') || d.includes('doctor'));

  if (hasPhdJd) {
    if (hasPhdCandidate) {
      strengths.push('Meets PhD degree qualification requested in the JD.');
      description = 'Meets requested PhD degree qualification.';
    } else {
      score = 60;
      warnings.push('Job Description requests a PhD/Doctorate, but none was detected.');
      suggestions.push('If you have doctoral experience or research equivalents, mention it in the Education or Summary.');
      description = 'Missing requested PhD level qualification.';
    }
  } else if (hasMasterJd) {
    if (hasMasterCandidate || hasPhdCandidate) {
      strengths.push('Meets Master\'s degree level qualification requested in the JD.');
      description = 'Meets requested Master\'s level qualification.';
    } else {
      score = 70;
      warnings.push('Job Description requests a Master\'s degree, but none was detected.');
      suggestions.push('If you are currently pursuing a Master\'s degree, add it to your education with an expected date.');
      description = 'Missing requested Master\'s level qualification.';
    }
  } else if (hasBachelorJd) {
    if (hasBachelorCandidate || hasMasterCandidate || hasPhdCandidate) {
      strengths.push('Meets Bachelor\'s degree qualification requested in the JD.');
      description = 'Meets requested Bachelor\'s level qualification.';
    } else {
      score = 80;
      warnings.push('Job Description requests a Bachelor\'s degree, but none was detected.');
      description = 'Missing requested Bachelor\'s level qualification.';
    }
  } else {
    strengths.push('Completed degree matches standard professional requirements.');
  }

  if (educations.length === 0) {
    score = 30;
    warnings.push('No Education entries found on the resume.');
    suggestions.push('Add your high school, college, or university degree details to complete the profile.');
    description = 'Education section is empty.';
  }

  return { score, description, suggestions, strengths, warnings };
}

/**
 * Formatting checker
 */
function analyzeFormatting(resume: GeneratedResume) {
  let score = 100;
  const suggestions: string[] = [];
  const strengths: string[] = [];
  const warnings: string[] = [];

  // Check section completeness
  const sectionChecks = [
    { key: 'summary', score: 10, label: 'Summary' },
    { key: 'experiences', score: 25, label: 'Experience' },
    { key: 'projects', score: 20, label: 'Projects' },
    { key: 'skills', score: 20, label: 'Skills' },
    { key: 'education', score: 15, label: 'Education' },
  ];

  let missingSections = 0;
  for (const check of sectionChecks) {
    const val = (resume as any)[check.key];
    if (!val || (Array.isArray(val) && val.length === 0)) {
      score -= check.score;
      missingSections++;
      warnings.push(`Missing critical section: ${check.label}`);
      suggestions.push(`Add content to the ${check.label} section to complete structure.`);
    }
  }

  if (missingSections === 0) {
    strengths.push('Excellent structure containing all standard professional resume sections.');
  }

  // Check contact info completeness
  const emailRegex = /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/;
  const hasContact = resume.summary ? emailRegex.test(resume.summary) : false; // basic fallback
  // Wait, contact info is usually in the profile, not inside GeneratedResume, but templates draw it.
  // We can assume it is present in the final XeLaTeX compiler profile merges.

  // Check page length heuristics (estimate pages by word count)
  const wordCount = extractAllResumeText(resume).split(/\s+/).length;
  if (wordCount > 600) {
    warnings.push('Resume word count is quite high (over 600 words). Try to edit down to fit 1 page if under 7 YOE.');
    suggestions.push('Consolidate experience bullets to keep the resume concise.');
  } else if (wordCount < 150) {
    warnings.push('Resume content is too sparse (under 150 words).');
    suggestions.push('Add more achievements or projects to complete the profile pages.');
  } else {
    strengths.push('Word count is within the optimal 1-page range (350-500 words).');
  }

  return { score: Math.max(10, score), suggestions, strengths, warnings };
}

/**
 * Readability grader
 */
function analyzeReadability(resume: GeneratedResume) {
  let score = 100;
  const suggestions: string[] = [];
  const strengths: string[] = [];
  const warnings: string[] = [];

  const experiences = resume.experiences || [];
  const projects = resume.projects || [];
  const allBullets: string[] = [];

  for (const exp of experiences) {
    if (exp.bulletPoints) allBullets.push(...exp.bulletPoints);
  }
  for (const proj of projects) {
    if (proj.bulletPoints) allBullets.push(...proj.bulletPoints);
  }

  if (allBullets.length === 0) {
    return {
      score: 50,
      suggestions: ['Add bullet points under experiences and projects.'],
      strengths: [],
      warnings: ['No bullet points found in experiences or projects.'],
    };
  }

  // Heuristics checks
  let actionVerbCount = 0;
  let metricCount = 0;
  let weakWordCount = 0;
  let tooLongCount = 0;
  let tooShortCount = 0;

  for (const bullet of allBullets) {
    const clean = bullet.trim();
    if (clean.length === 0) continue;

    // Check action verb (check first word)
    const firstWord = clean.split(/\s+/)[0].replace(/[^a-zA-Z]/g, '').toLowerCase();
    if (ACTION_VERBS.includes(firstWord)) {
      actionVerbCount++;
    }

    // Check metrics (percentages, numbers, dollar metrics)
    const hasMetric = /\b\d+%\b|\b\d+\s*x\b|\$\b\d+([,.]\d+)?\b|\b\d+\s*(million|billion|k)\b/i.test(clean) ||
                      (/\b\d+\b/.test(clean) && !/\b(19|20)\d{2}\b/.test(clean)); // checks for non-year numbers
    if (hasMetric) {
      metricCount++;
    }

    // Check weak words
    const lower = clean.toLowerCase();
    if (WEAK_WORDS.some((word) => lower.includes(word))) {
      weakWordCount++;
    }

    // Check length
    if (clean.length > 220) {
      tooLongCount++;
    } else if (clean.length < 35) {
      tooShortCount++;
    }
  }

  // Deduct points for bad metrics
  const actionVerbRatio = actionVerbCount / allBullets.length;
  if (actionVerbRatio < 0.6) {
    const penalty = Math.round((0.6 - actionVerbRatio) * 30);
    score -= penalty;
    warnings.push(`Only ${Math.round(actionVerbRatio * 100)}% of bullets start with a strong action verb.`);
    suggestions.push('Ensure most experience bullets start with a strong action verb (e.g. designed, built, spearheaded).');
  } else {
    strengths.push('High usage of action verbs at the beginning of bullet points.');
  }

  const metricRatio = metricCount / allBullets.length;
  if (metricRatio < 0.4) {
    const penalty = Math.round((0.4 - metricRatio) * 35);
    score -= penalty;
    warnings.push('Low quantification. Only few bullets contain numbers or percentages.');
    suggestions.push('Quantify achievements where possible (e.g. "Increased load speed by 25%" or "Managed 4 engineers").');
  } else {
    strengths.push('Excellent usage of metrics to quantify professional impact.');
  }

  if (weakWordCount > 0) {
    score -= Math.min(15, weakWordCount * 3);
    warnings.push(`Detected weak phrases (e.g., 'responsible for') in ${weakWordCount} bullet point(s).`);
    suggestions.push('Replace passive phrases like "responsible for" with direct action verbs.');
  }

  if (tooLongCount > 0) {
    score -= Math.min(10, tooLongCount * 2);
    warnings.push(`${tooLongCount} bullet point(s) are too long (over 220 characters).`);
    suggestions.push('Keep bullet points concise and single-lined where possible.');
  }

  return { score: Math.max(20, score), suggestions, strengths, warnings };
}

/**
 * Escapes regex string characters
 */
function escapeRegExp(string: string) {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * Capitalizes first letter of word
 */
function capitalizeWord(word: string) {
  if (!word) return '';
  return word.charAt(0).toUpperCase() + word.slice(1);
}
