import Link from "next/link";
import { requireFounder } from "@/lib/access";
import { connectDb } from "@/lib/mongoose";
import { Brand } from "@/models";
import { PageHeader, Card, EmptyState, Pill } from "@/components/primitives";
import { BrandRowMenu } from "./brand-row-menu";

export default async function AdminBrandsPage() {
  await requireFounder();
  await connectDb();
  const brands = await Brand.find({}).sort({ name: 1 }).lean();

  return (
    <div>
      <PageHeader
        title="Manage brands"
        subtitle="Create, archive, or restyle any brand."
      >
        <Link
          href="/admin/brands/new"
          className="rounded-md bg-[var(--accent)] hover:bg-[var(--accent-hover)] text-[var(--accent-ink)] text-sm font-semibold px-3 py-1.5 transition"
        >
          + New brand
        </Link>
      </PageHeader>
      <div className="p-8">
        {brands.length === 0 ? (
          <EmptyState
            title="No brands yet"
            hint='Click "+ New brand" above to add your first brand workspace.'
          />
        ) : (
          <div className="grid gap-3 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
            {brands.map((b) => (
              <Card key={String(b._id)} className={b.archivedAt ? "opacity-60" : undefined}>
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
                  <div className="min-w-0 flex-1">
                    <div className="text-sm font-medium truncate flex items-center gap-2">
                      {b.name}
                      {b.archivedAt && <Pill tone="neutral">Archived</Pill>}
                    </div>
                    <div className="text-[11px] text-[var(--text-subtle)] capitalize">
                      {b.sector.replace("_", " ")} · {b.slug}
                    </div>
                  </div>
                </div>
                {b.description && (
                  <p className="text-xs text-[var(--text-muted)] line-clamp-3">{b.description}</p>
                )}
                <BrandRowMenu slug={b.slug} isArchived={Boolean(b.archivedAt)} />
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
