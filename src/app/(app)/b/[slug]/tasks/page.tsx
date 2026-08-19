import Link from "next/link";
import { Types } from "mongoose";
import { getBrandBySlug } from "@/lib/brands";
import { connectDb } from "@/lib/mongoose";
import { Task } from "@/models";
import { PageHeader, Pill, Card, EmptyState } from "@/components/primitives";
import { NewTaskForm } from "./new-task-form";
import { TaskStatusMenu } from "./task-status-menu";
import { KanbanFilters } from "./kanban-filters";
import { listBrandMembers } from "@/lib/actions/task-actions";
import { formatDistanceToNowStrict } from "date-fns";
import type { TaskStatus, TaskKind, TaskPriority } from "@/models/types";

const COLUMNS: { key: TaskStatus; label: string }[] = [
  { key: "todo", label: "To do" },
  { key: "in_progress", label: "In progress" },
  { key: "in_review", label: "In review" },
  { key: "blocked", label: "Blocked" },
  { key: "done", label: "Done" },
];

export default async function TasksPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{
    assignee?: string;
    kind?: string;
    priority?: string;
    q?: string;
  }>;
}) {
  const { slug } = await params;
  const sp = await searchParams;
  const brand = await getBrandBySlug(slug);

  await connectDb();

  // Build the filter query from URL params. Anything unrecognised falls
  // back to "no filter" (we never trust user input to be a valid enum
  // without checking).
  const filter: Record<string, unknown> = {
    brandId: brand._id,
    status: { $ne: "cancelled" },
  };
  if (sp.assignee === "unassigned") {
    filter.assignedToId = null;
  } else if (sp.assignee && Types.ObjectId.isValid(sp.assignee)) {
    filter.assignedToId = new Types.ObjectId(sp.assignee);
  }
  if (sp.kind) filter.kind = sp.kind as TaskKind;
  if (sp.priority) filter.priority = sp.priority as TaskPriority;
  if (sp.q && sp.q.trim()) {
    filter.title = { $regex: escapeRegex(sp.q.trim()), $options: "i" };
  }

  const [allTasks, members] = await Promise.all([
    Task.find(filter).sort({ priority: -1, updatedAt: -1 }).lean(),
    listBrandMembers(slug),
  ]);

  const grouped: Record<TaskStatus, typeof allTasks> = {
    backlog: [],
    todo: [],
    in_progress: [],
    in_review: [],
    blocked: [],
    done: [],
    cancelled: [],
  };
  for (const t of allTasks) grouped[t.status as TaskStatus].push(t);

  return (
    <div>
      <PageHeader
        title="Tasks"
        subtitle={`${allTasks.length} active in ${brand.name}`}
      />

      <div className="p-6 lg:p-8 space-y-6">
        <Card>
          <NewTaskForm brandSlug={slug} members={members} />
        </Card>

        <Card>
          <KanbanFilters members={members} />
        </Card>

        <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-5">
          {COLUMNS.map((col) => (
            <div key={col.key} className="space-y-2">
              <div className="flex items-center justify-between px-1">
                <div className="text-xs uppercase tracking-wider font-semibold text-[var(--text-muted)]">
                  {col.label}
                </div>
                <div className="text-xs text-[var(--text-subtle)] tabular-nums">
                  {grouped[col.key].length}
                </div>
              </div>
              {grouped[col.key].length === 0 ? (
                <div className="rounded-md border border-dashed border-[var(--border-strong)] bg-[var(--bg-sunken)] py-6 text-center text-[11px] text-[var(--text-subtle)]">
                  Empty
                </div>
              ) : (
                grouped[col.key].map((t) => (
                  <div
                    key={String(t._id)}
                    className="rounded-md border border-[var(--border)] bg-[var(--bg-elevated)] p-3 hover:border-[var(--border-strong)] transition shadow-[0_1px_0_rgba(17,17,17,0.02)]"
                  >
                    <Link href={`/b/${slug}/tasks/${String(t._id)}`} className="block text-sm font-medium hover:underline">
                      {t.title}
                    </Link>
                    <div className="mt-2 flex items-center gap-2 flex-wrap">
                      <Pill tone={kindTone(t.kind)}>{t.kind}</Pill>
                      <Pill tone={priorityTone(t.priority)}>{t.priority}</Pill>
                      {t.dueAt && (
                        <span className="text-[10px] text-[var(--text-subtle)]">
                          due {formatDistanceToNowStrict(new Date(t.dueAt), { addSuffix: true })}
                        </span>
                      )}
                    </div>
                    <div className="mt-3">
                      <TaskStatusMenu
                        brandSlug={slug}
                        taskId={String(t._id)}
                        current={t.status as TaskStatus}
                      />
                    </div>
                  </div>
                ))
              )}
            </div>
          ))}
        </div>

        {allTasks.length === 0 && (
          <EmptyState
            title="No tasks yet"
            hint="Use the form above to create your first task."
          />
        )}
      </div>
    </div>
  );
}

function kindTone(k: string) {
  switch (k) {
    case "dev":
      return "violet" as const;
    case "design":
      return "amber" as const;
    case "sales":
      return "green" as const;
    case "chore":
      return "neutral" as const;
    case "admin":
      return "blue" as const;
    default:
      return "neutral" as const;
  }
}

function escapeRegex(s: string) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function priorityTone(p: string) {
  switch (p) {
    case "urgent":
      return "red" as const;
    case "high":
      return "amber" as const;
    case "low":
      return "neutral" as const;
    default:
      return "blue" as const;
  }
}
