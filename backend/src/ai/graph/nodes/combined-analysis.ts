import { GraphState, GeneratedExperience, GeneratedProject, GeneratedSkill } from '../../types';
import { combinedAnalysisPrompt } from '../../prompts';
import { getLLMClient } from '../../llm/client';
import {
  parseJSON,
  retryWithBackoff,
  validateExperience,
  validateProject,
  validateSkill,
} from '../../utils';

interface CombinedAnalysisOutput {
  validation: {
    isValid: boolean;
    missingFields: string[];
    warnings: string[];
    errors: string[];
    readiness: number;
  };
  jobAnalysis: {
    hardSkills: string[];
    softSkills: string[];
    experienceYears: number;
    keyResponsibilities: string[];
    mustHave: string[];
    niceToHave: string[];
    roleLevel: 'junior' | 'mid' | 'senior' | 'lead';
    summary: string;
  };
  experiences: string[]; // array of selected experience IDs
  projects: string[]; // array of selected project IDs
  skills: string[]; // array of selected skill IDs
  selectionRationale: string;
  keywordMatches: string[];
}

/**
 * Development-mode node: merges validate-context, analyze-job, select-experiences,
 * select-projects, and select-skills into a single LLM call. Behaves identically
 * to the production nodes it replaces (same validation, same state fields).
 */
export async function combinedAnalysisNode(state: GraphState): Promise<Partial<GraphState>> {
  if (!state.resumeContext) {
    throw new Error('ResumeContext is required');
  }

  const client = getLLMClient();
  const ctx = state.resumeContext;

  const contextSummary = JSON.stringify(
    {
      fullName: ctx.personalInfo.fullName,
      headline: ctx.personalInfo.headline,
      professionalSummary: ctx.professionalSummary,
      experienceCount: ctx.experiences.length,
      projectCount: ctx.projects.length,
      skillCount: ctx.skills.length,
      educationCount: ctx.educations.length,
      targetRole: ctx.targetRole,
      companyName: ctx.company.name,
      jobDescriptionLength: ctx.jobDescription.raw.length,
    },
    null,
    2,
  );

  const jobText = [
    `Title: ${ctx.targetRole}`,
    `Company: ${ctx.company.name}`,
    ``,
    `Description:`,
    ctx.jobDescription.raw,
  ].join('\n');

  // Keep descriptions brief to stay within free-tier output token limits.
  // Full content is re-fetched by ID after selection, so we only need enough to make a good choice.
  const experiencesText = ctx.experiences
    .map(
      (exp) =>
        `[ID: ${exp.id}] ${exp.role} @ ${exp.companyName} (${exp.startDate?.getFullYear() || '?'}-${exp.endDate?.getFullYear() || 'now'}) | Stack: ${exp.technologiesUsed.slice(0, 6).join(', ')}`,
    )
    .join('\n');

  const projectsText = ctx.projects
    .map(
      (proj) =>
        `[ID: ${proj.id}] ${proj.name} | Stack: ${proj.stack.slice(0, 6).join(', ')} | Impact: ${(proj.impact || '').slice(0, 80)}`,
    )
    .join('\n');

  const skillsText = ctx.skills
    .map((skill) => `[ID: ${skill.id}] ${skill.name} (${skill.category})`)
    .join(', ');

  const userContent = `=== Profile Summary ===\n${contextSummary}\n\n=== Job Description ===\n${jobText}\n\n=== Experiences (select IDs) ===\n${experiencesText}\n\n=== Projects (select IDs) ===\n${projectsText}\n\n=== Skills (select IDs) ===\n${skillsText}`;

  const response = await retryWithBackoff(async () => {
    return client.call([
      { role: 'system', content: combinedAnalysisPrompt },
      { role: 'user', content: userContent },
    ], { json: true });
  });

  console.log('--- RAW LLM RESPONSE ---');
  console.log(`[Usage] Input: ${response.usage.inputTokens} tokens | Output: ${response.usage.outputTokens} tokens | Stop: ${response.stopReason}`);
  console.log(response.content);
  console.log('------------------------');

  // If model hit token limit, the JSON is truncated and unparseable.
  if (response.stopReason === 'length') {
    throw new Error(
      `LLM output was truncated (finish_reason=length). The model hit its output token limit. ` +
      `Output tokens used: ${response.usage.outputTokens}. Consider switching to a model with higher output limits.`,
    );
  }

  const result = parseJSON<CombinedAnalysisOutput>(response.content);

  if (!result.validation.isValid) {
    const errorMsg = [
      'ResumeContext validation failed:',
      ...result.validation.errors,
      'Missing fields:',
      ...result.validation.missingFields,
    ].join('\n');
    throw new Error(errorMsg);
  }

  const selectedExperiences: GeneratedExperience[] = [];
  result.experiences.forEach((id) => {
    const original = ctx.experiences.find((e) => e.id === id);
    if (original) {
      const expItem = {
        companyName: original.companyName,
        role: original.role,
        location: original.location || '',
        startDate: original.startDate ? original.startDate.toISOString().split('T')[0] : '',
        endDate: original.endDate ? original.endDate.toISOString().split('T')[0] : undefined,
        isCurrent: original.isCurrent,
        description: original.description || '',
        bulletPoints: original.achievements || [],
      };
      validateExperience(expItem).throw();
      selectedExperiences.push(expItem);
    }
  });

  const selectedProjects: GeneratedProject[] = [];
  result.projects.forEach((id) => {
    const original = ctx.projects.find((p) => p.id === id);
    if (original) {
      const projItem = {
        name: original.name,
        description: original.description || '',
        role: original.role || '',
        technologies: original.stack || [],
        bulletPoints: original.achievements || [],
        impact: original.impact || '',
      };
      validateProject(projItem).throw();
      selectedProjects.push(projItem);
    }
  });

  const selectedSkills: GeneratedSkill[] = [];
  result.skills.forEach((id) => {
    const original = ctx.skills.find((sk) => sk.id === id);
    if (original) {
      const skillItem = {
        name: original.name,
        category: original.category,
        level: original.level || 3,
      };
      validateSkill(skillItem).throw();
      selectedSkills.push(skillItem);
    }
  });

  return {
    selectedExperiences,
    selectedProjects,
    selectedSkills,
    metadata: {
      ...state.metadata,
      errors: result.validation.warnings,
      selectionRationale: result.selectionRationale,
      keywordMatches: result.keywordMatches,
    },
  };
}
