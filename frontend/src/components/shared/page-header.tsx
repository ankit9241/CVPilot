import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

interface PageHeaderProps {
  category?: string;
  eyebrow?: string;
  title: string;
  subtitle?: string;
  description?: string;
  actions?: ReactNode;
  className?: string;
  align?: "left" | "center";
}

export function PageHeader({
  category,
  eyebrow,
  title,
  subtitle,
  description,
  actions,
  className,
  align = "left",
}: PageHeaderProps) {
  const badgeText = category || eyebrow || "WORKSPACE";
  const subText = subtitle || description;

  return (
    <div
      className={cn(
        "relative pt-6 pb-8 border-b border-[rgba(55,50,47,0.10)] mb-8 overflow-hidden",
        align === "center" && "text-center",
        className,
      )}
    >
      {/* Ambient warm radial glow effect matching landing page hero */}
      <div className="absolute top-1/2 left-1/4 -translate-x-1/2 -translate-y-1/2 w-[320px] sm:w-[500px] h-[160px] sm:h-[220px] ambient-glow pointer-events-none rounded-full blur-2xl -z-10 opacity-70" />

      <div className={cn("flex flex-col gap-4 relative z-10", align === "center" && "items-center")}>
        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
          <div className="max-w-3xl">
            <div className="inline-flex items-center mb-3">
              <span className="editorial-pill">
                <span className="h-1.5 w-1.5 rounded-full bg-[#18181B]" />
                {badgeText}
              </span>
            </div>
            <h1 className="font-serif text-[36px] sm:text-[48px] lg:text-[54px] font-normal leading-[1.08] tracking-tight text-[#18181B]">
              {title}
            </h1>
            {subText && (
              <p className="mt-3 text-[15px] sm:text-[17px] leading-relaxed text-[#18181B]/70 font-sans font-normal max-w-2xl">
                {subText}
              </p>
            )}
          </div>
          {actions && (
            <div className="flex shrink-0 items-center gap-2.5 sm:pb-1">
              {actions}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
