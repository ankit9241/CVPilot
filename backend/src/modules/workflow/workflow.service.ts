import { BaseService } from '../../common/base.service';
import { dummyWorkflowLogs, dummyWorkflowRuns } from '../../constants/dummy-data';
import { workflowRepository, WorkflowRepository } from './workflow.repository';

export class WorkflowService extends BaseService {
  constructor(protected readonly repository: WorkflowRepository = workflowRepository) {
    super();
  }

  list = () => dummyWorkflowRuns;
  get = (id: string) => dummyWorkflowRuns.find((r) => r.id === id) ?? dummyWorkflowRuns[0];
  logs = (runId: string) => dummyWorkflowLogs.filter((l) => l.runId === runId);
  start = (data: Record<string, unknown>) => ({
    ...dummyWorkflowRuns[0],
    id: `wf-${Date.now()}`,
    status: 'PENDING',
    progress: 0,
    currentStep: 'Master Profile',
    startedAt: new Date().toISOString(),
    ...data,
  });
  cancel = (_id: string) => ({ success: true });
}

export const workflowService = new WorkflowService();
