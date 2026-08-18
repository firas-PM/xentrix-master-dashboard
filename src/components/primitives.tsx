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
    <div className="flex items-start justify-between gap-4 px-8 pt-8 pb-6 border-b border-neutral-900">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
        {subtitle && <p className="text-sm text-neutral-400 mt-1">{subtitle}</p>}
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
        "rounded-lg border border-neutral-900 bg-neutral-950/60 p-5",
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
      <div className="text-xs uppercase tracking-wide text-neutral-500">{label}</div>
      <div className="text-3xl font-semibold">{value}</div>
      {hint && <div className="text-xs text-neutral-500">{hint}</div>}
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
    <div className="border border-dashed border-neutral-900 rounded-lg py-16 text-center">
      <div className="text-sm text-neutral-300">{title}</div>
      {hint && <div className="text-xs text-neutral-500 mt-1">{hint}</div>}
    </div>
  );
}

export function Pill({
  children,
  tone = "neutral",
}: {
  children: React.ReactNode;
  tone?: "neutral" | "green" | "amber" | "red" | "blue" | "violet";
}) {
  const tones: Record<string, string> = {
    neutral: "bg-neutral-900 text-neutral-300 border-neutral-800",
    green: "bg-emerald-500/10 text-emerald-300 border-emerald-500/20",
    amber: "bg-amber-500/10 text-amber-300 border-amber-500/20",
    red: "bg-red-500/10 text-red-300 border-red-500/20",
    blue: "bg-sky-500/10 text-sky-300 border-sky-500/20",
    violet: "bg-violet-500/10 text-violet-300 border-violet-500/20",
  };
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] uppercase tracking-wide",
        tones[tone]
      )}
    >
      {children}
    </span>
  );
}
