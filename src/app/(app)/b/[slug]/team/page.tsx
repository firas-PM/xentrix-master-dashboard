import { getBrandBySlug } from "@/lib/brands";
import { listBrandMembers } from "@/lib/actions/task-actions";
import { PageHeader, Card, EmptyState, Pill } from "@/components/primitives";

export default async function TeamPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const brand = await getBrandBySlug(slug);
  const members = await listBrandMembers(slug);

  return (
    <div>
      <PageHeader title="Team" subtitle={brand.name} />
      <div className="p-8">
        {members.length === 0 ? (
          <EmptyState title="No members yet" hint="Invite from Admin → Manage users." />
        ) : (
          <div className="space-y-2">
            {members.map((m) => (
              <Card key={m.id} className="flex items-center gap-3 py-3">
                <div className="h-8 w-8 rounded-full bg-[var(--bg-sunken)] border border-[var(--border)] grid place-items-center text-xs uppercase font-semibold text-[var(--text-muted)]">
                  {m.name.slice(0, 2)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium truncate">{m.name}</div>
                  <div className="text-xs text-[var(--text-subtle)] truncate">{m.email}</div>
                </div>
                <Pill tone={m.role === "founder" ? "gold" : m.role === "brand_admin" ? "gold" : "neutral"}>
                  {m.role.replace("_", " ")}
                </Pill>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
