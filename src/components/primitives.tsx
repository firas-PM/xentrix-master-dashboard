import { cn } from "@/lib/utils";

export function PageHeader({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle?: string;
  children?: React.ReactNode;
}) {
  return (
    <div className="flex items-start justify-between gap-4 px-8 pt-8 pb-6 border-b border-[var(--border)] bg-[var(--bg-elevated)]">
      <div>
        <h1 className="text-3xl font-black tracking-tight text-[var(--text)]">
          {title}
        </h1>
        {subtitle && (
          <p className="text-sm text-[var(--text-muted)] mt-1">{subtitle}</p>
        )}
      </div>
      {children && <div className="flex items-center gap-2">{children}</div>}
    </div>
  );
}

export function Card({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "rounded-lg border border-[var(--border)] bg-[var(--bg-elevated)] p-5 shadow-[0_1px_0_rgba(17,17,17,0.02)]",
        className
      )}
    >
      {children}
    </div>
  );
}

export function StatTile({
  label,
  value,
  hint,
}: {
  label: string;
  value: string | number;
  hint?: string;
}) {
  return (
    <Card className="flex flex-col gap-1">
      <div className="text-[11px] uppercase tracking-wider text-[var(--text-muted)] font-medium">
        {label}
      </div>
      <div className="text-4xl font-black tracking-tight text-[var(--accent-ink)] leading-none mt-1">
        <span className="text-[var(--accent)]">{value}</span>
      </div>
      {hint && (
        <div className="text-xs text-[var(--text-subtle)] mt-1">{hint}</div>
      )}
    </Card>
  );
}

export function EmptyState({
  title,
  hint,
}: {
  title: string;
  hint?: string;
}) {
  return (
    <div className="border border-dashed border-[var(--border-strong)] bg-[var(--bg-sunken)] rounded-lg py-16 text-center">
      <div className="text-sm text-[var(--text)] font-medium">{title}</div>
      {hint && (
        <div className="text-xs text-[var(--text-subtle)] mt-1">{hint}</div>
      )}
    </div>
  );
}

export function Skeleton({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        "animate-pulse rounded-md bg-[var(--bg-sunken)]",
        className
      )}
    />
  );
}

export function PageSkeleton({
  title,
  showStats = true,
  rows = 4,
}: {
  title?: string;
  showStats?: boolean;
  rows?: number;
}) {
  return (
    <div>
      <div className="flex items-start justify-between gap-4 px-8 pt-8 pb-6 border-b border-[var(--border)] bg-[var(--bg-elevated)]">
        <div className="space-y-2">
          {title ? (
            <h1 className="text-3xl font-black tracking-tight text-[var(--text)]">
              {title}
            </h1>
          ) : (
            <Skeleton className="h-8 w-56" />
          )}
          <Skeleton className="h-4 w-72" />
        </div>
      </div>
      <div className="p-8 space-y-6">
        {showStats && (
          <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div
                key={i}
                className="rounded-lg border border-[var(--border)] bg-[var(--bg-elevated)] p-5 space-y-3"
              >
                <Skeleton className="h-3 w-20" />
                <Skeleton className="h-10 w-16" />
              </div>
            ))}
          </div>
        )}
        <div className="space-y-2">
          {Array.from({ length: rows }).map((_, i) => (
            <div
              key={i}
              className="rounded-lg border border-[var(--border)] bg-[var(--bg-elevated)] p-4 flex items-center gap-3"
            >
              <Skeleton className="h-5 w-16 rounded-full" />
              <Skeleton className="h-4 flex-1" />
              <Skeleton className="h-5 w-14 rounded-full" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export function Pill({
  children,
  tone = "neutral",
}: {
  children: React.ReactNode;
  tone?: "neutral" | "gold" | "green" | "amber" | "red" | "blue" | "violet";
}) {
  const tones: Record<string, string> = {
    neutral:
      "bg-[var(--bg-sunken)] text-[var(--text-muted)] border-[var(--border-strong)]",
    gold: "bg-[#FFC80122] text-[#8A5A00] border-[#FFC80166]",
    green: "bg-[#1F7A3A15] text-[#1F7A3A] border-[#1F7A3A44]",
    amber: "bg-[#FFC80122] text-[#8A5A00] border-[#FFC80166]",
    red: "bg-[#B3261E12] text-[#B3261E] border-[#B3261E44]",
    /* blue + violet folded into gold — Xentrix palette forbids cool tones */
    blue: "bg-[#FFC80122] text-[#8A5A00] border-[#FFC80166]",
    violet: "bg-[var(--bg-sunken)] text-[var(--text)] border-[var(--border-strong)]",
  };
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] uppercase tracking-wide font-medium",
        tones[tone]
      )}
    >
      {children}
    </span>
  );
}
