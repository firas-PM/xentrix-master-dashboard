import Link from "next/link";
import { requireSession } from "@/lib/access";
import { getMyOpenTasks, type MyTaskRow, type MyTasksBucket } from "@/lib/queries";
import { PageHeader, Card, EmptyState, Pill } from "@/components/primitives";
import { format, formatDistanceToNowStrict } from "date-fns";

const BUCKETS: { key: MyTasksBucket; label: string; tone: string }[] = [
  { key: "overdue", label: "Overdue", tone: "text-[var(--danger)]" },
  { key: "today", label: "Today", tone: "text-[var(--accent-ink)]" },
  { key: "upcoming", label: "This week", tone: "text-[var(--text)]" },
  { key: "someday", label: "No due date", tone: "text-[var(--text-muted)]" },
];

export default async function MyTasksPage() {
  const session = await requireSession();
  const rows = await getMyOpenTasks(session.user.id);
  const grouped = new Map<MyTasksBucket, MyTaskRow[]>();
  for (const b of BUCKETS) grouped.set(b.key, []);
  for (const r of rows) grouped.get(r.bucket)!.push(r);

  const totalCount = rows.length;
  const overdueCount = grouped.get("overdue")!.length;

  return (
    <div>
      <PageHeader
        title="My work"
        subtitle={
          totalCount === 0
            ? "You have nothing assigned to you across any brand."
            : `${totalCount} open task${totalCount === 1 ? "" : "s"} across ${new Set(rows.map((r) => r.brand.slug)).size} brand${new Set(rows.map((r) => r.brand.slug)).size === 1 ? "" : "s"}${overdueCount > 0 ? ` · ${overdueCount} overdue` : ""}.`
        }
      />

      <div className="p-8 space-y-8">
        {rows.length === 0 ? (
          <EmptyState
            title="Inbox zero"
            hint="Nothing is waiting on you right now. Nice."
          />
        ) : (
          BUCKETS.map((b) => {
            const items = grouped.get(b.key)!;
            if (items.length === 0) return null;
            return (
              <section key={b.key}>
                <div className="flex items-baseline justify-between mb-3">
                  <h2 className={`text-xs uppercase tracking-wider font-semibold ${b.tone}`}>
                    {b.label} · {items.length}
                  </h2>
                </div>
                <div className="space-y-2">
                  {items.map((t) => (
                    <Link
                      key={t._id}
                      href={`/b/${t.brand.slug}/tasks/${t._id}`}
                    >
                      <Card className="hover:border-[var(--border-strong)] transition flex items-center gap-3 py-3">
                        <div
                          className="h-8 w-8 shrink-0 rounded-md grid place-items-center text-xs font-semibold"
                          style={{
                            background: `${t.brand.color}22`,
                            color: t.brand.color,
                            border: `1px solid ${t.brand.color}55`,
                          }}
                        >
                          {t.brand.name.slice(0, 1).toUpperCase()}
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="text-sm font-medium truncate">{t.title}</div>
                          <div className="text-[11px] text-[var(--text-subtle)] mt-0.5 flex items-center gap-2">
                            <span>{t.brand.name}</span>
                            <span>·</span>
                            <span className="capitalize">
                              {t.status.replace("_", " ")}
                            </span>
                            {t.dueAt && (
                              <>
                                <span>·</span>
                                <span>
                                  {b.key === "overdue"
                                    ? `${formatDistanceToNowStrict(new Date(t.dueAt))} overdue`
                                    : format(new Date(t.dueAt), "d MMM · HH:mm")}
                                </span>
                              </>
                            )}
                          </div>
                        </div>
                        <Pill
                          tone={
                            t.priority === "urgent"
                              ? "red"
                              : t.priority === "high"
                                ? "gold"
                                : "neutral"
                          }
                        >
                          {t.priority}
                        </Pill>
                      </Card>
                    </Link>
                  ))}
                </div>
              </section>
            );
          })
        )}
      </div>
    </div>
  );
}
