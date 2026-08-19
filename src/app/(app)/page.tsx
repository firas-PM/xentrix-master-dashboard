import { redirect } from "next/navigation";
import Link from "next/link";
import { requireSession } from "@/lib/access";
import { connectDb } from "@/lib/mongoose";
import { Brand } from "@/models";
import { getFounderOverview } from "@/lib/queries";
import { PageHeader, StatTile, Card, EmptyState } from "@/components/primitives";

export default async function HomePage() {
  const session = await requireSession();

  // Non-founders go to their personal work list, not a specific brand.
  if (!session.user.isFounder) {
    redirect("/my");
  }

  await connectDb();
  const [brands, overview] = await Promise.all([
    Brand.find({ archivedAt: null }).sort({ name: 1 }).lean(),
    getFounderOverview(),
  ]);

  const statsByBrandId = new Map(
    overview.perBrand.map((r) => [r.brandId, r])
  );
  const perBrand = brands.map((b) => {
    const s = statsByBrandId.get(String(b._id));
    return {
      brand: b,
      open: s?.open ?? 0,
      overdue: s?.overdue ?? 0,
      projects: s?.projects ?? 0,
    };
  });
  const openTasks = overview.totals.openTasks;
  const activeProjects = overview.totals.activeProjects;

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
          <h2 className="text-xs uppercase tracking-wider font-semibold text-[var(--text-muted)] mb-3">
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
                  <Card className="hover:border-[var(--border-strong)] transition">
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
                        <div className="text-[11px] text-[var(--text-subtle)] capitalize">
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
    <div className="flex flex-col items-center py-2 rounded-md bg-[var(--bg-sunken)]">
      <div className={tone === "red" ? "text-[var(--danger)] text-lg font-bold" : "text-lg font-bold"}>
        {value}
      </div>
      <div className="text-[10px] uppercase tracking-wide text-[var(--text-subtle)]">{label}</div>
    </div>
  );
}
