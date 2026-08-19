import Link from "next/link";
import { getBrandBySlug } from "@/lib/brands";
import { getBrandUtilization } from "@/lib/queries";
import { PageHeader, Card, EmptyState } from "@/components/primitives";

const RANGES: { key: string; days: number; label: string }[] = [
  { key: "7", days: 7, label: "7d" },
  { key: "30", days: 30, label: "30d" },
  { key: "90", days: 90, label: "90d" },
];

export default async function UtilizationPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ range?: string }>;
}) {
  const { slug } = await params;
  const { range } = await searchParams;
  const chosen = RANGES.find((r) => r.key === range) ?? RANGES[0];

  const brand = await getBrandBySlug(slug);
  const rows = await getBrandUtilization(brand._id, chosen.days);
  const maxOpen = Math.max(1, ...rows.map((r) => r.open));

  return (
    <div>
      <PageHeader
        title="Team utilization"
        subtitle={`Open + overdue now, and shipped in the last ${chosen.days} days for ${brand.name}.`}
      >
        <div className="flex items-center gap-1 border border-[var(--border)] rounded-md p-0.5 bg-[var(--bg-elevated)]">
          {RANGES.map((r) => {
            const isActive = r.key === chosen.key;
            return (
              <Link
                key={r.key}
                href={`/b/${slug}/utilization?range=${r.key}`}
                className={
                  "text-xs font-semibold px-2.5 py-1 rounded transition " +
                  (isActive
                    ? "bg-[var(--accent)] text-[var(--accent-ink)]"
                    : "text-[var(--text-muted)] hover:text-[var(--text)]")
                }
              >
                {r.label}
              </Link>
            );
          })}
        </div>
      </PageHeader>
      <div className="p-8">
        {rows.length === 0 ? (
          <EmptyState
            title="Nothing assigned yet"
            hint="Assign tasks to people and this view will fill in automatically."
          />
        ) : (
          <Card className="p-0 overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[var(--border)] bg-[var(--bg-sunken)]">
                  <Th className="w-[35%]">Member</Th>
                  <Th className="text-right">Open</Th>
                  <Th className="text-right">Overdue</Th>
                  <Th className="text-right">Done {chosen.days}d</Th>
                  <Th className="w-[30%]">Load</Th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r) => (
                  <tr key={r.userId} className="border-b border-[var(--border)] last:border-b-0">
                    <Td>
                      <div className="font-medium">{r.name}</div>
                      <div className="text-[11px] text-[var(--text-subtle)]">{r.email}</div>
                    </Td>
                    <Td className="text-right tabular-nums font-semibold">{r.open}</Td>
                    <Td className="text-right tabular-nums">
                      {r.overdue > 0 ? (
                        <span className="text-[var(--danger)] font-semibold">{r.overdue}</span>
                      ) : (
                        <span className="text-[var(--text-subtle)]">0</span>
                      )}
                    </Td>
                    <Td className="text-right tabular-nums">
                      {r.done7d > 0 ? (
                        <span className="text-[var(--success)] font-semibold">{r.done7d}</span>
                      ) : (
                        <span className="text-[var(--text-subtle)]">0</span>
                      )}
                    </Td>
                    <Td>
                      <div className="h-2 rounded-full bg-[var(--bg-sunken)] overflow-hidden">
                        <div
                          className="h-full bg-[var(--accent)]"
                          style={{
                            width: `${Math.max(4, (r.open / maxOpen) * 100)}%`,
                          }}
                        />
                      </div>
                    </Td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Card>
        )}
      </div>
    </div>
  );
}

function Th({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <th
      className={`px-4 py-2 text-left text-[10px] uppercase tracking-wider font-semibold text-[var(--text-muted)] ${className ?? ""}`}
    >
      {children}
    </th>
  );
}

function Td({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return <td className={`px-4 py-3 align-middle ${className ?? ""}`}>{children}</td>;
}
