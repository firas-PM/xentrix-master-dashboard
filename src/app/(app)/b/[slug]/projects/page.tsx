import { getBrandBySlug } from "@/lib/brands";
import { connectDb } from "@/lib/mongoose";
import { Project } from "@/models";
import { PageHeader, Card, EmptyState, Pill } from "@/components/primitives";

export default async function ProjectsPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const brand = await getBrandBySlug(slug);
  await connectDb();
  const projects = await Project.find({ brandId: brand._id })
    .sort({ archivedAt: 1, updatedAt: -1 })
    .lean();

  return (
    <div>
      <PageHeader title="Projects" subtitle={brand.name} />
      <div className="p-8">
        {projects.length === 0 ? (
          <EmptyState
            title="No projects yet"
            hint="Projects group tasks across a stage (design → dev → staging → live)."
          />
        ) : (
          <div className="grid gap-3 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
            {projects.map((p) => (
              <Card key={String(p._id)}>
                <div className="flex items-start justify-between mb-2 gap-2">
                  <div className="min-w-0">
                    <div className="text-sm font-medium truncate">{p.name}</div>
                    {p.description && (
                      <div className="text-xs text-neutral-500 line-clamp-2 mt-0.5">
                        {p.description}
                      </div>
                    )}
                  </div>
                  <Pill tone="blue">{p.stage.replace("_", " ")}</Pill>
                </div>
                <div className="h-1.5 rounded-full bg-neutral-900 overflow-hidden">
                  <div
                    className="h-full bg-indigo-500"
                    style={{ width: `${Math.min(100, Math.max(0, p.progress))}%` }}
                  />
                </div>
                <div className="text-[11px] text-neutral-500 mt-2">
                  {p.progress}% · {p.stage}
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
