import { BaseService } from '../../common/base.service';
import {
  dummyAtsReport,
  dummyResumeVersions,
  dummyResumes,
} from '../../constants/dummy-data';
import { NotFoundError } from '../../utils/errors';
import { resumeRepository, ResumeRepository } from './resume.repository';

export class ResumeService extends BaseService {
  constructor(protected readonly repository: ResumeRepository = resumeRepository) {
    super();
  }

  list = () => dummyResumes;

  get = (id: string) => {
    const r = dummyResumes.find((x) => x.id === id) ?? dummyResumes[0];
    if (!r) throw new NotFoundError('Resume not found');
    return r;
  };

  create = (data: Record<string, unknown>) => ({
    ...dummyResumes[0],
    id: `res-${Date.now()}`,
    status: 'DRAFT',
    atsScore: 0,
    latestVersion: 1,
    ...data,
  });

  update = (id: string, data: Record<string, unknown>) => ({ ...dummyResumes[0], id, ...data });

  remove = (_id: string) => ({ success: true });

  versions = (resumeId: string) => dummyResumeVersions.filter((v) => v.resumeId === resumeId);

  createVersion = (resumeId: string, data: Record<string, unknown>) => ({
    id: `rv-${Date.now()}`,
    resumeId,
    version: dummyResumeVersions.length + 1,
    atsScore: 0,
    contentJson: {},
    createdAt: new Date().toISOString(),
    ...data,
  });
}

export class AtsService extends BaseService {
  latest = (_resumeId: string) => dummyAtsReport;
  analyze = (_resumeId: string) => ({ ...dummyAtsReport, id: `ats-${Date.now()}` });
}

export const resumeService = new ResumeService();
export const atsService = new AtsService();
