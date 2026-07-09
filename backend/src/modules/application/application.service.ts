import { BaseService } from '../../common/base.service';
import { dummyApplicationStages, dummyApplications } from '../../constants/dummy-data';
import { applicationRepository, ApplicationRepository } from './application.repository';

const KANBAN_STATUSES = ['SAVED', 'APPLIED', 'INTERVIEW', 'OFFER', 'REJECTED', 'WITHDRAWN'] as const;

export class ApplicationService extends BaseService {
  constructor(protected readonly repository: ApplicationRepository = applicationRepository) {
    super();
  }

  list = () => dummyApplications;
  board = () =>
    KANBAN_STATUSES.map((status) => ({
      status,
      items: dummyApplications.filter((a) => a.status === status),
    }));
  get = (id: string) => dummyApplications.find((a) => a.id === id) ?? dummyApplications[0];
  create = (data: Record<string, unknown>) => ({
    ...dummyApplications[0],
    id: `app-${Date.now()}`,
    status: 'SAVED',
    ...data,
  });
  update = (id: string, data: Record<string, unknown>) => ({ ...dummyApplications[0], id, ...data });
  updateStatus = (id: string, status: string, note?: string) => ({
    ...dummyApplications[0],
    id,
    status,
    lastStageNote: note,
  });
  remove = (_id: string) => ({ success: true });
  stages = (applicationId: string) =>
    dummyApplicationStages.filter((s) => s.applicationId === applicationId);
}

export const applicationService = new ApplicationService();
