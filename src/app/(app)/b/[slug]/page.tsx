import { getBrandBySlug } from "@/lib/brands";
import { connectDb } from "@/lib/mongoose";
import { Task, Project } from "@/models";
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

  await connectDb();
  const [open, overdue, inReview, activeProjects, recentTasks, activeProjectDocs] =
    await Promise.all([
      Task.countDocuments({
        brandId: brand._id,
        status: { $in: ["todo", "in_progress", "in_review", "blocked"] },
      }),
      Task.countDocuments({
        brandId: brand._id,
        status: { $in: ["todo", "in_progress", "in_review", "blocked"] },
        dueAt: { $lt: new Date() },
      }),
      Task.countDocuments({ brandId: brand._id, status: "in_review" }),
      Project.countDocuments({ brandId: brand._id, archivedAt: null }),
      Task.find({ brandId: brand._id })
        .sort({ updatedAt: -1 })
        .limit(8)
        .lean(),
      Project.find({ brandId: brand._id, archivedAt: null })
        .sort({ updatedAt: -1 })
        .limit(6)
        .lean(),
    ]);

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
          className="rounded-md bg-indigo-500 hover:bg-indigo-400 text-white text-sm px-3 py-1.5"
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
            <h2 className="text-sm uppercase tracking-wide text-neutral-500">
              Recent activity
            </h2>
            <Link
              href={`/b/${brand.slug}/tasks`}
              className="text-xs text-neutral-400 hover:text-white"
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
                    <div className="text-[11px] text-neutral-500 mt-0.5 flex items-center gap-2">
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
            <h2 className="text-sm uppercase tracking-wide text-neutral-500">
              Active projects
            </h2>
            <Link
              href={`/b/${brand.slug}/projects`}
              className="text-xs text-neutral-400 hover:text-white"
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
                  <div className="h-1.5 rounded-full bg-neutral-900 overflow-hidden">
                    <div
                      className="h-full bg-indigo-500"
                      style={{ width: `${Math.min(100, Math.max(0, p.progress))}%` }}
                    />
                  </div>
                  <div className="text-[11px] text-neutral-500 mt-2">{p.progress}%</div>
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
