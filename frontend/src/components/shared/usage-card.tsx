import { useState, useEffect } from "react";
import { Sparkles, FileText, CheckCircle2, RefreshCw } from "lucide-react";
import { api, type UsageSummary } from "@/lib/api";

const FEATURE_META: Record<
  string,
  { label: string; icon: typeof Sparkles; description: string; defaultLimit: number }
> = {
  ATS_ANALYSIS: {
    label: "ATS Analysis",
    icon: Sparkles,
    description: "Deep keyword & recruiter match scans",
    defaultLimit: 10,
  },
  RESUME_GENERATION: {
    label: "AI Resume Builder",
    icon: FileText,
    description: "Full 9-node AI resume generation",
    defaultLimit: 5,
  },
  AI_OPTIMIZATION: {
    label: "AI Optimization",
    icon: Sparkles,
    description: "LinkedIn & portfolio tailoring",
    defaultLimit: 10,
  },
  RESUME_IMPORT: {
    label: "Resume Imports",
    icon: FileText,
    description: "PDF/DOCX document extraction",
    defaultLimit: 5,
  },
  AI_REWRITE: {
    label: "AI Cover Letters & Rewrites",
    icon: Sparkles,
    description: "Targeted role cover letters",
    defaultLimit: 20,
  },
  PDF_GENERATION: {
    label: "PDF Compilations",
    icon: FileText,
    description: "XeLaTeX resume PDF builds",
    defaultLimit: 10,
  },
};

export function UsageCard() {
  const [usage, setUsage] = useState<UsageSummary | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    api
      .get<UsageSummary>("/usage")
      .then((data) => {
        if (isMounted) {
          setUsage(data);
          setLoading(false);
        }
      })
      .catch(() => {
        if (isMounted) {
          setLoading(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, []);

  // Compute next month reset date
  const getNextResetDate = () => {
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
  };

  const resetDate = getNextResetDate();

  // Normalized features list (handles live API data or standard fallback)
  const featuresList = Object.keys(FEATURE_META).map((key) => {
    const meta = FEATURE_META[key];
    const live = usage?.features?.[key as keyof typeof usage.features];
    const used = live?.used ?? 0;
    const limit = live?.limit ?? meta.defaultLimit;
    const remaining = live?.remaining ?? Math.max(0, limit - used);
    const percentage = Math.min(100, Math.round((used / limit) * 100));

    return {
      key,
      meta,
      used,
      limit,
      remaining,
      percentage,
    };
  });

  return (
    <div className="col-span-12 rounded-2xl border border-[rgba(55,50,47,0.12)] bg-[#FFFEFC] p-6 shadow-xs">
      <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-base font-semibold text-[#18181B] tracking-tight">
              Monthly Feature Quotas
            </h3>
            {loading && <RefreshCw className="h-3.5 w-3.5 animate-spin text-[#787774]" />}
          </div>
          <p className="text-xs text-[#787774]">
            Every user receives fixed monthly credits. Limits reset automatically on {resetDate}.
          </p>
        </div>
        <div className="flex items-center gap-1.5 self-start rounded-full bg-[#F4F1EC] px-3 py-1 text-xs font-medium text-[#49443E]">
          <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" /> Fixed Monthly Limits
        </div>
      </div>

      <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {featuresList.map(({ key, meta, used, limit, remaining, percentage }) => {
          const Icon = meta.icon;
          const isExhausted = remaining === 0;

          return (
            <div
              key={key}
              className={`flex flex-col justify-between rounded-xl border p-4 transition-colors ${
                isExhausted
                  ? "border-rose-200 bg-rose-50/30 hover:border-rose-300"
                  : "border-[rgba(55,50,47,0.08)] bg-[#FBFAF7] hover:border-[rgba(55,50,47,0.16)]"
              }`}
            >
              <div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-white shadow-2xs">
                      <Icon className="h-4 w-4 text-[#18181B]" />
                    </div>
                    <span className="text-sm font-medium text-[#18181B]">{meta.label}</span>
                  </div>
                  <span
                    className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                      isExhausted
                        ? "bg-rose-500/10 text-rose-700"
                        : "bg-emerald-500/10 text-emerald-700"
                    }`}
                  >
                    {remaining} left
                  </span>
                </div>
                <p className="mt-1 text-xs text-[#787774] line-clamp-1">{meta.description}</p>
              </div>

              <div className="mt-4">
                <div className="flex justify-between text-[11px] text-[#787774]">
                  <span>
                    {used} / {limit} used
                  </span>
                  <span className={isExhausted ? "text-rose-600 font-semibold" : "text-emerald-700 font-semibold"}>
                    {percentage}%
                  </span>
                </div>
                <div className="mt-1.5 h-1.5 w-full overflow-hidden rounded-full bg-[#E8E5DF]">
                  <div
                    className={`h-full rounded-full transition-all duration-300 ${
                      isExhausted
                        ? "bg-rose-500"
                        : percentage >= 80
                          ? "bg-amber-500"
                          : "bg-emerald-500"
                    }`}
                    style={{ width: `${percentage}%` }}
                  />
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
