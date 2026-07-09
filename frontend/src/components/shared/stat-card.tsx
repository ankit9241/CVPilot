import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface StatCardProps {
  label: string;
  value: string;
  hint?: string;
  icon?: LucideIcon;
  trend?: "up" | "down" | "neutral";
  className?: string;
}

export function StatCard({ label, value, hint, icon: Icon, trend, className }: StatCardProps) {
  const trendColor =
    trend === "up"
      ? "text-success"
      : trend === "down"
        ? "text-destructive"
        : "text-muted-foreground";
  return (
    <div
      className={cn(
        "rounded-xl border border-border bg-card p-5 shadow-subtle transition-all hover:-translate-y-0.5 hover:shadow-soft",
        className,
      )}
    >
      <div className="flex items-center justify-between">
        <span className="text-[12px] font-medium uppercase tracking-wider text-muted-foreground">
          {label}
        </span>
        {Icon && <Icon className="h-4 w-4 text-muted-foreground" />}
      </div>
      <div className="mt-3 text-[26px] font-semibold tracking-tight text-foreground">{value}</div>
      {hint && <p className={cn("mt-1 text-[12px]", trendColor)}>{hint}</p>}
    </div>
  );
}
