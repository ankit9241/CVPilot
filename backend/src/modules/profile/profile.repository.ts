import { prisma } from '../../prisma/client';
import { BaseRepository } from '../../common/base.repository';

type ProfileDelegate = (typeof prisma)['profile'];

export class ProfileRepository extends BaseRepository<ProfileDelegate> {
  constructor() {
    super(prisma.profile);
  }

  findByUserId(userId: string) {
    return this.delegate.findUnique({ where: { userId } });
  }

  upsert(userId: string, data: Record<string, unknown>) {
    return this.delegate.upsert({
      where: { userId },
      update: data,
      create: { userId, ...data } as never,
    });
  }
}

export const profileRepository = new ProfileRepository();
