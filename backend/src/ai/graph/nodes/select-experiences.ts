import { GraphState, GeneratedExperience } from '../../types';
import { selectExperiencesPrompt } from '../../prompts';
import { getLLMClient } from '../../llm/client';
import { parseJSON, retryWithBackoff, validateExperience } from '../../utils';

interface SelectionOutput {
  selectedCount: number;
  selections: Array<GeneratedExperience & { relevanceScore: number; rationale: string }>;
  summary: string;
}

export async function selectExperiencesNode(state: GraphState): Promise<Partial<GraphState>> {
  if (!state.resumeContext || !state.resumeContext.experiences) {
    throw new Error('ResumeContext with experiences is required');
  }

  const client = getLLMClient();

  const experiencesText = state.resumeContext.experiences
    .map(
      (exp) =>
        `Company: ${exp.companyName}\nRole: ${exp.role}\nDuration: ${exp.startDate?.toISOString().split('T')[0] || 'Unknown'} - ${exp.endDate?.toISOString().split('T')[0] || 'Present'}\nDescription: ${exp.description || 'N/A'}\nSkills: ${exp.technologiesUsed.join(', ')}\nAchievements: ${exp.achievements.join(', ')}`,
    )
    .join('\n\n');

  const jobContext = `Target Role: ${state.resumeContext.targetRole}\nCompany: ${state.resumeContext.company.name}\nJob Keywords: ${state.resumeContext.extractedKeywords.join(', ')}`;

  const prompt = `${selectExperiencesPrompt}\n\nContext:\n${jobContext}\n\nExperiences to evaluate:\n${experiencesText}`;

  const response = await retryWithBackoff(async () => {
    return client.call([
      { role: 'system', content: selectExperiencesPrompt },
      {
        role: 'user',
        content: prompt,
      },
    ]);
  });

  const selection = parseJSON<SelectionOutput>(response.content);

  // Validate each selected experience
  selection.selections.forEach((exp) => {
    const validation = validateExperience(exp);
    validation.throw();
  });

  const selectedExperiences: GeneratedExperience[] = selection.selections.map((s) => ({
    companyName: s.companyName,
    role: s.role,
    location: s.location,
    startDate: s.startDate,
    endDate: s.endDate,
    isCurrent: s.isCurrent,
    description: s.description,
    bulletPoints: s.bulletPoints || [],
  }));

  return {
    selectedExperiences,
    metadata: {
      ...state.metadata,
      selectionRationale: selection.summary,
    },
  };
}
