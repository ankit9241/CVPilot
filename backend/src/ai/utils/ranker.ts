import {
  ResumeContext,
  ResumeContextExperience,
  ResumeContextProject,
  ResumeContextSkill,
  ResumeContextEducation,
  ResumeContextCertificate,
  ResumeContextAchievement,
} from '../../modules/workflow/generation-session.types';

/**
 * Score an experience entry based on relevance to the job description
 */
function calculateExperienceScore(
  exp: ResumeContextExperience,
  targetRole: string,
  jdKeywords: string[],
  jdText: string,
): number {
  let score = 0;

  // 1. Role similarity (targetRole overlap)
  const roleLower = exp.role.toLowerCase();
  const targetRoleLower = targetRole.toLowerCase();

  // Direct match or substring match gets a massive bonus
  if (roleLower === targetRoleLower) {
    score += 100;
  } else if (roleLower.includes(targetRoleLower) || targetRoleLower.includes(roleLower)) {
    score += 60;
  }

  // Token word match
  const roleWords = roleLower.split(/\W+/).filter((w) => w.length > 2);
  const targetWords = targetRoleLower.split(/\W+/).filter((w) => w.length > 2);
  let roleMatchCount = 0;
  for (const w of roleWords) {
    if (targetWords.includes(w)) {
      roleMatchCount++;
    }
  }
  score += roleMatchCount * 20;

  // 2. Current role / Recency
  if (exp.isCurrent) {
    score += 50; // Current role bonus (priority)
  }
  const date = exp.endDate || exp.startDate || new Date();
  const yearsAgo = (Date.now() - date.getTime()) / (1000 * 60 * 60 * 24 * 365.25);
  score += Math.max(0, 50 - yearsAgo * 5); // Recency bonus (decays by 5 points/year)

  // 3. Technology overlap
  let techOverlap = 0;
  for (const tech of exp.technologiesUsed) {
    const lowerTech = tech.toLowerCase();
    if (
      jdKeywords.some((kw) => kw.toLowerCase() === lowerTech) ||
      jdText.toLowerCase().includes(lowerTech)
    ) {
      techOverlap++;
    }
  }
  score += techOverlap * 15; // Technology overlap points

  // 4. JD keyword overlap (in description and achievements)
  let jdWordOverlap = 0;
  const contentText = `${exp.description || ''} ${exp.achievements.join(' ')}`.toLowerCase();
  for (const kw of jdKeywords) {
    if (contentText.includes(kw.toLowerCase())) {
      jdWordOverlap++;
    }
  }
  score += jdWordOverlap * 5; // General JD overlap points

  return score;
}

/**
 * Score a project entry based on relevance to the job description
 */
function calculateProjectScore(
  proj: ResumeContextProject,
  targetRole: string,
  jdKeywords: string[],
  jdText: string,
): number {
  let score = 0;

  // 1. User featured flag
  if (proj.featured) {
    score += 60; // Featured project priority
  }

  // 2. Role similarity (if project has a role associated)
  if (proj.role) {
    const roleLower = proj.role.toLowerCase();
    const targetRoleLower = targetRole.toLowerCase();
    if (roleLower === targetRoleLower) {
      score += 50;
    }
    const roleWords = roleLower.split(/\W+/).filter((w) => w.length > 2);
    const targetWords = targetRoleLower.split(/\W+/).filter((w) => w.length > 2);
    let roleMatchCount = 0;
    for (const w of roleWords) {
      if (targetWords.includes(w)) {
        roleMatchCount++;
      }
    }
    score += roleMatchCount * 15;
  }

  // 3. Technology overlap
  let techOverlap = 0;
  for (const tech of proj.stack) {
    const lowerTech = tech.toLowerCase();
    if (
      jdKeywords.some((kw) => kw.toLowerCase() === lowerTech) ||
      jdText.toLowerCase().includes(lowerTech)
    ) {
      techOverlap++;
    }
  }
  score += techOverlap * 15;

  // 4. JD keyword overlap (in description and achievements)
  let jdWordOverlap = 0;
  const contentText = `${proj.description || ''} ${proj.achievements.join(' ')}`.toLowerCase();
  for (const kw of jdKeywords) {
    if (contentText.includes(kw.toLowerCase())) {
      jdWordOverlap++;
    }
  }
  score += jdWordOverlap * 5;

  return score;
}

/**
 * Score a skill entry based on relevance to the job description
 */
function calculateSkillScore(
  skill: ResumeContextSkill,
  jdKeywords: string[],
  jdText: string,
): number {
  let score = 0;
  const lowerName = skill.name.toLowerCase();

  // 1. Direct match with JD keyword
  const isJdKeyword = jdKeywords.some((kw) => kw.toLowerCase() === lowerName);
  if (isJdKeyword) {
    score += 100;
  }

  // 2. Mentioned in JD text
  if (jdText.toLowerCase().includes(lowerName)) {
    score += 50;
  }

  // 3. Skill level bonus
  if (skill.level) {
    score += skill.level * 5;
  }

  return score;
}

/**
 * Score an achievement entry based on relevance to the job description
 */
function calculateAchievementScore(
  ach: ResumeContextAchievement,
  targetRole: string,
  jdKeywords: string[],
): number {
  let score = 0;
  const contentText = `${ach.title} ${ach.context || ''} ${ach.description || ''}`.toLowerCase();

  // 1. Overlap with target role
  const targetWords = targetRole
    .toLowerCase()
    .split(/\W+/)
    .filter((w) => w.length > 2);
  for (const w of targetWords) {
    if (contentText.includes(w)) {
      score += 20;
    }
  }

  // 2. JD keyword overlap
  for (const kw of jdKeywords) {
    if (contentText.includes(kw.toLowerCase())) {
      score += 15;
    }
  }

  return score;
}

/**
 * Score a certification based on relevance to the job description
 */
function calculateCertificateScore(
  cert: ResumeContextCertificate,
  targetRole: string,
  jdKeywords: string[],
): number {
  let score = 0;
  const contentText = `${cert.name} ${cert.issuer}`.toLowerCase();

  // 1. Overlap with target role
  const targetWords = targetRole
    .toLowerCase()
    .split(/\W+/)
    .filter((w) => w.length > 2);
  for (const w of targetWords) {
    if (contentText.includes(w)) {
      score += 30;
    }
  }

  // 2. JD keyword overlap
  for (const kw of jdKeywords) {
    if (contentText.includes(kw.toLowerCase())) {
      score += 20;
    }
  }

  return score;
}

/**
 * Score an education entry (prioritize recency and field relevance)
 */
function calculateEducationScore(
  edu: ResumeContextEducation,
  targetRole: string,
  jdKeywords: string[],
): number {
  let score = 0;

  // 1. Recency
  const date = edu.endDate || edu.startDate || new Date();
  const yearsAgo = (Date.now() - date.getTime()) / (1000 * 60 * 60 * 24 * 365.25);
  score += Math.max(0, 100 - yearsAgo * 5);

  // 2. Field overlap with target role / JD
  if (edu.field) {
    const fieldLower = edu.field.toLowerCase();
    const targetWords = targetRole
      .toLowerCase()
      .split(/\W+/)
      .filter((w) => w.length > 2);
    for (const w of targetWords) {
      if (fieldLower.includes(w)) {
        score += 40;
      }
    }
  }

  return score;
}

/**
 * Perform strict scoring, ranking, and selection rules on ResumeContext.
 * Restricts context to a tailored subset to guarantee a professional one-page resume.
 */
export function rankAndFilterResumeContext(context: ResumeContext): ResumeContext {
  const jdText = context.jobDescription?.raw || '';
  const targetRole = context.targetRole || '';
  const jdKeywords = [
    ...(context.jobDescription?.keywords || []),
    ...(context.extractedKeywords || []),
  ];

  console.log(`[Ranker] Tailoring ResumeContext for "${targetRole}" @ ${context.company.name}`);

  // 1. Filter Experience (Top 3-4 entries)
  const rankedExperiences = context.experiences
    .map((exp) => ({
      exp,
      score: calculateExperienceScore(exp, targetRole, jdKeywords, jdText),
    }))
    .sort((a, b) => b.score - a.score);

  console.log(`[Ranker] Scored ${context.experiences.length} experiences. Top selection:`);
  rankedExperiences.forEach((e, idx) =>
    console.log(
      `  - [Rank ${idx + 1}] Score: ${e.score.toFixed(1)} - ${e.exp.role} @ ${e.exp.companyName}`,
    ),
  );

  const selectedExperiences = rankedExperiences
    .slice(0, 4) // Max 4 experiences
    .map((e) => e.exp);

  // 2. Filter Projects (Top 2-3 entries)
  const rankedProjects = context.projects
    .map((proj) => ({
      proj,
      score: calculateProjectScore(proj, targetRole, jdKeywords, jdText),
    }))
    .sort((a, b) => b.score - a.score);

  console.log(`[Ranker] Scored ${context.projects.length} projects. Top selection:`);
  rankedProjects.forEach((p, idx) =>
    console.log(`  - [Rank ${idx + 1}] Score: ${p.score.toFixed(1)} - ${p.proj.name}`),
  );

  const selectedProjects = rankedProjects
    .slice(0, 3) // Max 3 projects
    .map((p) => p.proj);

  // 3. Filter Skills (Top 12-15 entries, prioritizing JD keywords)
  const rankedSkills = context.skills
    .map((skill) => ({
      skill,
      score: calculateSkillScore(skill, jdKeywords, jdText),
    }))
    .sort((a, b) => b.score - a.score);

  console.log(`[Ranker] Scored ${context.skills.length} skills. Top selection:`);
  rankedSkills
    .slice(0, 15)
    .forEach((s, idx) =>
      console.log(`  - [Rank ${idx + 1}] Score: ${s.score.toFixed(1)} - ${s.skill.name}`),
    );

  const selectedSkills = rankedSkills
    .slice(0, 15) // Max 15 skills
    .map((s) => s.skill);

  // 4. Filter Education (One entry, unless a second is highly relevant)
  const rankedEducations = context.educations
    .map((edu) => ({
      edu,
      score: calculateEducationScore(edu, targetRole, jdKeywords),
    }))
    .sort((a, b) => b.score - a.score);

  const selectedEducations: ResumeContextEducation[] = [];
  if (rankedEducations.length > 0) {
    // Add primary education (highest score/most recent)
    selectedEducations.push(rankedEducations[0].edu);

    // Add second education ONLY if it has direct field relevance (score > 110)
    if (rankedEducations.length > 1 && rankedEducations[1].score > 110) {
      selectedEducations.push(rankedEducations[1].edu);
    }
  }

  // 5. Filter Certificates (Include only if relevant to JD, score > 15)
  const selectedCertificates = context.certificates
    .map((cert) => ({
      cert,
      score: calculateCertificateScore(cert, targetRole, jdKeywords),
    }))
    .filter((c) => c.score > 15) // Strict relevance threshold
    .sort((a, b) => b.score - a.score)
    .map((c) => c.cert);

  // 6. Filter Achievements (Top 2-3 strongest entries)
  const selectedAchievements = context.achievements
    .map((ach) => ({
      ach,
      score: calculateAchievementScore(ach, targetRole, jdKeywords),
    }))
    .sort((a, b) => b.score - a.score)
    .slice(0, 3) // Max 3 achievements
    .map((a) => a.ach);

  return {
    ...context,
    experiences: selectedExperiences,
    projects: selectedProjects,
    skills: selectedSkills,
    educations: selectedEducations,
    certificates: selectedCertificates,
    achievements: selectedAchievements,
  };
}
