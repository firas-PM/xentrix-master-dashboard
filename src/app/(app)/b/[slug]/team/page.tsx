import { getBrandBySlug } from "@/lib/brands";
import { canAdminBrand, requireSession } from "@/lib/access";
import { listBrandMembers } from "@/lib/actions/task-actions";
import { connectDb } from "@/lib/mongoose";
import { Membership, User } from "@/models";
import { PageHeader, Card, EmptyState, Pill } from "@/components/primitives";
import { MembersEditor } from "./members-editor";
import type { Role } from "@/models/types";

export default async function TeamPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const session = await requireSession();
  const brand = await getBrandBySlug(slug);
  const canAdmin = await canAdminBrand(slug);

  await connectDb();
  const rows = await Membership.find({ brandId: brand._id })
    .populate("userId")
    .lean();
  const members = rows
    .map((r) => {
      const u = r.userId as unknown as {
        _id: { toString(): string };
        name?: string;
        email: string;
      } | null;
      if (!u) return null;
      return {
        userId: String(u._id),
        name: u.name ?? u.email,
        email: u.email,
        role: r.role as Role,
      };
    })
    .filter((x): x is NonNullable<typeof x> => x !== null)
    .sort((a, b) => a.name.localeCompare(b.name));

  return (
    <div>
      <PageHeader title="Team" subtitle={brand.name} />
      <div className="p-8 space-y-6">
        {canAdmin ? (
          <Card>
            <MembersEditor
              brandSlug={slug}
              members={members}
              selfUserId={session.user.id}
            />
          </Card>
        ) : members.length === 0 ? (
          <EmptyState title="No members yet" hint="A brand admin can add them." />
        ) : (
          <div className="space-y-2">
            {members.map((m) => (
              <Card key={m.userId} className="flex items-center gap-3 py-3">
                <div className="h-8 w-8 rounded-full bg-[var(--bg-sunken)] border border-[var(--border)] grid place-items-center text-xs uppercase font-semibold text-[var(--text-muted)]">
                  {m.name.slice(0, 2)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium truncate">{m.name}</div>
                  <div className="text-xs text-[var(--text-subtle)] truncate">
                    {m.email}
                  </div>
                </div>
                <Pill tone="gold">{m.role.replace("_", " ")}</Pill>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
