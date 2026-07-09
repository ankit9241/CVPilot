import { prisma } from '../../prisma/client';
import { BaseRepository } from '../../common/base.repository';

type SavedResumeDelegate = (typeof prisma)['savedResume'];

export class ResumeRepository extends BaseRepository<SavedResumeDelegate> {
  constructor() {
    super(prisma.savedResume);
  }

  listForUser(userId: string, params: { skip: number; take: number }) {
    return this.delegate.findMany({
      where: { vault: { userId } },
      skip: params.skip,
      take: params.take,
      orderBy: { updatedAt: 'desc' },
    });
  }

  countForUser(userId: string) {
    return this.delegate.count({ where: { vault: { userId } } });
  }

  findById(id: string) {
    return this.delegate.findUnique({ where: { id } });
  }

  create(data: Record<string, unknown>) {
    return this.delegate.create({ data: data as never });
  }

  update(id: string, data: Record<string, unknown>) {
    return this.delegate.update({ where: { id }, data });
  }

  delete(id: string) {
    return this.delegate.delete({ where: { id } });
  }
}

export const resumeRepository = new ResumeRepository();
