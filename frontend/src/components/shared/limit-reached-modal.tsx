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
import { ShieldAlert, Calendar, Sparkles, CheckCircle2, FileText } from "lucide-react";
import { Link } from "@tanstack/react-router";

export function LimitReachedModal() {
  const { isOpen, data, closeLimitModal } = useLimitModalStore();
  const { nextResetDate, getFeatureQuota } = useUsage();

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

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && closeLimitModal()}>
      <DialogContent className="max-w-md border-[rgba(55,50,47,0.14)] bg-[#FFFEFC] p-6 text-[#18181B] shadow-lifted sm:rounded-2xl">
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
              <Sparkles className="h-6 w-6 text-emerald-600" />
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
              className={`font-semibold ${
                isExhausted ? "text-rose-600" : "text-emerald-600"
              }`}
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
              className={`h-full rounded-full transition-all duration-300 ${
                isExhausted
                  ? "w-full bg-rose-500"
                  : percentage >= 80
                    ? "bg-amber-500"
                    : "bg-emerald-500"
              }`}
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
              className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10.5px] font-medium ${
                isExhausted
                  ? "bg-rose-500/10 text-rose-700"
                  : "bg-emerald-500/10 text-emerald-700"
              }`}
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

        <DialogFooter className="mt-5 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
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
            className="rounded-lg bg-[#18181B] px-4 py-2 text-xs font-medium text-white hover:bg-[#27272A] shadow-xs cursor-pointer"
          >
            Got it
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
