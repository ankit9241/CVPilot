import { GraphState } from '../../types';
import { experienceBulletsPrompt } from '../../prompts';
import { getLLMClient } from '../../llm/client';
import { parseJSON, retryWithBackoff } from '../../utils';

interface BulletsOutput {
  experiences: Record<string, string[]>;
}

export async function experienceBulletsNode(state: GraphState): Promise<Partial<GraphState>> {
  if (!state.resumeContext || !state.selectedExperiences) {
    throw new Error('ResumeContext and selected experiences are required');
  }

  const client = getLLMClient();

  const jobContext = `
Target Role: ${state.resumeContext.targetRole}
Company: ${state.resumeContext.company.name}
Job Keywords: ${state.resumeContext.extractedKeywords.join(', ')}
`;

  const experiencesText = state.selectedExperiences
    .map(
      (exp) =>
        `
Company: ${exp.companyName}
Role: ${exp.role}
Duration: ${exp.startDate || 'Unknown'} to ${exp.endDate || 'Present'}
Description: ${exp.description || 'No description provided'}
Skills Used: ${exp.bulletPoints.join(', ') || 'N/A'}
`,
    )
    .join('\n');

  const prompt = `${jobContext}\n\n${experiencesText}`;

  const response = await retryWithBackoff(async () => {
    return client.call([
      { role: 'system', content: experienceBulletsPrompt },
      {
        role: 'user',
        content: prompt,
      },
    ]);
  });

  const result = parseJSON<BulletsOutput>(response.content);

  // Merge bullets into selected experiences
  const updatedExperiences = state.selectedExperiences.map((exp) => {
    const key = `${exp.companyName}-${exp.role}`;
    return {
      ...exp,
      bulletPoints: result.experiences[key] || exp.bulletPoints || [],
    };
  });

  return {
    selectedExperiences: updatedExperiences,
    generatedExperienceBullets: result.experiences,
  };
}
