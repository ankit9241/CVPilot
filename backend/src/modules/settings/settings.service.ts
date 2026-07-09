import { BaseService } from '../../common/base.service';
import { dummySettings } from '../../constants/dummy-data';
import { settingsRepository, SettingsRepository } from './settings.repository';

export class SettingsService extends BaseService {
  constructor(protected readonly repository: SettingsRepository = settingsRepository) {
    super();
  }

  get = () => dummySettings;
  upsert = (patch: Record<string, unknown>) => ({ ...dummySettings, ...patch });
}

export const settingsService = new SettingsService();
