import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

interface PageHeaderProps {
  title: string;
  subtitle?: string;
  actions?: ReactNode;
  className?: string;
}

export function PageHeader({ title, subtitle, actions, className }: PageHeaderProps) {
  return (
    <div
      className={cn(
        "grid grid-cols-[minmax(0,1fr)_auto] items-start gap-4 border-b border-border pb-6",
        className,
      )}
    >
      <div className="min-w-0">
        <h1 className="truncate font-serif text-[28px] font-normal tracking-tight text-foreground sm:text-[34px] leading-tight">
          {title}
        </h1>
        {subtitle && (
          <p className="mt-1 text-[14px] leading-relaxed text-muted-foreground">{subtitle}</p>
        )}
      </div>
      {actions && <div className="flex shrink-0 items-center gap-2">{actions}</div>}
    </div>
  );
}
