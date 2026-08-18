import { redirect } from "next/navigation";
import Link from "next/link";
import { requireSession } from "@/lib/access";
import { connectDb } from "@/lib/mongoose";
import { Brand, Task, Project } from "@/models";
import { PageHeader, StatTile, Card, Pill, EmptyState } from "@/components/primitives";
import { Building2 } from "lucide-react";

export default async function HomePage() {
  const session = await requireSession();

  // Non-founders bounce to their first (or only) brand workspace.
  if (!session.user.isFounder) {
    const first = session.user.memberships[0];
    if (first) redirect(`/b/${first.brandSlug}`);
    // Founderless + brandless — show a friendly holding page.
    return (
      <div className="p-8">
        <PageHeader
          title="Welcome"
          subtitle="You haven't been added to any brand yet. Ping your brand admin."
        />
      </div>
    );
  }

  await connectDb();
  const [brands, openTasks, activeProjects] = await Promise.all([
    Brand.find({ archivedAt: null }).sort({ name: 1 }).lean(),
    Task.countDocuments({ status: { $in: ["todo", "in_progress", "in_review", "blocked"] } }),
    Project.countDocuments({ archivedAt: null, stage: { $ne: "archived" } }),
  ]);

  const perBrand = await Promise.all(
    brands.map(async (b) => {
      const [open, overdue, projects] = await Promise.all([
        Task.countDocuments({
          brandId: b._id,
          status: { $in: ["todo", "in_progress", "in_review", "blocked"] },
        }),
        Task.countDocuments({
          brandId: b._id,
          status: { $in: ["todo", "in_progress", "in_review", "blocked"] },
          dueAt: { $lt: new Date() },
        }),
        Project.countDocuments({ brandId: b._id, archivedAt: null }),
      ]);
      return { brand: b, open, overdue, projects };
    })
  );

  return (
    <div>
      <PageHeader
        title="All brands"
        subtitle="Founder overview — live workload across every brand."
      />

      <div className="p-8 space-y-8">
        <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
          <StatTile label="Brands" value={brands.length} hint="Active" />
          <StatTile label="Open tasks" value={openTasks} hint="Across all brands" />
          <StatTile label="Active projects" value={activeProjects} />
          <StatTile
            label="Overdue tasks"
            value={perBrand.reduce((s, x) => s + x.overdue, 0)}
            hint="Past their due date"
          />
        </div>

        <div>
          <h2 className="text-sm uppercase tracking-wide text-neutral-500 mb-3">
            Per brand
          </h2>

          {perBrand.length === 0 ? (
            <EmptyState
              title="No brands yet"
              hint="Seed the database with `pnpm db:seed` or add one from Admin → Manage brands."
            />
          ) : (
            <div className="grid gap-3 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
              {perBrand.map(({ brand, open, overdue, projects }) => (
                <Link key={String(brand._id)} href={`/b/${brand.slug}`}>
                  <Card className="hover:border-neutral-700 transition">
                    <div className="flex items-center gap-3 mb-3">
                      <div
                        className="h-8 w-8 rounded-md grid place-items-center text-sm font-semibold"
                        style={{
                          background: `${brand.color}22`,
                          color: brand.color,
                          border: `1px solid ${brand.color}55`,
                        }}
                      >
                        {brand.name.slice(0, 1).toUpperCase()}
                      </div>
                      <div className="min-w-0">
                        <div className="text-sm font-medium truncate">{brand.name}</div>
                        <div className="text-[11px] text-neutral-500 capitalize">
                          {brand.sector.replace("_", " ")}
                        </div>
                      </div>
                    </div>
                    <div className="grid grid-cols-3 gap-2 text-center">
                      <MiniStat label="Open" value={open} />
                      <MiniStat label="Overdue" value={overdue} tone={overdue > 0 ? "red" : "neutral"} />
                      <MiniStat label="Projects" value={projects} />
                    </div>
                  </Card>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function MiniStat({
  label,
  value,
  tone = "neutral",
}: {
  label: string;
  value: number;
  tone?: "neutral" | "red";
}) {
  return (
    <div className="flex flex-col items-center py-2 rounded-md bg-neutral-900/60">
      <div className={tone === "red" ? "text-red-300 text-lg font-semibold" : "text-lg font-semibold"}>
        {value}
      </div>
      <div className="text-[10px] uppercase tracking-wide text-neutral-500">{label}</div>
    </div>
  );
}
