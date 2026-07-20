import { GraphState } from '../../types';
import { validateContextPrompt } from '../../prompts';
import { getLLMClient } from '../../llm/client';
import { parseJSON, retryWithBackoff } from '../../utils';

interface ValidationOutput {
  isValid: boolean;
  missingFields: string[];
  warnings: string[];
  errors: string[];
  readiness: number;
}

export async function validateContextNode(state: GraphState): Promise<Partial<GraphState>> {
  if (!state.resumeContext) {
    throw new Error('ResumeContext is required');
  }

  const client = getLLMClient();

  const contextSummary = JSON.stringify(
    {
      fullName: state.resumeContext.personalInfo.fullName,
      headline: state.resumeContext.personalInfo.headline,
      professionalSummary: state.resumeContext.professionalSummary,
      experienceCount: state.resumeContext.experiences.length,
      projectCount: state.resumeContext.projects.length,
      skillCount: state.resumeContext.skills.length,
      educationCount: state.resumeContext.educations.length,
      targetRole: state.resumeContext.targetRole,
      companyName: state.resumeContext.company.name,
      jobDescriptionLength: state.resumeContext.jobDescription.raw.length,
    },
    null,
    2,
  );

  const response = await retryWithBackoff(async () => {
    return client.call([
      { role: 'system', content: validateContextPrompt },
      {
        role: 'user',
        content: `Validate this ResumeContext:\n\n${contextSummary}`,
      },
    ]);
  });

  const validation = parseJSON<ValidationOutput>(response.content);

  if (!validation.isValid) {
    const errorMsg = [
      'ResumeContext validation failed:',
      ...validation.errors,
      'Missing fields:',
      ...validation.missingFields,
    ].join('\n');

    throw new Error(errorMsg);
  }

  return {
    metadata: {
      ...state.metadata,
      errors: validation.warnings,
    },
  };
}
