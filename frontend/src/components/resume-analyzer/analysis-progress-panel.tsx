import { motion } from "framer-motion";
import { CheckCircle2, AlertCircle, Loader2, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export type StepStatus = "pending" | "active" | "completed" | "error";

export interface AnalysisStepItem {
  id: string;
  label: string;
  status: StepStatus;
  errorDetail?: string;
}

export const INITIAL_ANALYSIS_STEPS: Omit<AnalysisStepItem, "status" | "errorDetail">[] = [
  { id: "uploading", label: "Uploading resume" },
  { id: "extracting", label: "Extracting resume content" },
  { id: "parsing", label: "Parsing resume sections" },
  { id: "analyzing", label: "Analyzing experience, projects & skills" },
  { id: "ats", label: "Running ATS compatibility analysis" },
  { id: "quality", label: "Reviewing resume quality" },
  { id: "recruiter", label: "Generating recruiter feedback" },
  { id: "report", label: "Preparing your final report" },
];

interface AnalysisProgressPanelProps {
  steps: AnalysisStepItem[];
  hasError: boolean;
  errorMessage?: string | null;
  onRetry: () => void;
}

export function AnalysisProgressPanel({
  steps,
  hasError,
  errorMessage,
  onRetry,
}: AnalysisProgressPanelProps) {
  const activeStep = steps.find((s) => s.status === "active");
  const completedCount = steps.filter((s) => s.status === "completed").length;

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -12 }}
      transition={{ duration: 0.25, ease: "easeOut" }}
      className="flex flex-col rounded-2xl border border-border bg-card p-6 shadow-subtle min-h-[460px] justify-between"
      role="region"
      aria-label="Resume Analysis Progress"
    >
      {/* Screen Reader Live Region */}
      <div className="sr-only" aria-live="polite" aria-atomic="true">
        {hasError
          ? `Analysis encountered an error: ${errorMessage || "Some analysis couldn't be completed."}`
          : activeStep
            ? `Analyzing step: ${activeStep.label}`
            : `Completed ${completedCount} of ${steps.length} analysis stages.`}
      </div>

      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border/60 pb-4">
          <div className="space-y-0.5">
            <h3 className="text-[16px] font-semibold text-foreground tracking-tight flex items-center gap-2">
              Analyzing your resume
              {!hasError && (
                <span className="inline-flex h-2 w-2 rounded-full bg-primary animate-pulse" />
              )}
            </h3>
            <p className="text-[12px] text-muted-foreground">
              Automated ATS evaluation, writing quality, and recruiter review
            </p>
          </div>
          <div className="text-[11.5px] font-mono font-medium text-muted-foreground bg-muted/50 px-2.5 py-1 rounded-md border border-border/50">
            {completedCount}/{steps.length} stages
          </div>
        </div>

        {/* Steps List */}
        <ul className="space-y-2.5 font-sans" role="list">
          {steps.map((step) => {
            const isCompleted = step.status === "completed";
            const isActive = step.status === "active";
            const isError = step.status === "error";

            return (
              <motion.li
                key={step.id}
                initial={false}
                animate={{
                  backgroundColor: isActive
                    ? "var(--muted-bg, rgba(var(--primary-rgb, 59 130 246), 0.04))"
                    : "transparent",
                }}
                className={cn(
                  "flex items-center justify-between rounded-xl px-3.5 py-2.5 transition-colors border border-transparent",
                  isActive && "border-primary/20 bg-primary/[0.03]",
                  isError && "border-destructive/20 bg-destructive/[0.03]",
                )}
                aria-current={isActive ? "step" : undefined}
              >
                <div className="flex items-center gap-3 min-w-0">
                  {/* Status Indicator Icon */}
                  <div
                    className={cn(
                      "flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[11px] font-mono font-medium transition-all",
                      isCompleted && "bg-success/15 text-success border border-success/30",
                      isActive && "bg-primary/15 text-primary border border-primary/30",
                      isError && "bg-destructive/15 text-destructive border border-destructive/30",
                      step.status === "pending" &&
                        "border border-border text-muted-foreground/40 bg-muted/30",
                    )}
                  >
                    {isCompleted ? (
                      <CheckCircle2 className="h-3.5 w-3.5 stroke-[2.5]" />
                    ) : isActive ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin stroke-[2.5]" />
                    ) : isError ? (
                      <AlertCircle className="h-3.5 w-3.5 stroke-[2.5]" />
                    ) : (
                      <span className="h-1.5 w-1.5 rounded-full bg-muted-foreground/30" />
                    )}
                  </div>

                  {/* Step Label */}
                  <span
                    className={cn(
                      "text-[13px] font-medium truncate transition-colors",
                      isCompleted && "text-foreground",
                      isActive && "text-primary font-semibold",
                      isError && "text-destructive font-medium",
                      step.status === "pending" && "text-muted-foreground/60 font-normal",
                    )}
                  >
                    {step.label}
                  </span>
                </div>

                {/* Status Text / Error Badge */}
                <div className="ml-3 shrink-0">
                  {isCompleted && (
                    <span className="text-[11px] text-success font-medium flex items-center gap-1">
                      <span className="sr-only">Status: </span>Done
                    </span>
                  )}
                  {isActive && (
                    <span className="text-[11px] text-primary font-medium animate-pulse">
                      In progress...
                    </span>
                  )}
                  {isError && (
                    <span className="text-[11.5px] text-destructive font-medium">
                      Failed
                    </span>
                  )}
                </div>
              </motion.li>
            );
          })}
        </ul>
      </div>

      {/* Error Callout & Retry Section */}
      {hasError && (
        <motion.div
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-6 rounded-xl border border-destructive/30 bg-destructive/5 p-4 space-y-3"
        >
          <div className="flex items-start gap-2.5">
            <AlertCircle className="h-4 w-4 text-destructive shrink-0 mt-0.5" />
            <div className="space-y-1">
              <h4 className="text-[13px] font-semibold text-destructive">
                Some analysis couldn't be completed.
              </h4>
              <p className="text-[12px] text-muted-foreground leading-relaxed">
                {errorMessage || "An error occurred while connecting to the assessment engines."}
              </p>
            </div>
          </div>

          <div className="pt-1 flex justify-end">
            <Button
              onClick={onRetry}
              variant="outline"
              size="sm"
              className="h-8 gap-1.5 text-[12px] font-medium border-destructive/30 hover:bg-destructive/10 text-destructive hover:text-destructive"
            >
              <RefreshCw className="h-3.5 w-3.5" /> Retry Analysis
            </Button>
          </div>
        </motion.div>
      )}
    </motion.div>
  );
}
