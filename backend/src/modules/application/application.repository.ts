import { prisma } from '../../prisma/client';
import { BaseRepository } from '../../common/base.repository';

type ApplicationDelegate = (typeof prisma)['application'];

export class ApplicationRepository extends BaseRepository<ApplicationDelegate> {
  constructor() {
    super(prisma.application);
  }

  listForUser(userId: string, params: { skip: number; take: number }) {
    return this.delegate.findMany({
      where: { userId },
      skip: params.skip,
      take: params.take,
      orderBy: { updatedAt: 'desc' },
    });
  }

  countForUser(userId: string) {
    return this.delegate.count({ where: { userId } });
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

export const applicationRepository = new ApplicationRepository();
