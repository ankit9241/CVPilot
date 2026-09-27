import { BaseService } from '../../common/base.service';
import { FeatureType } from '../../config/limits';
import { usageRepository, UsageRepository } from './usage.repository';
import { UsageLimitReachedError } from '../../utils/errors';
import { logger } from '../../logger/logger';

export class UsageService extends BaseService {
  constructor(protected readonly repository: UsageRepository = usageRepository) {
    super();
  }

  async getUsageSummary(userId: string) {
    return this.repository.getSummary(userId);
  }

  async getUsage(userId: string, feature: FeatureType) {
    return this.repository.getFeatureUsage(userId, feature);
  }

  /**
   * Concurrency-safe atomic consumption.
   * Throws UsageLimitReachedError if the monthly limit has been reached.
   */
  async consume(userId: string, feature: FeatureType) {
    const result = await this.repository.consumeAtomic(userId, feature);
    if (!result.allowed) {
      logger.warn('Monthly feature usage limit reached', {
        userId,
        feature,
        used: result.used,
        limit: result.limit,
      });
      throw new UsageLimitReachedError(
        `You've reached your monthly limit for ${feature.replace(/_/g, ' ').toLowerCase()}. Your limit resets on the 1st of next month.`,
        {
          feature,
          used: result.used,
          limit: result.limit,
          remaining: 0,
          resetAt: result.resetAt.toISOString(),
        },
      );
    }
    return result;
  }

  /**
   * Release/refund 1 unit of feature usage if an operation fails before work was done.
   */
  async release(userId: string, feature: FeatureType) {
    await this.repository.releaseAtomic(userId, feature);
  }
}

export const usageService = new UsageService();
