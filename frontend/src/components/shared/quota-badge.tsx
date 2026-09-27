import { useUsage, FEATURE_INFO } from "@/hooks/use-usage";
import { useLimitModalStore } from "@/store/limit-modal-store";
import { Sparkles, AlertCircle, RefreshCw } from "lucide-react";
import { cn } from "@/lib/utils";

interface QuotaBadgeProps {
  feature: string;
  className?: string;
  showIcon?: boolean;
  variant?: "pill" | "compact" | "banner";
}

export function QuotaBadge({
  feature,
  className,
  showIcon = true,
  variant = "pill",
}: QuotaBadgeProps) {
  const { getFeatureQuota, loading, nextResetDate } = useUsage();
  const { openLimitModal } = useLimitModalStore();

  const quota = getFeatureQuota(feature);
  const info = FEATURE_INFO[feature];

  const handleClick = () => {
    openLimitModal({
      feature,
      used: quota.used,
      limit: quota.limit,
      remaining: quota.remaining,
      resetAt: quota.resetAt,
    });
  };

  if (variant === "compact") {
    return (
      <button
        type="button"
        onClick={handleClick}
        title={`Click to view quota details. Resets on ${nextResetDate}`}
        className={cn(
          "inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[11px] font-medium transition-colors cursor-pointer",
          quota.isExhausted
            ? "bg-rose-500/10 text-rose-700 border border-rose-500/20 hover:bg-rose-500/15"
            : "bg-emerald-500/10 text-emerald-800 border border-emerald-500/20 hover:bg-emerald-500/15",
          className
        )}
      >
        {loading ? (
          <RefreshCw className="h-3 w-3 animate-spin text-[#787774]" />
        ) : quota.isExhausted ? (
          <AlertCircle className="h-3 w-3 text-rose-600" />
        ) : showIcon ? (
          <Sparkles className="h-3 w-3 text-emerald-600" />
        ) : null}
        <span>
          {quota.isExhausted ? (
            <strong className="text-rose-600">0 / {quota.limit} left</strong>
          ) : (
            <>
              <strong className="text-emerald-700 font-semibold">{quota.remaining}</strong> / {quota.limit} {quota.unit} left
            </>
          )}
        </span>
      </button>
    );
  }

  if (variant === "banner") {
    return (
      <div
        className={cn(
          "flex items-center justify-between rounded-xl border p-3.5 text-xs transition-all",
          quota.isExhausted
            ? "border-rose-500/20 bg-rose-500/5 text-rose-800"
            : "border-emerald-500/20 bg-emerald-50/40 text-emerald-950",
          className
        )}
      >
        <div className="flex items-center gap-2.5">
          {quota.isExhausted ? (
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-rose-100 text-rose-700">
              <AlertCircle className="h-4 w-4" />
            </div>
          ) : (
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-100/80 text-emerald-700 shadow-2xs">
              <Sparkles className="h-4 w-4 text-emerald-600" />
            </div>
          )}
          <div>
            <div className="font-semibold text-[#18181B]">{info?.label || feature} Quota</div>
            <div className="text-[11px] text-[#787774]">
              {quota.isExhausted ? (
                <span className="text-rose-600 font-medium">Limit reached. Automatic refresh on {nextResetDate}.</span>
              ) : (
                <>
                  <span className="font-semibold text-emerald-700">{quota.remaining} of {quota.limit}</span> monthly {quota.unit} remaining.
                </>
              )}
            </div>
          </div>
        </div>
        <button
          type="button"
          onClick={handleClick}
          className={cn(
            "rounded-lg border px-2.5 py-1 text-[11px] font-medium transition-colors shadow-2xs cursor-pointer",
            quota.isExhausted
              ? "border-rose-300 bg-white text-rose-700 hover:bg-rose-50"
              : "border-emerald-300 bg-white text-emerald-800 hover:bg-emerald-50"
          )}
        >
          View Limits
        </button>
      </div>
    );
  }

  // Default "pill" variant
  return (
    <button
      type="button"
      onClick={handleClick}
      title={`Monthly Quota: ${quota.remaining} / ${quota.limit} ${quota.unit} remaining. Resets ${nextResetDate}. Click to view details.`}
      className={cn(
        "group inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-medium transition-all shadow-2xs cursor-pointer",
        quota.isExhausted
          ? "border-rose-500/30 bg-rose-50 text-rose-700 hover:bg-rose-100"
          : "border-emerald-500/30 bg-emerald-50/80 text-emerald-900 hover:bg-emerald-100/80",
        className
      )}
    >
      {loading ? (
        <RefreshCw className="h-3.5 w-3.5 animate-spin text-[#787774]" />
      ) : quota.isExhausted ? (
        <AlertCircle className="h-3.5 w-3.5 text-rose-600" />
      ) : showIcon ? (
        <Sparkles className="h-3.5 w-3.5 text-emerald-600 group-hover:rotate-12 transition-transform" />
      ) : null}
      <span>
        {quota.isExhausted ? (
          <strong className="text-rose-600 font-bold">0 / {quota.limit} left</strong>
        ) : (
          <>
            <strong className="text-emerald-700 font-bold">{quota.remaining}</strong> / {quota.limit} {quota.unit} left
          </>
        )}
      </span>
      <span className="hidden sm:inline text-[10.5px] opacity-75">
        · Resets {nextResetDate}
      </span>
    </button>
  );
}
