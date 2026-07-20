import { GraphState } from '../../types';
import { combinedRewritePrompt } from '../../prompts';
import { getLLMClient } from '../../llm/client';
import { parseJSON, retryWithBackoff } from '../../utils';

interface CombinedRewriteOutput {
  summary: { summary: string; keywords: string[]; rationale: string };
  experienceBullets: { experiences: Record<string, string[]> };
  projectBullets: { projects: Record<string, string[]> };
}

/**
 * Development-mode node: merges generate-summary, experience-bullets, and
 * project-bullets into a single LLM call.
 */
export async function combinedRewriteNode(state: GraphState): Promise<Partial<GraphState>> {
  if (
    !state.resumeContext ||
    !state.selectedExperiences ||
    !state.selectedProjects ||
    !state.selectedSkills
  ) {
    throw new Error('ResumeContext, selected experiences, projects, and skills are required');
  }

  const client = getLLMClient();
  const ctx = state.resumeContext;

  const experienceYears =
    ctx.experiences.length > 0
      ? Math.round(
          (Date.now() -
            Math.min(
              ...ctx.experiences.filter((e) => e.startDate).map((e) => e.startDate!.getTime()),
            )) /
            (1000 * 60 * 60 * 24 * 365),
        )
      : 0;

  const summaryContext = `
Target Role: ${ctx.targetRole}
Company: ${ctx.company.name}
Years of Experience: ${experienceYears}
Top Skills: ${state.selectedSkills.map((s) => s.name).join(', ')}
Recent Roles: ${state.selectedExperiences.map((e) => e.role).join(', ')}
Key Keywords: ${ctx.extractedKeywords.slice(0, 10).join(', ')}
`;

  const jobContext = `
Target Role: ${ctx.targetRole}
Company: ${ctx.company.name}
Job Keywords: ${ctx.extractedKeywords.join(', ')}
`;

  const experiencesText = state.selectedExperiences
    .map(
      (exp) =>
        `${exp.role} @ ${exp.companyName} (${exp.startDate || '?'} - ${exp.endDate || 'Present'}): ${(exp.description || '').slice(0, 120)}`,
    )
    .join('\n');

  const projectsText = state.selectedProjects
    .map(
      (proj) =>
        `${proj.name}: ${(proj.description || '').slice(0, 120)} | Tech: ${proj.technologies.slice(0, 6).join(', ')} | Impact: ${(proj.impact || '').slice(0, 80)}`,
    )
    .join('\n');

  const userContent = `Target Role: ${ctx.targetRole} @ ${ctx.company.name}\nYears Experience: ${experienceYears}\nKeywords: ${ctx.extractedKeywords.slice(0, 12).join(', ')}\nTop Skills: ${state.selectedSkills.map((s) => s.name).join(', ')}\n\n=== Experiences ===\n${experiencesText}\n\n=== Projects ===\n${projectsText}`;

  const response = await retryWithBackoff(async () => {
    return client.call([
      { role: 'system', content: combinedRewritePrompt },
      { role: 'user', content: userContent },
    ], { json: true });
  });

  console.log(`[combined-rewrite] Input: ${response.usage.inputTokens} tokens | Output: ${response.usage.outputTokens} tokens | Stop: ${response.stopReason}`);

  // If model hit token limit, the JSON will be truncated and unparseable.
  if (response.stopReason === 'length') {
    throw new Error(
      `LLM output was truncated (finish_reason=length) in combinedRewriteNode. ` +
      `Output tokens used: ${response.usage.outputTokens}. Consider switching to a model with higher output limits.`,
    );
  }

  const result = parseJSON<CombinedRewriteOutput>(response.content);

  if (!result.summary.summary || result.summary.summary.trim().length < 20) {
    throw new Error('Generated summary is too short');
  }

  const updatedExperiences = state.selectedExperiences.map((exp) => {
    const key = `${exp.companyName}-${exp.role}`;
    return {
      ...exp,
      bulletPoints: result.experienceBullets.experiences[key] || exp.bulletPoints || [],
    };
  });

  const updatedProjects = state.selectedProjects.map((proj) => ({
    ...proj,
    bulletPoints: result.projectBullets.projects[proj.name] || proj.bulletPoints || [],
  }));

  return {
    generatedSummary: result.summary.summary,
    selectedExperiences: updatedExperiences,
    selectedProjects: updatedProjects,
    generatedExperienceBullets: result.experienceBullets.experiences,
    generatedProjectBullets: result.projectBullets.projects,
    metadata: {
      ...state.metadata,
      errors: [],
    },
  };
}
