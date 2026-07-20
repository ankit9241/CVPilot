import { BaseService } from '../../common/base.service';
import { settingsRepository, SettingsRepository } from './settings.repository';

export class SettingsService extends BaseService {
  constructor(protected readonly repository: SettingsRepository = settingsRepository) {
    super();
  }

  async get(userId: string) {
    let settings = await this.repository.findByUserId(userId);
    if (!settings) {
      settings = await this.repository.upsert(userId, {
        theme: 'system',
        language: 'en',
        emailNotifications: true,
        productUpdates: true,
        weeklyDigest: true,
        timezone: 'UTC',
      });
    }
    return settings;
  }

  async upsert(userId: string, patch: Record<string, unknown>) {
    const { id, userId: uId, createdAt, updatedAt, ...updateData } = patch;
    return this.repository.upsert(userId, updateData);
  }
}

export const settingsService = new SettingsService();
