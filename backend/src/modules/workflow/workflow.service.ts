import { BaseService } from '../../common/base.service';
import { workflowRepository, WorkflowRepository } from './workflow.repository';

// Legacy service - kept for backward compatibility. Use GenerationSessionService for new code.
export class WorkflowService extends BaseService {
  constructor(protected readonly repository: WorkflowRepository = workflowRepository) {
    super();
  }
}

export const workflowService = new WorkflowService();
