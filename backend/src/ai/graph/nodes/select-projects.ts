import { GraphState, GeneratedProject } from '../../types';
import { selectProjectsPrompt } from '../../prompts';
import { getLLMClient } from '../../llm/client';
import { parseJSON, retryWithBackoff, validateProject } from '../../utils';

interface SelectionOutput {
  selectedCount: number;
  selections: Array<GeneratedProject & { relevanceScore: number; rationale: string }>;
  summary: string;
}

export async function selectProjectsNode(state: GraphState): Promise<Partial<GraphState>> {
  if (!state.resumeContext || !state.resumeContext.projects) {
    throw new Error('ResumeContext with projects is required');
  }

  const client = getLLMClient();

  const projectsText = state.resumeContext.projects
    .map(
      (proj) =>
        `Name: ${proj.name}\nRole: ${proj.role || 'N/A'}\nDescription: ${proj.description || 'N/A'}\nTech Stack: ${proj.stack.join(', ')}\nFeatured: ${proj.featured}\nImpact: ${proj.impact || 'N/A'}`,
    )
    .join('\n\n');

  const jobContext = `Target Role: ${state.resumeContext.targetRole}\nCompany: ${state.resumeContext.company.name}\nJob Keywords: ${state.resumeContext.extractedKeywords.join(', ')}`;

  const prompt = `${selectProjectsPrompt}\n\nContext:\n${jobContext}\n\nProjects to evaluate:\n${projectsText}`;

  const response = await retryWithBackoff(async () => {
    return client.call([
      { role: 'system', content: selectProjectsPrompt },
      {
        role: 'user',
        content: prompt,
      },
    ]);
  });

  const selection = parseJSON<SelectionOutput>(response.content);

  // Validate each selected project
  selection.selections.forEach((proj) => {
    const validation = validateProject(proj);
    validation.throw();
  });

  const selectedProjects: GeneratedProject[] = selection.selections.map((s) => ({
    name: s.name,
    description: s.description,
    role: s.role,
    technologies: s.technologies,
    bulletPoints: s.bulletPoints || [],
    impact: s.impact,
  }));

  return {
    selectedProjects,
    metadata: {
      ...state.metadata,
      selectionRationale: selection.summary,
    },
  };
}
