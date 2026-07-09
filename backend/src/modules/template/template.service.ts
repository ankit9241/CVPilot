import { BaseService } from '../../common/base.service';
import { dummyTemplates } from '../../constants/dummy-data';
import { templateRepository, TemplateRepository } from './template.repository';

export class TemplateService extends BaseService {
  constructor(protected readonly repository: TemplateRepository = templateRepository) {
    super();
  }

  list = (filter: { category?: string; isPremium?: boolean } = {}) =>
    dummyTemplates.filter(
      (t) =>
        (!filter.category || t.category === filter.category) &&
        (filter.isPremium === undefined || t.isPremium === filter.isPremium),
    );

  get = (id: string) => dummyTemplates.find((t) => t.id === id) ?? dummyTemplates[0];
}

export const templateService = new TemplateService();
