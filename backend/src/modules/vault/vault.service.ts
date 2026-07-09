import { BaseService } from '../../common/base.service';
import { dummyResumes, dummyResumeVersions } from '../../constants/dummy-data';
import { vaultRepository, VaultRepository } from './vault.repository';

export class VaultService extends BaseService {
  constructor(protected readonly repository: VaultRepository = vaultRepository) {
    super();
  }

  getVault() {
    return dummyResumes.map((r) => ({
      company: r.company || 'Unknown',
      logo: (r.company || 'Unknown').charAt(0).toUpperCase(),
      roles: [
        {
          role: r.role || 'Software Engineer',
          versions: dummyResumeVersions
            .filter((v) => v.resumeId === r.id)
            .map((v) => ({
              id: v.id,
              name: v.label || `Version ${v.version}`,
              ats: v.atsScore || 0,
              template: 'Modern',
              date: v.createdAt,
              favorite: r.isFavorite,
            })),
        },
      ],
    }));
  }
}

export const vaultService = new VaultService();
