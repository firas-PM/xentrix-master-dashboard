import { notFound } from "next/navigation";
import Link from "next/link";
import { requireBrandAccess } from "@/lib/access";
import { getBrandBySlug } from "@/lib/brands";
import { connectDb } from "@/lib/mongoose";
import { Project } from "@/models";
import { PageHeader, Card } from "@/components/primitives";
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
      </div>
    </div>
  );
}
