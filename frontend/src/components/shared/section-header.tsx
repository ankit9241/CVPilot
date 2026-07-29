import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

interface SectionHeaderProps {
  eyebrow?: string;
  title: string;
  description?: string;
  actions?: ReactNode;
  className?: string;
  align?: "left" | "center";
}

export function SectionHeader({
  eyebrow,
  title,
  description,
  actions,
  className,
  align = "left",
}: SectionHeaderProps) {
  return (
    <div
      className={cn(
        "flex flex-col gap-3",
        align === "center" && "items-center text-center",
        actions && align === "left" && "sm:flex-row sm:items-end sm:justify-between",
        className,
      )}
    >
      <div className={cn("max-w-2xl", align === "center" && "mx-auto")}>
        {eyebrow && (
          <div className="inline-flex items-center mb-3">
            <span className="editorial-pill">
              {eyebrow}
            </span>
          </div>
        )}
        <h2 className="font-serif text-[32px] sm:text-[42px] font-normal tracking-tight text-foreground leading-[1.12]">
          {title}
        </h2>
        {description && (
          <p className="mt-3 text-[15px] sm:text-[17px] leading-relaxed text-muted-foreground font-sans font-normal">
            {description}
          </p>
        )}
      </div>
      {actions && <div className="flex shrink-0 items-center gap-2 mt-2 sm:mt-0">{actions}</div>}
    </div>
  );
}
