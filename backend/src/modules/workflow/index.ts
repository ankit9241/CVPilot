// Generation Session types and services
export {
  ResumeContext,
  ResumeContextPersonal,
  ResumeContextExperience,
  ResumeContextProject,
  ResumeContextSkill,
  ResumeContextEducation,
  ResumeContextCertificate,
  ResumeContextAchievement,
  ParsedJobDescription,
  WorkflowStepResult,
  WorkflowExecutionContext,
} from './generation-session.types';

export { GenerationSessionService, generationSessionService } from './generation-session.service';
export {
  GenerationSessionRepository,
  WorkflowLogRepository,
  AIMessageRepository,
  generationSessionRepository,
  workflowLogRepository,
  aiMessageRepository,
} from './generation-session.repository';

// Legacy workflow types (deprecated - use generation-session types)
export type { WorkflowLogDomain, AIMessageDomain } from './workflow.types';
export type { TriggerWorkflowDto, GenerationSessionInitInput } from './workflow.dto';
