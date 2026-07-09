import { prisma } from '../../prisma/client';
import { BaseRepository } from '../../common/base.repository';

type TemplateDelegate = (typeof prisma)['template'];

export class TemplateRepository extends BaseRepository<TemplateDelegate> {
  constructor() {
    super(prisma.template);
  }

  list(filter: { category?: string; isPremium?: boolean } = {}) {
    return this.delegate.findMany({
      where: {
        ...(filter.category ? { category: filter.category as never } : {}),
        ...(typeof filter.isPremium === 'boolean' ? { isPremium: filter.isPremium } : {}),
      },
      orderBy: { name: 'asc' },
    });
  }

  findById(id: string) {
    return this.delegate.findUnique({ where: { id } });
  }
}

export const templateRepository = new TemplateRepository();
