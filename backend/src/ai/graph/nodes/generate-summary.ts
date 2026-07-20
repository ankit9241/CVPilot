import { GraphState } from '../../types';
import { summaryPrompt } from '../../prompts';
import { getLLMClient } from '../../llm/client';
import { parseJSON, retryWithBackoff } from '../../utils';

interface SummaryOutput {
  summary: string;
  keywords: string[];
  rationale: string;
}

export async function generateSummaryNode(state: GraphState): Promise<Partial<GraphState>> {
  if (!state.resumeContext || !state.selectedExperiences || !state.selectedSkills) {
    throw new Error('ResumeContext, selected experiences, and skills are required');
  }

  const client = getLLMClient();

  const experienceYears =
    state.resumeContext.experiences.length > 0
      ? Math.round(
          (Date.now() -
            Math.min(
              ...state.resumeContext.experiences
                .filter((e) => e.startDate)
                .map((e) => e.startDate!.getTime()),
            )) /
            (1000 * 60 * 60 * 24 * 365),
        )
      : 0;

  const context = `
Target Role: ${state.resumeContext.targetRole}
Company: ${state.resumeContext.company.name}
Years of Experience: ${experienceYears}
Top Skills: ${state.selectedSkills.map((s) => s.name).join(', ')}
Recent Roles: ${state.selectedExperiences.map((e) => e.role).join(', ')}
Key Keywords: ${state.resumeContext.extractedKeywords.slice(0, 10).join(', ')}
`;

  const response = await retryWithBackoff(async () => {
    return client.call([
      { role: 'system', content: summaryPrompt },
      {
        role: 'user',
        content: context,
      },
    ]);
  });

  const result = parseJSON<SummaryOutput>(response.content);

  if (!result.summary || result.summary.trim().length < 20) {
    throw new Error('Generated summary is too short');
  }

  return {
    generatedSummary: result.summary,
    metadata: {
      ...state.metadata,
      errors: [],
    },
  };
}
