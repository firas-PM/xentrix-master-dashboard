import { notFound } from "next/navigation";
import { getBrandBySlug } from "@/lib/brands";
import { canManageBrand } from "@/lib/access";
import { connectDb } from "@/lib/mongoose";
import { TaskTemplate, Project } from "@/models";
import { listBrandMembers } from "@/lib/actions/task-actions";
import { PageHeader, Card, EmptyState, Pill } from "@/components/primitives";
import { TemplateEditor, type TemplateDraft } from "./template-editor";
import type { TaskKind, TaskPriority } from "@/models/types";

export default async function TemplatesPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const canManage = await canManageBrand(slug);
  if (!canManage) notFound();

  const brand = await getBrandBySlug(slug);
  await connectDb();
  const [templates, members, projects] = await Promise.all([
    TaskTemplate.find({ brandId: brand._id }).sort({ title: 1 }).lean(),
    listBrandMembers(slug),
    Project.find({ brandId: brand._id, archivedAt: null }, { slug: 1, name: 1 })
      .sort({ name: 1 })
      .lean(),
  ]);

  const projectOpts = projects.map((p) => ({
    id: String(p._id),
    name: p.name,
  }));

  return (
    <div>
      <PageHeader
        title="Task templates"
        subtitle={`Reusable defaults for ${brand.name}. Anyone with brand access can spawn a task from a template; only managers can edit them.`}
      />
      <div className="p-8 space-y-6">
        <Card>
          <TemplateEditor
            brandSlug={slug}
            members={members}
            projects={projectOpts}
          />
        </Card>

        {templates.length === 0 ? (
          <EmptyState
            title="No templates yet"
            hint="Save common patterns above — opening checklists, weekly stock, video shoots — and anyone in the brand can spawn them in one click."
          />
        ) : (
          <div className="space-y-3">
            {templates.map((t) => (
              <Card key={String(t._id)}>
                <div className="flex items-center gap-2 mb-3">
                  <div className="text-sm font-medium flex-1 min-w-0 truncate">
                    {t.title}
                  </div>
                  <Pill tone="gold">{t.kind}</Pill>
                  <Pill tone={t.priority === "urgent" ? "red" : "neutral"}>
                    {t.priority}
                  </Pill>
                  {t.estimateMinutes && (
                    <span className="text-[11px] text-[var(--text-subtle)]">
                      ~{t.estimateMinutes}m
                    </span>
                  )}
                </div>
                <TemplateEditor
                  brandSlug={slug}
                  members={members}
                  projects={projectOpts}
                  initial={
                    {
                      id: String(t._id),
                      title: t.title,
                      description: t.description ?? "",
                      kind: t.kind as TaskKind,
                      priority: t.priority as TaskPriority,
                      defaultAssigneeId: t.defaultAssigneeId
                        ? String(t.defaultAssigneeId)
                        : "",
                      projectId: t.projectId ? String(t.projectId) : "",
                      estimateMinutes: t.estimateMinutes
                        ? String(t.estimateMinutes)
                        : "",
                    } satisfies TemplateDraft
                  }
                />
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
