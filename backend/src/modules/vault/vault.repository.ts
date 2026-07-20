import { prisma } from '../../prisma/client';
import { BaseRepository } from '../../common/base.repository';

type ResumeVersionDelegate = (typeof prisma)['resumeVersion'];

export class VaultRepository extends BaseRepository<ResumeVersionDelegate> {
  constructor() {
    super(prisma.resumeVersion);
  }

  listForUser(userId: string) {
    return this.client.savedResume.findMany({
      where: { vault: { userId }, deletedAt: null },
      orderBy: { updatedAt: 'desc' },
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

  listAllSessionsForUser(userId: string) {
    return (this.client as any).generationSession.findMany({
      where: { userId, status: 'COMPLETED' },
      orderBy: { updatedAt: 'desc' },
      include: {
        versions: {
          orderBy: { versionNo: 'asc' },
          include: {
            atsRuns: {
              orderBy: { iterationNumber: 'desc' },
              take: 1,
            },
            savedResumes: {
              where: { vault: { userId }, deletedAt: null },
              take: 1,
            },
          },
        },
      },
    });
  }
}

export const vaultRepository = new VaultRepository();
