import { GraphState, GeneratedSkill } from '../../types';
import { selectSkillsPrompt } from '../../prompts';
import { getLLMClient } from '../../llm/client';
import { parseJSON, retryWithBackoff, validateSkill } from '../../utils';

interface SelectionOutput {
  selectedCount: number;
  selections: Array<GeneratedSkill & { relevanceScore: number; rationale: string }>;
  summary: string;
  keyMatches: string[];
}

export async function selectSkillsNode(state: GraphState): Promise<Partial<GraphState>> {
  if (!state.resumeContext || !state.resumeContext.skills) {
    throw new Error('ResumeContext with skills is required');
  }

  const client = getLLMClient();

  const skillsText = state.resumeContext.skills
    .map((skill) => `${skill.name} (${skill.category}, Level: ${skill.level || 'N/A'})`)
    .join('\n');

  const jobContext = `Target Role: ${state.resumeContext.targetRole}\nCompany: ${state.resumeContext.company.name}\nJob Keywords: ${state.resumeContext.extractedKeywords.join(', ')}`;

  const prompt = `${selectSkillsPrompt}\n\nContext:\n${jobContext}\n\nSkills to evaluate:\n${skillsText}`;

  const response = await retryWithBackoff(async () => {
    return client.call([
      { role: 'system', content: selectSkillsPrompt },
      {
        role: 'user',
        content: prompt,
      },
    ], { json: true });
  });

  const selection = parseJSON<SelectionOutput>(response.content);

  // Validate each selected skill
  selection.selections.forEach((skill) => {
    const validation = validateSkill(skill);
    validation.throw();
  });

  const selectedSkills: GeneratedSkill[] = selection.selections.map((s) => ({
    name: s.name,
    category: s.category,
    level: s.level,
  }));

  return {
    selectedSkills,
    metadata: {
      ...state.metadata,
      keywordMatches: selection.keyMatches,
    },
  };
}
