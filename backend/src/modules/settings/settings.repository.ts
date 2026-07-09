import { prisma } from '../../prisma/client';
import { BaseRepository } from '../../common/base.repository';

type SettingsDelegate = (typeof prisma)['settings'];

export class SettingsRepository extends BaseRepository<SettingsDelegate> {
  constructor() {
    super(prisma.settings);
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

export const settingsRepository = new SettingsRepository();
