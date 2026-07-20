import { BaseService } from '../../common/base.service';
import { prisma } from '../../prisma/client';
import { NotFoundError } from '../../utils/errors';

type CompletionBreakdown = {
  completionPct: number;
  missing: string[];
  sections: Record<string, number>;
};

type CrudService = {
  list: (userId: string) => Promise<unknown>;
  create: (userId: string, data: Record<string, unknown>) => Promise<unknown>;
  update: (userId: string, id: string, data: Record<string, unknown>) => Promise<unknown>;
  remove: (userId: string, id: string) => Promise<unknown>;
};

type CrudDelegate = {
  findMany: (args: { where: { profileId: string }; orderBy?: unknown }) => Promise<unknown[]>;
  create: (args: { data: Record<string, unknown> }) => Promise<unknown>;
  update: (args: { where: { id: string }; data: Record<string, unknown> }) => Promise<unknown>;
  delete: (args: { where: { id: string } }) => Promise<unknown>;
  findFirstOrThrow: (args: { where: { id: string; profileId: string } }) => Promise<unknown>;
};

const nonEmpty = (value: unknown) => {
  if (Array.isArray(value)) return value.length > 0;
  if (typeof value === 'boolean') return true;
  if (typeof value === 'number') return Number.isFinite(value);
  return typeof value === 'string' ? value.trim().length > 0 : Boolean(value);
};

const normalizeStringArray = (value: unknown): string[] => {
  if (Array.isArray(value)) {
    return value.map((item) => String(item).trim()).filter(Boolean);
  }

  if (typeof value === 'string') {
    return value
      .split(',')
      .map((item) => item.trim())
      .filter(Boolean);
  }

  return [];
};

const scoreObject = (record: Record<string, unknown>, keys: string[]) => {
  if (keys.length === 0) return 100;
  const filled = keys.filter((key) => nonEmpty(record[key])).length;
  return Math.round((filled / keys.length) * 100);
};

const average = (values: number[]) => {
  if (values.length === 0) return 0;
  return Math.round(values.reduce((sum, value) => sum + value, 0) / values.length);
};

const getOrCreateProfile = async (userId: string) => {
  let profile = await prisma.profile.findUnique({ where: { userId } });
  if (!profile) {
    profile = await prisma.profile.create({
      data: { userId, fullName: 'New User' },
    });
  }
  return profile;
};

const normalizeProfilePatch = (patch: Record<string, unknown>) => {
  const normalized = { ...patch } as Record<string, unknown>;

  if (typeof normalized.currentRole === 'string' && !normalized.headline) {
    normalized.headline = normalized.currentRole;
  }

  delete normalized.id;
  delete normalized.userId;
  delete normalized.createdAt;
  delete normalized.updatedAt;
  delete normalized.completionPct;
  delete normalized.currentRole;
  delete normalized.email;
  delete normalized.profile;
  return normalized;
};

const normalizeSocialLink = (data: Record<string, unknown>) => {
  const normalized = { ...data };
  if (typeof normalized.platform === 'string') {
    normalized.platform = normalized.platform.toUpperCase();
  }
  if (!normalized.label && typeof normalized.platform === 'string') {
    normalized.label = String(normalized.platform).toLowerCase();
  }
  return normalized;
};

const normalizeEducation = (data: Record<string, unknown>) => ({
  ...data,
  school: (data.school ?? data.institution ?? data.college) as string | undefined,
});

const normalizeExperience = (data: Record<string, unknown>) => ({
  ...data,
  companyName: (data.companyName ?? data.company) as string | undefined,
  role: (data.role ?? data.position) as string | undefined,
  isCurrent: Boolean(data.isCurrent ?? data.currentCompany),
  technologiesUsed: normalizeStringArray(data.technologiesUsed ?? data.technologies),
  achievements: normalizeStringArray(data.achievements),
});

const normalizeProject = (data: Record<string, unknown>) => ({
  ...data,
  name: (data.name ?? data.title) as string | undefined,
  stack: normalizeStringArray(data.stack ?? data.technologies),
  imageUrls: normalizeStringArray(data.imageUrls ?? data.images),
  featured: Boolean(data.featured),
  achievements: normalizeStringArray(data.achievements),
});

const normalizeSkill = (data: Record<string, unknown>) => ({
  ...data,
  category: typeof data.category === 'string' ? data.category.toUpperCase() : data.category,
});

const normalizeCertificate = (data: Record<string, unknown>) => ({
  ...data,
  name: (data.name ?? data.title) as string | undefined,
  issuedAt: (data.issuedAt ?? data.issueDate) as string | undefined,
  expiresAt: (data.expiresAt ?? data.expiryDate) as string | undefined,
  credentialUrl: (data.credentialUrl ?? data.url) as string | undefined,
});

const normalizeAchievement = (data: Record<string, unknown>) => ({
  ...data,
  context: (data.context ?? data.description) as string | undefined,
  description: (data.description ?? data.context) as string | undefined,
});

const listByProfileId = async (delegate: CrudDelegate, profileId: string, hasSortOrder = false) => {
  const orderBy = hasSortOrder
    ? [{ sortOrder: 'asc' as const }, { createdAt: 'asc' as const }]
    : [{ createdAt: 'asc' as const }];
  return delegate.findMany({ where: { profileId }, orderBy });
};

const buildCrudService = (
  delegate: CrudDelegate,
  normalize: (data: Record<string, unknown>) => Record<string, unknown> = (value) => value,
  hasSortOrder = false,
  onCreate?: (
    userId: string,
    profileId: string,
    data: Record<string, unknown>,
  ) => Promise<Record<string, unknown>>,
): CrudService => ({
  list: async (userId: string) => {
    const profile = await getOrCreateProfile(userId);
    return listByProfileId(delegate, profile.id, hasSortOrder);
  },
  create: async (userId: string, data: Record<string, unknown>) => {
    const profile = await getOrCreateProfile(userId);
    const normalized = normalize(data);
    const payload = onCreate ? await onCreate(userId, profile.id, normalized) : normalized;
    return delegate.create({ data: { profileId: profile.id, ...payload } });
  },
  update: async (userId: string, id: string, data: Record<string, unknown>) => {
    const profile = await getOrCreateProfile(userId);
    await delegate.findFirstOrThrow({ where: { id, profileId: profile.id } });
    return delegate.update({ where: { id }, data: normalize(data) });
  },
  remove: async (userId: string, id: string) => {
    const profile = await getOrCreateProfile(userId);
    await delegate.findFirstOrThrow({ where: { id, profileId: profile.id } });
    return delegate.delete({ where: { id } });
  },
});

export class UserService extends BaseService {
  async me(userId: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { profile: true },
    });
    if (!user) throw new NotFoundError('User not found');
    return user;
  }

  async update(userId: string, patch: Record<string, unknown>) {
    return prisma.user.update({
      where: { id: userId },
      data: patch,
      include: { profile: true },
    });
  }

  async delete(userId: string) {
    await prisma.user.delete({ where: { id: userId } });
    return { success: true };
  }
}

export class ProfileService extends BaseService {
  async get(userId: string) {
    return getOrCreateProfile(userId);
  }

  async upsert(userId: string, patch: Record<string, unknown>) {
    const profile = await getOrCreateProfile(userId);
    const data = normalizeProfilePatch(patch);
    return prisma.profile.update({
      where: { id: profile.id },
      data,
    });
  }

  async completion(userId: string): Promise<CompletionBreakdown> {
    const profile = await getOrCreateProfile(userId);
    const [socialLinks, educations, experiences, projects, skills, certificates, achievements] =
      await Promise.all([
        prisma.socialLink.findMany({ where: { profileId: profile.id } }),
        prisma.education.findMany({ where: { profileId: profile.id } }),
        prisma.experience.findMany({ where: { profileId: profile.id } }),
        prisma.project.findMany({ where: { profileId: profile.id } }),
        prisma.skill.findMany({ where: { profileId: profile.id } }),
        prisma.certificate.findMany({ where: { profileId: profile.id } }),
        prisma.achievement.findMany({ where: { profileId: profile.id } }),
      ]);

    const sections = {
      personal: scoreObject(
        {
          fullName: profile.fullName,
          headline: profile.headline,
          phone: profile.phone,
          location: profile.location,
          summary: profile.summary,
          avatarUrl: profile.avatarUrl,
        },
        ['fullName', 'headline', 'phone', 'location', 'summary', 'avatarUrl'],
      ),
      social: Math.min(100, socialLinks.length * 20),
      education:
        educations.length > 0
          ? average(
              educations.map((item) =>
                scoreObject(item as Record<string, unknown>, [
                  'school',
                  'degree',
                  'field',
                  'startDate',
                  'endDate',
                  'gpa',
                  'description',
                ]),
              ),
            )
          : 0,
      experience:
        experiences.length > 0
          ? average(
              experiences.map((item) =>
                scoreObject(item as Record<string, unknown>, [
                  'companyName',
                  'role',
                  'employmentType',
                  'location',
                  'startDate',
                  'endDate',
                  'description',
                  'technologiesUsed',
                  'achievements',
                ]),
              ),
            )
          : 0,
      projects:
        projects.length > 0
          ? average(
              projects.map((item) =>
                scoreObject(item as Record<string, unknown>, [
                  'name',
                  'description',
                  'role',
                  'stack',
                  'githubUrl',
                  'liveUrl',
                  'startDate',
                  'endDate',
                  'featured',
                  'imageUrls',
                ]),
              ),
            )
          : 0,
      skills: skills.length > 0 ? Math.min(100, Math.round((skills.length / 12) * 100)) : 0,
      certificates:
        certificates.length > 0
          ? average(
              certificates.map((item) =>
                scoreObject(item as Record<string, unknown>, [
                  'name',
                  'issuer',
                  'issuedAt',
                  'expiresAt',
                  'credentialId',
                  'credentialUrl',
                ]),
              ),
            )
          : 0,
      achievements:
        achievements.length > 0
          ? average(
              achievements.map((item) =>
                scoreObject(item as Record<string, unknown>, [
                  'title',
                  'context',
                  'description',
                  'date',
                  'url',
                ]),
              ),
            )
          : 0,
    };

    const completionPct = Math.round(
      average([
        sections.personal,
        sections.social,
        sections.education,
        sections.experience,
        sections.projects,
        sections.skills,
        sections.certificates,
        sections.achievements,
      ]),
    );

    const missing = Object.entries(sections)
      .filter(([, score]) => score < 100)
      .map(([section]) => section);

    return { completionPct, missing, sections };
  }
}

export const userService = new UserService();
export const profileService = new ProfileService();

export const socialLinksService = buildCrudService(
  prisma.socialLink as unknown as CrudDelegate,
  normalizeSocialLink,
);
export const educationService = buildCrudService(
  prisma.education as unknown as CrudDelegate,
  normalizeEducation,
);
export const experienceService = buildCrudService(
  prisma.experience as unknown as CrudDelegate,
  normalizeExperience,
);
export const projectsService = buildCrudService(
  prisma.project as unknown as CrudDelegate,
  normalizeProject,
);
export const skillsService = buildCrudService(
  prisma.skill as unknown as CrudDelegate,
  normalizeSkill,
  true,
  async (_userId, profileId, data) => {
    const existingMax = await prisma.skill.aggregate({
      _max: { sortOrder: true },
      where: { profileId },
    });
    return {
      ...data,
      sortOrder:
        typeof data.sortOrder === 'number' ? data.sortOrder : (existingMax._max.sortOrder ?? 0) + 1,
    };
  },
);
export const certificatesService = buildCrudService(
  prisma.certificate as unknown as CrudDelegate,
  normalizeCertificate,
);
export const achievementsService = buildCrudService(
  prisma.achievement as unknown as CrudDelegate,
  normalizeAchievement,
);

export const reorderSkills = async (userId: string, orderedIds: string[]) => {
  const profile = await getOrCreateProfile(userId);
  const skills = await prisma.skill.findMany({
    where: { profileId: profile.id },
    select: { id: true },
  });

  const ownedIds = new Set(skills.map((skill) => skill.id));
  const validIds = orderedIds.filter((id) => ownedIds.has(id));
  const missingIds = skills.map((skill) => skill.id).filter((id) => !validIds.includes(id));
  const finalOrder = [...validIds, ...missingIds];

  return prisma.$transaction(
    finalOrder.map((id, index) =>
      prisma.skill.update({
        where: { id },
        data: { sortOrder: index },
      }),
    ),
  );
};
