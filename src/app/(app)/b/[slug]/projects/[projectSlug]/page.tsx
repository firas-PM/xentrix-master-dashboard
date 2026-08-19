import { notFound } from "next/navigation";
import Link from "next/link";
import { requireBrandAccess, canManageBrand } from "@/lib/access";
import { getBrandBySlug } from "@/lib/brands";
import { connectDb } from "@/lib/mongoose";
import { Project } from "@/models";
import { PageHeader, Card, Pill } from "@/components/primitives";
import { EditProjectForm } from "./edit-project-form";
import type { ProjectStage } from "@/models/types";

export default async function ProjectDetailPage({
  params,
}: {
  params: Promise<{ slug: string; projectSlug: string }>;
}) {
  const { slug, projectSlug } = await params;
  await requireBrandAccess(slug);
  const brand = await getBrandBySlug(slug);
  const canManage = await canManageBrand(slug);
  await connectDb();
  const project = await Project.findOne({
    brandId: brand._id,
    slug: projectSlug,
  }).lean();
  if (!project) notFound();

  return (
    <div>
      <PageHeader
        title={project.name}
        subtitle={`${brand.name} · ${project.stage.replace("_", " ")}`}
      >
        <Link
          href={`/b/${slug}/projects`}
          className="text-sm text-[var(--text-muted)] hover:text-[var(--text)] transition"
        >
          ← Back to projects
        </Link>
      </PageHeader>
      <div className="p-8 max-w-4xl">
        {canManage ? (
          <Card>
            <EditProjectForm
              initial={{
                brandSlug: slug,
                projectSlug: project.slug,
                name: project.name,
                stage: project.stage as ProjectStage,
                description: project.description ?? "",
                brief: project.brief ?? "",
                progress: project.progress,
                liveUrl: project.liveUrl ?? "",
                repoUrl: project.repoUrl ?? "",
              }}
            />
          </Card>
        ) : (
          <ReadOnlyProject
            name={project.name}
            stage={project.stage}
            description={project.description ?? ""}
            brief={project.brief ?? ""}
            progress={project.progress}
            liveUrl={project.liveUrl ?? ""}
            repoUrl={project.repoUrl ?? ""}
          />
        )}
      </div>
    </div>
  );
}

function ReadOnlyProject({
  name,
  stage,
  description,
  brief,
  progress,
  liveUrl,
  repoUrl,
}: {
  name: string;
  stage: string;
  description: string;
  brief: string;
  progress: number;
  liveUrl: string;
  repoUrl: string;
}) {
  return (
    <Card className="space-y-5">
      <div className="flex items-center gap-3">
        <h2 className="text-lg font-semibold">{name}</h2>
        <Pill tone="gold">{stage.replace("_", " ")}</Pill>
      </div>

      <div>
        <Label>Progress</Label>
        <div className="h-2 rounded-full bg-[var(--bg-sunken)] overflow-hidden mt-1 max-w-md">
          <div
            className="h-full bg-[var(--accent)]"
            style={{ width: `${Math.min(100, Math.max(0, progress))}%` }}
          />
        </div>
        <div className="text-xs text-[var(--text-subtle)] mt-1">{progress}%</div>
      </div>

      {description && (
        <div>
          <Label>Description</Label>
          <p className="text-sm text-[var(--text)] whitespace-pre-wrap">{description}</p>
        </div>
      )}

      {(liveUrl || repoUrl) && (
        <div className="flex flex-wrap gap-2">
          {liveUrl && (
            <a
              href={liveUrl}
              target="_blank"
              rel="noreferrer"
              className="text-xs font-medium rounded-md border border-[var(--border-strong)] hover:bg-[var(--bg-sunken)] px-2.5 py-1 transition"
            >
              Live ↗
            </a>
          )}
          {repoUrl && (
            <a
              href={repoUrl}
              target="_blank"
              rel="noreferrer"
              className="text-xs font-medium rounded-md border border-[var(--border-strong)] hover:bg-[var(--bg-sunken)] px-2.5 py-1 transition"
            >
              Repo ↗
            </a>
          )}
        </div>
      )}

      {brief && (
        <div>
          <Label>Brief</Label>
          <pre className="text-sm text-[var(--text)] whitespace-pre-wrap font-mono bg-[var(--bg-sunken)] rounded-md p-3 border border-[var(--border)]">
            {brief}
          </pre>
        </div>
      )}

      <p className="text-xs text-[var(--text-subtle)]">
        Read-only view. Ask a manager or founder to edit this project.
      </p>
    </Card>
  );
}

function Label({ children }: { children: React.ReactNode }) {
  return (
    <div className="text-[10px] uppercase tracking-wider font-semibold text-[var(--text-muted)] mb-1">
      {children}
    </div>
  );
}
