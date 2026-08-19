import { getBrandBySlug } from "@/lib/brands";
import { getBrandLandingStats, getBrandActivity } from "@/lib/queries";
import { PageHeader, StatTile, Card, EmptyState, Pill } from "@/components/primitives";
import Link from "next/link";
import { formatDistanceToNowStrict } from "date-fns";

export default async function BrandLandingPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const brand = await getBrandBySlug(slug);
  const [stats, activity] = await Promise.all([
    getBrandLandingStats(brand._id),
    getBrandActivity(brand._id, 12),
  ]);
  const { open, overdue, inReview, activeProjects, recentTasks, activeProjectDocs } =
    stats;

  return (
    <div>
      <PageHeader
        title={brand.name}
        subtitle={
          brand.description ??
          `${brand.sector.replace("_", " ")} · timezone ${brand.timezone}`
        }
      >
        <Link
          href={`/b/${brand.slug}/tasks?new=1`}
          className="rounded-md bg-[var(--accent)] hover:bg-[var(--accent-hover)] text-[var(--accent-ink)] text-sm font-semibold px-3 py-1.5 transition"
        >
          New task
        </Link>
      </PageHeader>

      <div className="p-8 space-y-8">
        <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
          <StatTile label="Open tasks" value={open} />
          <StatTile
            label="Overdue"
            value={overdue}
            hint={overdue > 0 ? "Past due date" : "None past due"}
          />
          <StatTile label="In review" value={inReview} />
          <StatTile label="Active projects" value={activeProjects} />
        </div>

        <section>
          <div className="flex items-baseline justify-between mb-3">
            <h2 className="text-xs uppercase tracking-wider font-semibold text-[var(--text-muted)]">
              Recent activity
            </h2>
            <Link
              href={`/b/${brand.slug}/tasks`}
              className="text-xs text-[var(--text-muted)] hover:text-[var(--text)] transition"
            >
              See all tasks →
            </Link>
          </div>
          {recentTasks.length === 0 ? (
            <EmptyState
              title="No tasks yet"
              hint="Create your first task to get started."
            />
          ) : (
            <div className="space-y-2">
              {recentTasks.map((t) => (
                <Card key={String(t._id)} className="flex items-center gap-3 py-3">
                  <StatusPill status={t.status} />
                  <div className="min-w-0 flex-1">
                    <div className="text-sm truncate">{t.title}</div>
                    <div className="text-[11px] text-[var(--text-subtle)] mt-0.5 flex items-center gap-2">
                      <span className="capitalize">{t.kind}</span>
                      {t.dueAt && <span>· due {formatDistanceToNowStrict(new Date(t.dueAt), { addSuffix: true })}</span>}
                    </div>
                  </div>
                  <PriorityPill priority={t.priority} />
                </Card>
              ))}
            </div>
          )}
        </section>

        <section>
          <div className="flex items-baseline justify-between mb-3">
            <h2 className="text-xs uppercase tracking-wider font-semibold text-[var(--text-muted)]">
              Team activity
            </h2>
          </div>
          {activity.length === 0 ? (
            <EmptyState title="Nothing has happened here yet" />
          ) : (
            <Card>
              <ul className="divide-y divide-[var(--border)]">
                {activity.map((a) => (
                  <li key={a._id} className="py-2 first:pt-0 last:pb-0 flex items-baseline gap-3">
                    <div className="min-w-0 flex-1">
                      <span className="text-sm">
                        <span className="font-medium">{a.actor?.name ?? "System"}</span>{" "}
                        {a.href ? (
                          <Link href={a.href} className="hover:underline">
                            {a.summary}
                          </Link>
                        ) : (
                          <span>{a.summary}</span>
                        )}
                      </span>
                    </div>
                    <span className="text-[10px] text-[var(--text-subtle)] shrink-0">
                      {formatDistanceToNowStrict(new Date(a.createdAt), { addSuffix: true })}
                    </span>
                  </li>
                ))}
              </ul>
            </Card>
          )}
        </section>

        <section>
          <div className="flex items-baseline justify-between mb-3">
            <h2 className="text-xs uppercase tracking-wider font-semibold text-[var(--text-muted)]">
              Active projects
            </h2>
            <Link
              href={`/b/${brand.slug}/projects`}
              className="text-xs text-[var(--text-muted)] hover:text-[var(--text)] transition"
            >
              See all projects →
            </Link>
          </div>
          {activeProjectDocs.length === 0 ? (
            <EmptyState title="No projects yet" />
          ) : (
            <div className="grid gap-3 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
              {activeProjectDocs.map((p) => (
                <Card key={String(p._id)}>
                  <div className="flex items-center justify-between mb-2">
                    <div className="text-sm font-medium truncate">{p.name}</div>
                    <Pill tone={stageTone(p.stage)}>{p.stage.replace("_", " ")}</Pill>
                  </div>
                  <div className="h-1.5 rounded-full bg-[var(--bg-sunken)] overflow-hidden">
                    <div
                      className="h-full bg-[var(--accent)]"
                      style={{ width: `${Math.min(100, Math.max(0, p.progress))}%` }}
                    />
                  </div>
                  <div className="text-[11px] text-[var(--text-subtle)] mt-2">{p.progress}%</div>
                </Card>
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}

function StatusPill({ status }: { status: string }) {
  const tone =
    status === "done"
      ? "green"
      : status === "in_progress"
      ? "blue"
      : status === "in_review"
      ? "violet"
      : status === "blocked"
      ? "red"
      : status === "cancelled"
      ? "neutral"
      : "amber";
  return <Pill tone={tone}>{status.replace("_", " ")}</Pill>;
}

function PriorityPill({ priority }: { priority: string }) {
  const tone =
    priority === "urgent"
      ? "red"
      : priority === "high"
      ? "amber"
      : priority === "low"
      ? "neutral"
      : "blue";
  return <Pill tone={tone}>{priority}</Pill>;
}

function stageTone(stage: string) {
  switch (stage) {
    case "live":
      return "green" as const;
    case "staging":
      return "blue" as const;
    case "development":
      return "violet" as const;
    case "design":
      return "amber" as const;
    case "maintenance":
      return "neutral" as const;
    default:
      return "neutral" as const;
  }
}
