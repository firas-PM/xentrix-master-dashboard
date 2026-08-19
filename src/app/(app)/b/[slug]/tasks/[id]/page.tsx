import Link from "next/link";
import { notFound } from "next/navigation";
import { getBrandBySlug } from "@/lib/brands";
import { connectDb } from "@/lib/mongoose";
import { Task, TaskComment, User, TaskTimeEntry } from "@/models";
import { listBrandMembers } from "@/lib/actions/task-actions";
import { requireSession } from "@/lib/access";
import { PageHeader, Card, Pill } from "@/components/primitives";
import { formatDistanceToNowStrict, format } from "date-fns";
import { TaskDetailForm } from "./task-detail-form";
import { TaskStatusMenu } from "../task-status-menu";
import { TaskComments } from "./task-comments";
import { TaskTime } from "./task-time";
import { DeleteTaskButton } from "./delete-task-button";
import type { TaskStatus } from "@/models/types";

export default async function TaskDetailPage({
  params,
}: {
  params: Promise<{ slug: string; id: string }>;
}) {
  const { slug, id } = await params;
  const session = await requireSession();
  const brand = await getBrandBySlug(slug);
  await connectDb();

  const task = await Task.findOne({ _id: id, brandId: brand._id }).lean();
  if (!task) notFound();

  const [members, comments, creator, assignee, timeEntries] = await Promise.all([
    listBrandMembers(slug),
    TaskComment.find({ taskId: task._id }).sort({ createdAt: 1 }).lean(),
    task.createdById ? User.findById(task.createdById).lean() : null,
    task.assignedToId ? User.findById(task.assignedToId).lean() : null,
    TaskTimeEntry.find({ taskId: task._id })
      .sort({ workedAt: -1 })
      .populate("userId", "name email")
      .lean(),
  ]);

  const commentsWithAuthor = await Promise.all(
    comments.map(async (c) => {
      const u = await User.findById(c.authorId).lean();
      return {
        id: String(c._id),
        body: c.body,
        createdAt: c.createdAt,
        author: u ? { name: u.name ?? u.email, email: u.email } : null,
      };
    })
  );

  const dueLocalValue = task.dueAt
    ? format(new Date(task.dueAt), "yyyy-MM-dd'T'HH:mm")
    : "";

  return (
    <div>
      <PageHeader title={task.title} subtitle={`${brand.name} · Task`}>
        <Link href={`/b/${slug}/tasks`} className="text-sm text-[var(--text-muted)] hover:text-[var(--text)] transition">
          ← Back to tasks
        </Link>
      </PageHeader>

      <div className="p-8 grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <TaskDetailForm
              brandSlug={slug}
              task={{
                id: String(task._id),
                title: task.title,
                description: task.description ?? "",
                kind: task.kind,
                priority: task.priority,
                assignedToId: task.assignedToId ? String(task.assignedToId) : "",
                dueAt: dueLocalValue,
                links: Array.isArray(task.links)
                  ? task.links.map((l) => ({ label: l.label, url: l.url }))
                  : [],
              }}
              members={members}
            />
          </Card>

          <Card>
            <h2 className="text-xs uppercase tracking-wider font-semibold text-[var(--text-muted)] mb-4">
              Time tracking
            </h2>
            <TaskTime
              brandSlug={slug}
              taskId={String(task._id)}
              currentUserId={session.user.id}
              entries={timeEntries.map((e) => {
                const u = e.userId as unknown as {
                  _id: { toString(): string };
                  name?: string;
                  email?: string;
                } | null;
                return {
                  id: String(e._id),
                  minutes: e.minutes,
                  note: e.note ?? null,
                  workedAt: e.workedAt
                    ? new Date(e.workedAt).toISOString()
                    : new Date().toISOString(),
                  authorId: u ? String(u._id) : "",
                  authorName: u?.name ?? u?.email ?? "Unknown",
                };
              })}
            />
          </Card>

          <Card>
            <h2 className="text-xs uppercase tracking-wider font-semibold text-[var(--text-muted)] mb-4">
              Comments
            </h2>
            <TaskComments
              brandSlug={slug}
              taskId={String(task._id)}
              comments={commentsWithAuthor.map((c) => ({
                ...c,
                createdAt: c.createdAt ? new Date(c.createdAt).toISOString() : new Date().toISOString(),
              }))}
            />
          </Card>
        </div>

        <aside className="space-y-4">
          <Card>
            <h3 className="text-xs uppercase tracking-wider font-semibold text-[var(--text-muted)] mb-3">
              Status
            </h3>
            <TaskStatusMenu
              brandSlug={slug}
              taskId={String(task._id)}
              current={task.status as TaskStatus}
            />
          </Card>

          <Card>
            <h3 className="text-xs uppercase tracking-wider font-semibold text-[var(--text-muted)] mb-3">
              Details
            </h3>
            <dl className="space-y-2 text-sm">
              <Row label="Kind">
                <Pill>{task.kind}</Pill>
              </Row>
              <Row label="Priority">
                <Pill
                  tone={
                    task.priority === "urgent"
                      ? "red"
                      : task.priority === "high"
                      ? "amber"
                      : task.priority === "low"
                      ? "neutral"
                      : "blue"
                  }
                >
                  {task.priority}
                </Pill>
              </Row>
              <Row label="Assignee">
                <span className="text-[var(--text)] font-medium">
                  {assignee?.name ?? assignee?.email ?? "Unassigned"}
                </span>
              </Row>
              <Row label="Created by">
                <span className="text-[var(--text-muted)]">
                  {creator?.name ?? creator?.email ?? "—"}
                </span>
              </Row>
              <Row label="Created">
                <span className="text-[var(--text-muted)]">
                  {task.createdAt
                    ? formatDistanceToNowStrict(new Date(task.createdAt), { addSuffix: true })
                    : "—"}
                </span>
              </Row>
              {task.dueAt && (
                <Row label="Due">
                  <span className="text-[var(--text)] font-medium">
                    {format(new Date(task.dueAt), "d MMM yyyy · HH:mm")}
                  </span>
                </Row>
              )}
            </dl>
          </Card>

          <Card>
            <h3 className="text-xs uppercase tracking-wider font-semibold text-[var(--danger)] mb-3">
              Danger zone
            </h3>
            <DeleteTaskButton brandSlug={slug} taskId={String(task._id)} />
          </Card>
        </aside>
      </div>
    </div>
  );
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-4">
      <dt className="text-xs text-[var(--text-subtle)]">{label}</dt>
      <dd className="text-right">{children}</dd>
    </div>
  );
}
