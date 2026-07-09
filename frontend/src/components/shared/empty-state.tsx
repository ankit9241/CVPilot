import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description: string;
  action?: ReactNode;
  hint?: string;
  className?: string;
  compact?: boolean;
}

export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
  hint,
  className,
  compact,
}: EmptyStateProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: "easeOut" }}
      className={cn(
        "flex flex-col items-center justify-center rounded-2xl border border-dashed border-border bg-card/60 text-center shadow-subtle",
        compact ? "px-6 py-10" : "px-6 py-14",
        className,
      )}
    >
      <div className="relative">
        <div className="absolute inset-0 -z-10 rounded-2xl bg-primary/10 blur-2xl" />
        <div className="grid h-14 w-14 place-items-center rounded-2xl border border-border bg-background shadow-soft">
          <Icon className="h-6 w-6 text-primary" strokeWidth={1.5} />
        </div>
      </div>
      <h3 className="mt-5 text-[16px] font-semibold tracking-tight text-foreground">{title}</h3>
      <p className="mt-1.5 max-w-md text-[13px] leading-relaxed text-muted-foreground">
        {description}
      </p>
      {action && <div className="mt-6">{action}</div>}
      {hint && (
        <div className="mt-6 inline-flex items-center gap-1.5 rounded-full border border-border bg-background/80 px-2.5 py-1 text-[11px] font-medium text-muted-foreground">
          <span className="h-1.5 w-1.5 rounded-full bg-warning" />
          {hint}
        </div>
      )}
    </motion.div>
  );
}
