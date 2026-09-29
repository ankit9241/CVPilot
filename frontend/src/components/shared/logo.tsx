import React from "react";

interface LogoProps {
  size?: "sm" | "md" | "lg" | "xl";
  showText?: boolean;
  showSubtitle?: boolean;
  className?: string;
}

/**
 * Pure bespoke SVG icon for CVPilot.
 * A precision-engineered supersonic flight mark merging resume elevation with pilot navigation.
 */
export function CVPilotIcon({
  size = 20,
  className = "",
}: {
  size?: number;
  className?: string;
}) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      <defs>
        <linearGradient id="cvpilot-wing-l" x1="4" y1="4" x2="12" y2="20" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#FFFFFF" />
          <stop offset="100%" stopColor="#E4E4E7" />
        </linearGradient>
        <linearGradient id="cvpilot-wing-r" x1="12" y1="4" x2="20" y2="20" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#D4D4D8" />
          <stop offset="100%" stopColor="#A1A1AA" />
        </linearGradient>
        <linearGradient id="cvpilot-core" x1="12" y1="6" x2="12" y2="15" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#60A5FA" />
          <stop offset="100%" stopColor="#2563EB" />
        </linearGradient>
      </defs>

      {/* Left Wing Facet */}
      <path
        d="M12 2.5L3.5 19.5L12 15.5V2.5Z"
        fill="url(#cvpilot-wing-l)"
      />

      {/* Right Wing Facet (Shaded Depth) */}
      <path
        d="M12 2.5L20.5 19.5L12 15.5V2.5Z"
        fill="url(#cvpilot-wing-r)"
      />

      {/* Center Crease / Spine Highlight */}
      <path
        d="M12 2.5V15.5"
        stroke="#FFFFFF"
        strokeWidth="0.75"
        strokeLinecap="round"
        opacity="0.8"
      />

      {/* Dynamic Navigation Core / Radar Arrow */}
      <path
        d="M12 6.5L15.2 13.8L12 12.2L8.8 13.8L12 6.5Z"
        fill="url(#cvpilot-core)"
      />

      {/* Speed Exhaust Jet Point */}
      <circle cx="12" cy="18.2" r="0.9" fill="#60A5FA" opacity="0.9" />
    </svg>
  );
}

/**
 * Brand Logo Icon inside a polished squircle tile.
 */
export function LogoIcon({
  size = "md",
  className = "",
}: {
  size?: "sm" | "md" | "lg" | "xl";
  className?: string;
}) {
  const containerSizes = {
    sm: "h-6 w-6 sm:h-7 sm:w-7 rounded-md",
    md: "h-7 w-7 sm:h-8 sm:w-8 rounded-lg",
    lg: "h-9 w-9 sm:h-10 sm:w-10 rounded-xl",
    xl: "h-12 w-12 rounded-2xl",
  }[size];

  const iconSizes = {
    sm: 14,
    md: 17,
    lg: 21,
    xl: 26,
  }[size];

  return (
    <div
      className={`relative grid place-items-center bg-[#18181B] text-white shadow-lifted border border-white/10 shrink-0 transition-transform duration-200 group-hover:scale-105 ${containerSizes} ${className}`}
    >
      <CVPilotIcon size={iconSizes} className="transform -rotate-12 transition-transform duration-300 group-hover:rotate-0" />
    </div>
  );
}

/**
 * Complete CVPilot Brand Lockup (Icon + Typography + Subtitle).
 */
export function CVPilotLogo({
  size = "md",
  showText = true,
  showSubtitle = false,
  className = "",
}: LogoProps) {
  const textSizes = {
    sm: "text-lg",
    md: "text-xl",
    lg: "text-2xl",
    xl: "text-3xl",
  }[size];

  return (
    <div className={`flex items-center gap-2.5 select-none group ${className}`}>
      <LogoIcon size={size} />
      {showText && (
        <div className="flex min-w-0 flex-col">
          <span
            className={`font-serif font-medium tracking-tight text-[#18181B] leading-none ${textSizes}`}
          >
            CVPilot
          </span>
          {showSubtitle && (
            <span className="mt-0.5 truncate text-[9.5px] font-mono font-medium uppercase tracking-[0.14em] text-[#18181B]/50">
              Resume Intelligence
            </span>
          )}
        </div>
      )}
    </div>
  );
}

export default CVPilotLogo;
