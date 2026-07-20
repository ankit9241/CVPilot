import { BaseService } from '../../common/base.service';
import { dummyTemplates } from '../../constants/dummy-data';
import { prisma } from '../../prisma/client';
import { templateRepository, TemplateRepository } from './template.repository';

export class TemplateService extends BaseService {
  constructor(protected readonly repository: TemplateRepository = templateRepository) {
    super();
  }

  async list(filter: { category?: any; isPremium?: boolean } = {}) {
    const list = await prisma.template.findMany({
      where: {
        isActive: true,
        ...(filter.category ? { category: filter.category } : {}),
        ...(filter.isPremium !== undefined ? { isPremium: filter.isPremium } : {}),
      },
    });

    if (list.length === 0) {
      return dummyTemplates.filter(
        (t) =>
          (!filter.category || t.category === filter.category) &&
          (filter.isPremium === undefined || t.isPremium === filter.isPremium),
      );
    }
    return list;
  }

  async get(id: string) {
    const t = await prisma.template.findUnique({ where: { id } });
    if (!t) {
      return dummyTemplates.find((x) => x.id === id) || dummyTemplates[0];
    }
    return t;
  }
}

export const templateService = new TemplateService();
