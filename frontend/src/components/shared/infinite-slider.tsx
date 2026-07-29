import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

interface InfiniteSliderProps {
  children: ReactNode;
  gap?: number;
  speed?: number;
  className?: string;
  reverse?: boolean;
}

export function InfiniteSlider({
  children,
  gap = 64,
  speed = 30,
  className,
  reverse = false,
}: InfiniteSliderProps) {
  return (
    <div className={cn("overflow-hidden select-none flex w-full", className)}>
      <div
        className={cn(
          "flex shrink-0 items-center justify-around gap-12 min-w-full animate-marquee",
          reverse && "animate-marquee-reverse",
        )}
        style={{
          gap: `${gap}px`,
          animationDuration: `${speed}s`,
        }}
      >
        {children}
        {children}
      </div>
      <div
        aria-hidden
        className={cn(
          "flex shrink-0 items-center justify-around gap-12 min-w-full animate-marquee",
          reverse && "animate-marquee-reverse",
        )}
        style={{
          gap: `${gap}px`,
          animationDuration: `${speed}s`,
        }}
      >
        {children}
        {children}
      </div>
    </div>
  );
}
