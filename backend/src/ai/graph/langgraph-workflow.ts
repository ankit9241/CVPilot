import { StateGraph, Annotation } from '@langchain/langgraph';
import { GraphState, GeneratedResume } from '../types';
import { env } from '../../config/env';
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

/**
 * Create the LangGraph StateGraph for resume generation
 * Using Annotation API for type safety
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function createResumeGraph(): any {
  // Define the state annotation - tells LangGraph how to merge state updates
  const GraphStateAnnotation = Annotation.Root({
    resumeContext: Annotation<GraphState['resumeContext']>({
      reducer: (current, update) => update ?? current,
    }),
    currentResume: Annotation<GraphState['currentResume']>({
      reducer: (current, update) => update ?? current,
    }),
    selectedExperiences: Annotation<GraphState['selectedExperiences']>({
      reducer: (current, update) => update ?? current,
    }),
    selectedProjects: Annotation<GraphState['selectedProjects']>({
      reducer: (current, update) => update ?? current,
    }),
    selectedSkills: Annotation<GraphState['selectedSkills']>({
      reducer: (current, update) => update ?? current,
    }),
    generatedSummary: Annotation<GraphState['generatedSummary']>({
      reducer: (current, update) => update ?? current,
    }),
    generatedExperienceBullets: Annotation<GraphState['generatedExperienceBullets']>({
      reducer: (current, update) => update ?? current,
    }),
    generatedProjectBullets: Annotation<GraphState['generatedProjectBullets']>({
      reducer: (current, update) => update ?? current,
    }),
    generatedResumeJson: Annotation<GraphState['generatedResumeJson']>({
      reducer: (current, update) => update ?? current,
    }),
    metadata: Annotation<GraphState['metadata']>({
      reducer: (current, update) => ({
        ...current,
        ...update,
      }),
    }),
  });

  // Create the state graph
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const workflow: any = new StateGraph(GraphStateAnnotation);



  // Add nodes (all existing nodes work with LangGraph)
  workflow.addNode('validate-context', validateContextNode);
  workflow.addNode('analyze-job', analyzeJobNode);
  workflow.addNode('select-experiences', selectExperiencesNode);
  workflow.addNode('select-projects', selectProjectsNode);
  workflow.addNode('select-skills', selectSkillsNode);
  workflow.addNode('generate-summary', generateSummaryNode);
  workflow.addNode('experience-bullets', experienceBulletsNode);
  workflow.addNode('project-bullets', projectBulletsNode);
  workflow.addNode('generate-resume-json', generateResumeJsonNode);

  // Set entry point
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (workflow as any).setEntryPoint('validate-context');

  // Add edges - linear workflow with parallel selection
  workflow.addEdge('validate-context', 'analyze-job');

  // Parallel selection: all three selection nodes can run after analyze-job
  workflow.addEdge('analyze-job', 'select-experiences');
  workflow.addEdge('analyze-job', 'select-projects');
  workflow.addEdge('analyze-job', 'select-skills');

  // Converge back after parallel section
  workflow.addEdge('select-experiences', 'generate-summary');
  workflow.addEdge('select-projects', 'generate-summary');
  workflow.addEdge('select-skills', 'generate-summary');

  // Continue linear workflow
  workflow.addEdge('generate-summary', 'experience-bullets');
  workflow.addEdge('experience-bullets', 'project-bullets');
  workflow.addEdge('project-bullets', 'generate-resume-json');

  // Set finish point
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (workflow as any).setFinishPoint('generate-resume-json');

  // Compile the graph
  return workflow.compile();
}

/**
 * Resume Generation Graph using official LangGraph
 * Wraps compiled LangGraph with proper typing
 */
export class LangGraphResumeGenerationGraph {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private graph: any;

  constructor() {
    this.graph = createResumeGraph();
  }

  /**
   * Execute the resume generation workflow
   */
  async execute(resumeContext: ResumeContext): Promise<GeneratedResume> {
    // Initialize input state
    const inputState: GraphState = {
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

    // Execute the graph
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const result = await this.graph.invoke(inputState as any);

      if (!result.generatedResumeJson) {
        throw new Error('Resume generation failed: No output generated');
      }

      return result.generatedResumeJson;
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : String(error);
      throw new Error(`Resume generation failed: ${errorMsg}`);
    }
  }

  /**
   * Stream execution results (for real-time updates)
   */
  async *stream(resumeContext: ResumeContext) {
    const inputState: GraphState = {
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

    // Stream results as they complete
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    for await (const event of await this.graph.streamEvents(inputState as any, { version: 'v2' })) {
      yield event;
    }
  }

  /**
   * Get the graph structure for visualization
   */
  getGraphStructure() {
    // LangGraph provides built-in serialization
    return this.graph.getGraph();
  }

  /**
   * Get node names in execution order
   */
  getNodeNames(): string[] {
    return [
      'validate-context',
      'analyze-job',
      'select-experiences',
      'select-projects',
      'select-skills',
      'generate-summary',
      'experience-bullets',
      'project-bullets',
      'generate-resume-json',
    ];
  }
}

// Import ResumeContext type
import { ResumeContext } from '../../modules/workflow';

// Create singleton instance
export const langGraphResumeGenerationGraph = new LangGraphResumeGenerationGraph();
