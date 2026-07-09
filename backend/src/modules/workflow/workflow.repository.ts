import { prisma } from '../../prisma/client';
import { BaseRepository } from '../../common/base.repository';

type WorkflowLogDelegate = (typeof prisma)['workflowLog'];

export class WorkflowRepository extends BaseRepository<WorkflowLogDelegate> {
  constructor() {
    super(prisma.workflowLog);
  }

  listForUser(userId: string) {
    return this.delegate.findMany({
      where: {
        session: {
          userId,
        },
      },
      orderBy: { timestamp: 'desc' },
    });
  }

  findById(id: string) {
    return this.delegate.findUnique({ where: { id } });
  }

  create(data: Record<string, unknown>) {
    return this.delegate.create({ data: data as never });
  }
}

export const workflowRepository = new WorkflowRepository();
