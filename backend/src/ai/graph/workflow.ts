import { ResumeContext } from '../../modules/workflow';
import { GraphState, GeneratedResume } from '../types';
import {
  validateContextNode,
  analyzeJobNode,
  selectExperiencesNode,
  selectProjectsNode,
  selectSkillsNode,
  generateSummaryNode,
  experienceBulletsNode,
  projectBulletsNode,
  generateResumeJsonNode,
} from './nodes';

type NodeFunction = (state: GraphState) => Promise<Partial<GraphState>>;

interface WorkflowNode {
  name: string;
  fn: NodeFunction;
}

export class ResumeGenerationGraph {
  private nodes: WorkflowNode[] = [
    { name: 'validate-context', fn: validateContextNode },
    { name: 'analyze-job', fn: analyzeJobNode },
    { name: 'select-experiences', fn: selectExperiencesNode },
    { name: 'select-projects', fn: selectProjectsNode },
    { name: 'select-skills', fn: selectSkillsNode },
    { name: 'generate-summary', fn: generateSummaryNode },
    { name: 'experience-bullets', fn: experienceBulletsNode },
    { name: 'project-bullets', fn: projectBulletsNode },
    { name: 'generate-resume-json', fn: generateResumeJsonNode },
  ];

  async execute(resumeContext: ResumeContext): Promise<GeneratedResume> {
    // Initialize state
    const state: GraphState = {
      resumeContext,
      currentResume: null,
      selectedExperiences: null,
      selectedProjects: null,
      selectedSkills: null,
      generatedSummary: null,
      generatedExperienceBullets: null,
      generatedProjectBullets: null,
      generatedResumeJson: null,
      metadata: {
        targetRole: resumeContext.targetRole,
        companyName: resumeContext.company.name,
        generationSessionId: resumeContext.generationSessionId,
        keywordMatches: resumeContext.extractedKeywords,
        selectionRationale: '',
        errors: [],
        timestamp: new Date().toISOString(),
      },
    };

    // Execute nodes sequentially
    for (const node of this.nodes) {
      try {
        const nodeResult = await node.fn(state);
        Object.assign(state, nodeResult);
      } catch (error) {
        const errorMsg = error instanceof Error ? error.message : String(error);
        state.metadata.errors.push(`[${node.name}] ${errorMsg}`);
        throw new Error(`Node '${node.name}' failed: ${errorMsg}`);
      }
    }

    // Ensure we have a generated resume
    if (!state.generatedResumeJson) {
      throw new Error('Resume generation failed: No output generated');
    }

    return state.generatedResumeJson;
  }

  getNodeNames(): string[] {
    return this.nodes.map((n) => n.name);
  }
}

export const resumeGenerationGraph = new ResumeGenerationGraph();
