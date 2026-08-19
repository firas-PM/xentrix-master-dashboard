import { requireFounder } from "@/lib/access";
import { connectDb } from "@/lib/mongoose";
import { Brand } from "@/models";
import { PageHeader, Card, EmptyState } from "@/components/primitives";

export default async function AdminBrandsPage() {
  await requireFounder();
  await connectDb();
  const brands = await Brand.find({}).sort({ name: 1 }).lean();

  return (
    <div>
      <PageHeader
        title="Manage brands"
        subtitle="Create, archive, or restyle any brand."
      />
      <div className="p-8">
        {brands.length === 0 ? (
          <EmptyState
            title="No brands yet"
            hint="Run `pnpm db:seed` to seed the initial set, or use the create form (coming soon)."
          />
        ) : (
          <div className="grid gap-3 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
            {brands.map((b) => (
              <Card key={String(b._id)}>
                <div className="flex items-center gap-3 mb-2">
                  <div
                    className="h-8 w-8 rounded-md grid place-items-center text-sm font-semibold"
                    style={{
                      background: `${b.color}22`,
                      color: b.color,
                      border: `1px solid ${b.color}55`,
                    }}
                  >
                    {b.name.slice(0, 1).toUpperCase()}
                  </div>
                  <div className="min-w-0">
                    <div className="text-sm font-medium truncate">{b.name}</div>
                    <div className="text-[11px] text-[var(--text-subtle)] capitalize">
                      {b.sector.replace("_", " ")} · {b.slug}
                    </div>
                  </div>
                </div>
                {b.description && (
                  <p className="text-xs text-[var(--text-muted)] line-clamp-3">{b.description}</p>
                )}
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
