import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useLimitModalStore } from "@/store/limit-modal-store";
import { useUsage, FEATURE_INFO } from "@/hooks/use-usage";
import {
  ShieldAlert,
  Calendar,
  CheckCircle2,
  FileText,
  ScanSearch,
  Wand2,
  Upload,
  Download,
  Layers,
  SlidersHorizontal,
} from "lucide-react";
import { Link } from "@tanstack/react-router";
import { cn } from "@/lib/utils";

const FEATURE_ICONS: Record<string, typeof FileText> = {
  ATS_ANALYSIS: ScanSearch,
  RESUME_GENERATION: Wand2,
  AI_OPTIMIZATION: SlidersHorizontal,
  RESUME_IMPORT: Upload,
  AI_REWRITE: FileText,
  PDF_GENERATION: Download,
};

export function LimitReachedModal() {
  const { isOpen, data, closeLimitModal } = useLimitModalStore();
  const { nextResetDate, getFeatureQuota } = useUsage();
  const [viewAll, setViewAll] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setViewAll(Boolean(data?.showAll || !data?.feature));
    }
  }, [isOpen, data?.showAll, data?.feature]);

  const featureKey = data?.feature;
  const quota = featureKey ? getFeatureQuota(featureKey) : null;
  const info = featureKey ? FEATURE_INFO[featureKey] : null;

  const used = data?.used ?? quota?.used ?? 0;
  const limit = data?.limit ?? quota?.limit ?? (info?.defaultLimit || 10);
  const unit = info?.unit || "operations";
  const remaining = data?.remaining ?? quota?.remaining ?? Math.max(0, limit - used);
  const percentage = Math.min(100, Math.round((used / limit) * 100));
  const isExhausted = remaining <= 0;

  const featureTitle =
    data?.title ||
    (isExhausted
      ? info
        ? `Monthly ${info.label} Limit Reached`
        : "Monthly Limit Reached"
      : info
        ? `Monthly ${info.label} Quota`
        : "Monthly Quota Status");

  const formattedResetDate = data?.resetAt
    ? new Date(data.resetAt).toLocaleDateString(undefined, {
        month: "short",
        day: "numeric",
      })
    : nextResetDate;

  // Features list for all limits view
  const featureKeys = Object.keys(FEATURE_INFO);
  const allFeatures = featureKeys.map((key) => {
    const q = getFeatureQuota(key);
    const Icon = FEATURE_ICONS[key] || Sparkles;
    return {
      key,
      ...q,
      Icon,
    };
  });

  const totalUsed = allFeatures.reduce((acc, f) => acc + f.used, 0);
  const totalLimit = allFeatures.reduce((acc, f) => acc + f.limit, 0);
  const totalRemaining = Math.max(0, totalLimit - totalUsed);

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && closeLimitModal()}>
      <DialogContent
        className={cn(
          "border-[rgba(55,50,47,0.14)] bg-[#FFFEFC] p-6 text-[#18181B] shadow-lifted sm:rounded-2xl transition-all",
          viewAll ? "max-w-2xl max-h-[90vh] overflow-y-auto" : "max-w-md"
        )}
      >
        {viewAll ? (
          <>
            <DialogHeader className="flex flex-col items-center text-center space-y-2">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-[rgba(55,50,47,0.12)] bg-[#F4F1EC] text-[#18181B] shadow-2xs">
                <Layers className="h-6 w-6 text-[#18181B]" />
              </div>

              <DialogTitle className="text-xl font-semibold tracking-tight text-[#18181B]">
                Monthly Feature Limits & Quotas
              </DialogTitle>

              <DialogDescription className="text-xs leading-relaxed text-[#787774] max-w-md">
                Every CVPilot account receives dedicated monthly quota allocations. Fixed limits automatically renew each month.
              </DialogDescription>
            </DialogHeader>

            {/* Quota overview strip */}
            <div className="mt-4 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-[rgba(55,50,47,0.10)] bg-[#FBFAF7] px-4 py-3 text-xs">
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-[#18181B]" />
                <span className="text-[#49443E]">
                  Resets on <strong className="text-[#18181B]">{formattedResetDate}</strong>
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className="font-medium text-[#49443E]">Overall Status:</span>
                <span
                  className={cn(
                    "font-semibold px-2 py-0.5 rounded-full text-[11px]",
                    totalRemaining > 0
                      ? "bg-emerald-500/10 text-emerald-700"
                      : "bg-rose-500/10 text-rose-700"
                  )}
                >
                  {totalRemaining} credits left
                </span>
              </div>
            </div>

            {/* All feature limits grid */}
            <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
              {allFeatures.map((f) => {
                const isItemExhausted = f.remaining <= 0;
                return (
                  <div
                    key={f.key}
                    className={cn(
                      "flex flex-col justify-between rounded-xl border p-3.5 transition-colors",
                      isItemExhausted
                        ? "border-rose-200 bg-rose-50/30"
                        : "border-[rgba(55,50,47,0.08)] bg-[#FBFAF7] hover:border-[rgba(55,50,47,0.16)]"
                    )}
                  >
                    <div>
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-white border border-[rgba(55,50,47,0.08)] shadow-2xs">
                            <f.Icon className="h-3.5 w-3.5 text-[#18181B]" />
                          </div>
                          <span className="text-xs font-semibold text-[#18181B]">{f.label}</span>
                        </div>
                        <span
                          className={cn(
                            "text-[11px] font-bold px-2 py-0.5 rounded-full shrink-0",
                            isItemExhausted
                              ? "bg-rose-500/10 text-rose-700"
                              : "bg-emerald-500/10 text-emerald-700"
                          )}
                        >
                          {f.remaining} left
                        </span>
                      </div>
                      <p className="mt-1 text-[11px] text-[#787774] line-clamp-1">
                        {f.description}
                      </p>
                    </div>

                    <div className="mt-3">
                      <div className="flex justify-between text-[10.5px] text-[#787774] font-mono">
                        <span>{f.used} / {f.limit} {f.unit} used</span>
                        <span
                          className={
                            isItemExhausted
                              ? "text-rose-600 font-semibold"
                              : "text-emerald-700 font-semibold"
                          }
                        >
                          {f.percentage}%
                        </span>
                      </div>
                      <div className="mt-1.5 h-1.5 w-full overflow-hidden rounded-full bg-[#E8E5DF]">
                        <div
                          className={cn(
                            "h-full rounded-full transition-all duration-300",
                            isItemExhausted
                              ? "bg-rose-500"
                              : f.percentage >= 80
                                ? "bg-amber-500"
                                : "bg-emerald-600"
                          )}
                          style={{ width: `${Math.max(f.percentage, 4)}%` }}
                        />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            <DialogFooter className="mt-5 flex flex-col-reverse gap-2 sm:flex-row sm:justify-between items-center">
              <Link
                to="/resume-vault"
                onClick={() => closeLimitModal()}
                className="inline-flex items-center justify-center gap-1.5 rounded-lg border border-[rgba(55,50,47,0.12)] bg-white px-3.5 py-2 text-xs font-medium text-[#18181B] hover:bg-[#F7F5F0] transition-colors"
              >
                <FileText className="h-3.5 w-3.5" />
                Resume Vault
              </Link>
              <Button
                type="button"
                onClick={closeLimitModal}
                className="w-full sm:w-auto rounded-lg bg-[#18181B] px-5 py-2 text-xs font-medium text-white hover:bg-[#27272A] shadow-xs cursor-pointer"
              >
                Done
              </Button>
            </DialogFooter>
          </>
        ) : (
          <>
            <DialogHeader className="flex flex-col items-center text-center space-y-3">
              <div
                className={`flex h-12 w-12 items-center justify-center rounded-2xl border shadow-2xs ${
                  isExhausted
                    ? "bg-rose-500/10 text-rose-600 border-rose-500/20"
                    : "bg-emerald-500/10 text-emerald-600 border-emerald-500/20"
                }`}
              >
                {isExhausted ? (
                  <ShieldAlert className="h-6 w-6 text-rose-600" />
                ) : (
                  <Layers className="h-6 w-6 text-[#18181B]" />
                )}
              </div>

              <DialogTitle className="text-lg font-semibold tracking-tight text-[#18181B]">
                {featureTitle}
              </DialogTitle>

              <DialogDescription className="text-xs leading-relaxed text-[#787774]">
                {data?.message ||
                  (isExhausted
                    ? `You have reached your monthly allocation of ${limit} ${unit} for this feature. All user accounts receive fixed monthly credits.`
                    : `You currently have ${remaining} of ${limit} ${unit} available this month. Limits reset automatically each month.`)}
              </DialogDescription>
            </DialogHeader>

            {/* Quota breakdown box */}
            <div className="mt-4 rounded-xl border border-[rgba(55,50,47,0.08)] bg-[#FBFAF7] p-4 space-y-3">
              <div className="flex items-center justify-between text-xs">
                <span className="font-medium text-[#49443E]">Monthly Quota</span>
                <span
                  className={cn(
                    "font-semibold",
                    isExhausted ? "text-rose-600" : "text-emerald-600"
                  )}
                >
                  {isExhausted ? (
                    <>0 / {limit} {unit} left ({used} used)</>
                  ) : (
                    <>{remaining} / {limit} {unit} left</>
                  )}
                </span>
              </div>

              <div className="h-2 w-full overflow-hidden rounded-full bg-[#E8E5DF]">
                <div
                  className={cn(
                    "h-full rounded-full transition-all duration-300",
                    isExhausted
                      ? "w-full bg-rose-500"
                      : percentage >= 80
                        ? "bg-amber-500"
                        : "bg-emerald-600"
                  )}
                  style={{ width: isExhausted ? "100%" : `${Math.max(percentage, 8)}%` }}
                />
              </div>

              <div className="flex items-center justify-between pt-1 text-[11.5px] text-[#787774]">
                <div className="flex items-center gap-1.5">
                  <Calendar className="h-3.5 w-3.5 text-[#18181B]" />
                  <span>
                    Resets on <strong className="text-[#18181B]">{formattedResetDate}</strong>
                  </span>
                </div>
                <span
                  className={cn(
                    "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10.5px] font-medium",
                    isExhausted
                      ? "bg-rose-500/10 text-rose-700"
                      : "bg-emerald-500/10 text-emerald-700"
                  )}
                >
                  <CheckCircle2 className="h-3 w-3" /> Auto-Renew
                </span>
              </div>
            </div>

            {/* Policy notice */}
            <div className="mt-3 rounded-lg bg-[#F4F1EC] p-3 text-[11.5px] leading-normal text-[#49443E]">
              <p>
                💡 <strong>Did you know?</strong> You can still view, manage, and download all your previously generated resumes and ATS reports anytime in your Vault.
              </p>
            </div>

            <DialogFooter className="mt-5 flex flex-col-reverse gap-2 sm:flex-row sm:justify-between items-center">
              <button
                type="button"
                onClick={() => setViewAll(true)}
                className="inline-flex items-center gap-1.5 text-xs font-medium text-[#18181B]/70 hover:text-[#18181B] transition-colors cursor-pointer"
              >
                <Layers className="h-3.5 w-3.5" />
                View all limits
              </button>

              <div className="flex items-center gap-2">
                <Link
                  to="/resume-vault"
                  onClick={() => closeLimitModal()}
                  className="inline-flex items-center justify-center gap-1.5 rounded-lg border border-[rgba(55,50,47,0.12)] bg-white px-3.5 py-2 text-xs font-medium text-[#18181B] hover:bg-[#F7F5F0] transition-colors"
                >
                  <FileText className="h-3.5 w-3.5" />
                  Vault
                </Link>
                <Button
                  type="button"
                  onClick={closeLimitModal}
                  className="rounded-lg bg-[#18181B] px-4 py-2 text-xs font-medium text-white hover:bg-[#27272A] shadow-xs cursor-pointer"
                >
                  Got it
                </Button>
              </div>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}

