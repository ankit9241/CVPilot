import { prisma } from '../../db/prisma';
import { FeatureType, MONTHLY_FEATURE_LIMITS } from '../../config/limits';

export function getUtcPeriod(date: Date = new Date()): {
  periodKey: string;
  periodStart: Date;
  periodEnd: Date;
} {
  const year = date.getUTCFullYear();
  const month = date.getUTCMonth(); // 0-indexed (0 = Jan, 8 = Sep)
  const periodKey = `${year}-${String(month + 1).padStart(2, '0')}`;
  const periodStart = new Date(Date.UTC(year, month, 1, 0, 0, 0, 0));
  const periodEnd = new Date(Date.UTC(year, month + 1, 1, 0, 0, 0, 0));
  return { periodKey, periodStart, periodEnd };
}

export class UsageRepository {
  /**
   * Concurrency-safe atomic quota consumption.
   * Atomically increments `used` only if `used < limit`.
   */
  async consumeAtomic(userId: string, feature: FeatureType): Promise<{
    allowed: boolean;
    used: number;
    limit: number;
    remaining: number;
    resetAt: Date;
  }> {
    const { periodKey, periodStart, periodEnd } = getUtcPeriod();
    const limit = MONTHLY_FEATURE_LIMITS[feature];

    // 1. Ensure the period row exists (safe on conflict)
    await prisma.$executeRaw`
      INSERT INTO "UserUsage" ("id", "userId", "feature", "periodKey", "periodStart", "periodEnd", "used", "limit", "createdAt", "updatedAt")
      VALUES (gen_random_uuid(), ${userId}, ${feature}::"FeatureType", ${periodKey}, ${periodStart}, ${periodEnd}, 0, ${limit}, NOW(), NOW())
      ON CONFLICT ("userId", "feature", "periodKey") DO NOTHING;
    `;

    // 2. Atomically conditional increment: only update if used < limit
    const updated = await prisma.$queryRaw<Array<{ used: number; limit: number }>>`
      UPDATE "UserUsage"
      SET "used" = "used" + 1, "updatedAt" = NOW()
      WHERE "userId" = ${userId}
        AND "feature" = ${feature}::"FeatureType"
        AND "periodKey" = ${periodKey}
        AND "used" < "limit"
      RETURNING "used", "limit";
    `;

    if (updated && updated.length > 0) {
      const row = updated[0];
      return {
        allowed: true,
        used: row.used,
        limit: row.limit,
        remaining: Math.max(0, row.limit - row.used),
        resetAt: periodEnd,
      };
    }

    // If update did not match, quota is exhausted
    const current = await prisma.userUsage.findUnique({
      where: {
        userId_feature_periodKey: {
          userId,
          feature,
          periodKey,
        },
      },
    });

    const used = current ? current.used : limit;
    return {
      allowed: false,
      used,
      limit,
      remaining: 0,
      resetAt: periodEnd,
    };
  }

  /**
   * Concurrency-safe atomic release/refund of a quota credit.
   */
  async releaseAtomic(userId: string, feature: FeatureType): Promise<void> {
    const { periodKey } = getUtcPeriod();
    await prisma.$executeRaw`
      UPDATE "UserUsage"
      SET "used" = GREATEST("used" - 1, 0), "updatedAt" = NOW()
      WHERE "userId" = ${userId}
        AND "feature" = ${feature}::"FeatureType"
        AND "periodKey" = ${periodKey};
    `;
  }

  /**
   * Get single feature usage for user in current UTC period.
   */
  async getFeatureUsage(userId: string, feature: FeatureType) {
    const { periodKey, periodEnd } = getUtcPeriod();
    const limit = MONTHLY_FEATURE_LIMITS[feature];

    const record = await prisma.userUsage.findUnique({
      where: {
        userId_feature_periodKey: {
          userId,
          feature,
          periodKey,
        },
      },
    });

    const used = record ? record.used : 0;
    return {
      used,
      limit,
      remaining: Math.max(0, limit - used),
      resetAt: periodEnd,
    };
  }

  /**
   * Get all features usage summary for user in current UTC period.
   */
  async getSummary(userId: string) {
    const { periodKey, periodStart, periodEnd } = getUtcPeriod();

    const records = await prisma.userUsage.findMany({
      where: {
        userId,
        periodKey,
      },
    });

    const recordMap = new Map<FeatureType, number>();
    for (const r of records) {
      recordMap.set(r.feature, r.used);
    }

    const features: Record<string, { used: number; limit: number; remaining: number; resetAt: string }> = {};

    for (const feature of Object.values(FeatureType)) {
      const limit = MONTHLY_FEATURE_LIMITS[feature];
      const used = recordMap.get(feature) || 0;
      features[feature] = {
        used,
        limit,
        remaining: Math.max(0, limit - used),
        resetAt: periodEnd.toISOString(),
      };
    }

    return {
      periodStart: periodStart.toISOString(),
      periodEnd: periodEnd.toISOString(),
      features,
    };
  }
}

export const usageRepository = new UsageRepository();
