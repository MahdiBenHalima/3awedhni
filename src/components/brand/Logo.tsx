import { cn } from "@/lib/utils";

export function LogoMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 48 44" className={cn("h-10 w-10 shrink-0", className)} aria-hidden="true">
      <defs>
        <linearGradient id="awd-heart" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="var(--primary)" />
          <stop offset="100%" stopColor="var(--primary-deep)" />
        </linearGradient>
      </defs>
      <path
        d="M24 42C10 32 2 24 2 14.5 2 7.6 7.4 2 14 2c4.2 0 7.6 2.1 10 5.4C26.4 4.1 29.8 2 34 2c6.6 0 12 5.6 12 12.5C46 24 38 32 24 42Z"
        fill="url(#awd-heart)"
      />
      <path d="M21 12h6v6h6v6h-6v6h-6v-6h-6v-6h6z" fill="var(--primary-foreground)" />
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
          <div className="mt-1 whitespace-nowrap text-[0.6rem] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
            Continuité post-consultation
          </div>
        </div>
      )}
    </div>
  );
}
