import { BaseService } from '../../common/base.service';
import {
  dummyAchievements,
  dummyCertificates,
  dummyEducation,
  dummyExperience,
  dummyProfile,
  dummyProjects,
  dummySkills,
  dummySocialLinks,
  dummyUser,
} from '../../constants/dummy-data';
import { profileRepository, ProfileRepository } from './profile.repository';

export class UserService extends BaseService {
  me = () => dummyUser;
  update = (patch: Record<string, unknown>) => ({ ...dummyUser, ...patch });
  delete = () => ({ success: true });
}

export class ProfileService extends BaseService {
  constructor(protected readonly repository: ProfileRepository = profileRepository) {
    super();
  }

  get = () => dummyProfile;
  upsert = (patch: Record<string, unknown>) => ({ ...dummyProfile, ...patch });
  completion = () => ({ completion: dummyProfile.completion, missing: ['certificates', 'achievements'] });
}

const listCrud = <T extends { id: string }>(seed: T[], prefix: string) => ({
  list: () => seed,
  create: (data: Record<string, unknown>) => ({ id: `${prefix}-${Date.now()}`, profileId: dummyProfile.id, ...data }),
  update: (id: string, data: Record<string, unknown>) => ({ id, profileId: dummyProfile.id, ...data }),
  remove: (_id: string) => ({ success: true }),
});

export const userService = new UserService();
export const profileService = new ProfileService();

export const socialLinksService = listCrud(dummySocialLinks, 'sl');
export const educationService = listCrud(dummyEducation, 'edu');
export const experienceService = listCrud(dummyExperience, 'exp');
export const projectsService = listCrud(dummyProjects, 'proj');
export const skillsService = listCrud(dummySkills, 'sk');
export const certificatesService = listCrud(dummyCertificates, 'cert');
export const achievementsService = listCrud(dummyAchievements, 'ach');
