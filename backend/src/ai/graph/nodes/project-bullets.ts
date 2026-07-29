import { GraphState } from '../../types';
import { projectBulletsPrompt } from '../../prompts';
import { getLLMClient } from '../../llm/client';
import { parseJSON, retryWithBackoff } from '../../utils';

interface BulletsOutput {
  projects: Record<string, string[]>;
}

export async function projectBulletsNode(state: GraphState): Promise<Partial<GraphState>> {
  if (!state.resumeContext || !state.selectedProjects) {
    throw new Error('ResumeContext and selected projects are required');
  }

  const client = getLLMClient();

  const jobContext = `
Target Role: ${state.resumeContext.targetRole}
Company: ${state.resumeContext.company.name}
Job Keywords: ${state.resumeContext.extractedKeywords.join(', ')}
`;

  const projectsText = state.selectedProjects
    .map(
      (proj) =>
        `
Project: ${proj.name}
Role: ${proj.role || 'N/A'}
Description: ${proj.description || 'No description'}
Technologies: ${proj.technologies.join(', ')}
Impact: ${proj.impact || 'Not specified'}
`,
    )
    .join('\n');

  const prompt = `${jobContext}\n\n${projectsText}`;

  const response = await retryWithBackoff(async () => {
    return client.call([
      { role: 'system', content: projectBulletsPrompt },
      {
        role: 'user',
        content: prompt,
      },
    ], { json: true });
  });

  const result = parseJSON<BulletsOutput>(response.content);

  // Merge bullets into selected projects
  const updatedProjects = state.selectedProjects.map((proj) => ({
    ...proj,
    bulletPoints: result.projects[proj.name] || proj.bulletPoints || [],
  }));

  return {
    selectedProjects: updatedProjects,
    generatedProjectBullets: result.projects,
  };
}
