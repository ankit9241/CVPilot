import { prisma } from '../../prisma/client';
import { BaseRepository } from '../../common/base.repository';

type ResumeVersionDelegate = (typeof prisma)['resumeVersion'];

export class VaultRepository extends BaseRepository<ResumeVersionDelegate> {
  constructor() {
    super(prisma.resumeVersion);
  }

  listForUser(userId: string) {
    return this.client.savedResume.findMany({
      where: { vault: { userId } },
      include: {
        version: {
          include: {
            atsRuns: {
              orderBy: { iterationNumber: 'desc' },
              take: 1,
            },
          },
        },
      },
    });
  }
}

export const vaultRepository = new VaultRepository();
