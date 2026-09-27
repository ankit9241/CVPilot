import { useState, useEffect, useCallback } from "react";
import { api, type UsageSummary, type FeatureQuota } from "@/lib/api";

export const FEATURE_INFO: Record<
  string,
  { label: string; unit: string; description: string; defaultLimit: number }
> = {
  ATS_ANALYSIS: {
    label: "ATS Analysis",
    unit: "scans",
    description: "Deep keyword & recruiter match scans",
    defaultLimit: 10,
  },
  RESUME_GENERATION: {
    label: "AI Resume Generation",
    unit: "resumes",
    description: "Full AI resume generation sessions",
    defaultLimit: 5,
  },
  AI_OPTIMIZATION: {
    label: "AI Optimization",
    unit: "optimizations",
    description: "LinkedIn & portfolio tailoring",
    defaultLimit: 10,
  },
  RESUME_IMPORT: {
    label: "Resume Import",
    unit: "imports",
    description: "PDF/DOCX profile extraction",
    defaultLimit: 5,
  },
  AI_REWRITE: {
    label: "AI Bullet Rewrites",
    unit: "rewrites",
    description: "Targeted role bullets & cover letters",
    defaultLimit: 20,
  },
  PDF_GENERATION: {
    label: "PDF Compilations",
    unit: "downloads",
    description: "XeLaTeX resume PDF builds",
    defaultLimit: 10,
  },
};

// Global cache to avoid excessive fetches across components
let cachedUsage: UsageSummary | null = null;
let lastFetchedTime = 0;
const CACHE_TTL_MS = 15000; // 15 seconds

export function useUsage() {
  const [usage, setUsage] = useState<UsageSummary | null>(cachedUsage);
  const [loading, setLoading] = useState<boolean>(!cachedUsage);

  const fetchUsage = useCallback(async (force = false) => {
    const now = Date.now();
    if (!force && cachedUsage && now - lastFetchedTime < CACHE_TTL_MS) {
      setUsage(cachedUsage);
      setLoading(false);
      return cachedUsage;
    }

    try {
      setLoading(true);
      const data = await api.get<UsageSummary>("/usage");
      cachedUsage = data;
      lastFetchedTime = Date.now();
      setUsage(data);
      return data;
    } catch {
      return cachedUsage;
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchUsage();
  }, [fetchUsage]);

  const getFeatureQuota = useCallback(
    (featureKey: string) => {
      const info = FEATURE_INFO[featureKey] || {
        label: featureKey,
        unit: "operations",
        description: "Monthly operation quota",
        defaultLimit: 10,
      };

      const live = usage?.features?.[featureKey as keyof typeof usage.features] as
        | FeatureQuota
        | undefined;

      const used = live?.used ?? 0;
      const limit = live?.limit ?? info.defaultLimit;
      const remaining = live?.remaining ?? Math.max(0, limit - used);
      const percentage = Math.min(100, Math.round((used / limit) * 100));
      const resetAt = live?.resetAt || usage?.periodEnd;

      return {
        key: featureKey,
        label: info.label,
        unit: info.unit,
        description: info.description,
        used,
        limit,
        remaining,
        percentage,
        isExhausted: remaining <= 0,
        resetAt,
      };
    },
    [usage]
  );

  const isLimitReached = useCallback(
    (featureKey: string) => {
      const quota = getFeatureQuota(featureKey);
      return quota.isExhausted;
    },
    [getFeatureQuota]
  );

  const getNextResetDate = useCallback(() => {
    if (usage?.periodEnd) {
      return new Date(usage.periodEnd).toLocaleDateString(undefined, {
        month: "short",
        day: "numeric",
      });
    }
    const now = new Date();
    const nextMonth = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 1));
    return nextMonth.toLocaleDateString(undefined, {
      month: "short",
      day: "numeric",
    });
  }, [usage]);

  return {
    usage,
    loading,
    refetch: () => fetchUsage(true),
    getFeatureQuota,
    isLimitReached,
    nextResetDate: getNextResetDate(),
  };
}
