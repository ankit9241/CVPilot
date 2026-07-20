import { GraphState } from '../../types';
import { analyzeJobDescriptionPrompt } from '../../prompts';
import { getLLMClient } from '../../llm/client';
import { parseJSON, retryWithBackoff } from '../../utils';

interface JobAnalysis {
  hardSkills: string[];
  softSkills: string[];
  experienceYears: number;
  keyResponsibilities: string[];
  mustHave: string[];
  niceToHave: string[];
  roleLevel: 'junior' | 'mid' | 'senior' | 'lead';
  summary: string;
}

export async function analyzeJobNode(state: GraphState): Promise<Partial<GraphState>> {
  if (!state.resumeContext) {
    throw new Error('ResumeContext is required');
  }

  const client = getLLMClient();
  const jobDesc = state.resumeContext.jobDescription;

  const jobText = [
    `Title: ${state.resumeContext.targetRole}`,
    `Company: ${state.resumeContext.company.name}`,
    ``,
    `Description:`,
    jobDesc.raw,
  ].join('\n');

  const response = await retryWithBackoff(async () => {
    return client.call([
      { role: 'system', content: analyzeJobDescriptionPrompt },
      {
        role: 'user',
        content: `Analyze this job description:\n\n${jobText}`,
      },
    ]);
  });

  const analysis = parseJSON<JobAnalysis>(response.content);

  // Store analysis in metadata for later use by selection nodes
  return {
    metadata: {
      ...state.metadata,
      errors: [],
    },
  };
}
