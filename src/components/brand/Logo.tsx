import { useId } from "react";

import { cn } from "@/lib/utils";

/** Crescent moon mark of 3awedhni. */
export function LogoMark({ className }: { className?: string }) {
  const uid = useId().replace(/:/g, "");
  return (
    <svg viewBox="0 0 48 48" className={cn("h-10 w-10 shrink-0", className)} aria-hidden="true">
      <defs>
        <linearGradient id={`${uid}-g`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="var(--primary)" />
          <stop offset="100%" stopColor="var(--primary-deep)" />
        </linearGradient>
        <mask id={`${uid}-m`}>
          <rect width="48" height="48" fill="white" />
          <circle cx="31" cy="17" r="15" fill="black" />
        </mask>
      </defs>
      <circle cx="22" cy="25" r="19" fill={`url(#${uid}-g)`} mask={`url(#${uid}-m)`} />
      <circle cx="38" cy="33" r="2.6" fill="var(--primary)" />
    </svg>
  );
}

export function Logo({ className, compact = false }: { className?: string; compact?: boolean }) {
  return (
    <div className={cn("flex items-center gap-2.5", className)}>
      <LogoMark />
      {!compact && (
        <div className="leading-none">
          <div className="flex items-baseline gap-1.5 font-display text-xl font-bold text-ink">
            3awedhni
            <span lang="ar" className="text-lg font-semibold text-primary">
              عوضني
            </span>
          </div>
          <div className="mt-1 whitespace-nowrap text-[0.6rem] font-semibold uppercase tracking-[0.1em] text-muted-foreground">
            Continuité post-consultation
          </div>
        </div>
      )}
    </div>
  );
}
