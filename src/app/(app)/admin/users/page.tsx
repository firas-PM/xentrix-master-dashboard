import Link from "next/link";
import { requireFounder } from "@/lib/access";
import { connectDb } from "@/lib/mongoose";
import { User, Membership } from "@/models";
import { PageHeader, Card, EmptyState, Pill } from "@/components/primitives";

export default async function AdminUsersPage() {
  await requireFounder();
  await connectDb();
  const users = await User.find({}).sort({ createdAt: -1 }).lean();

  // Build a userId -> memberships[] map.
  const memberships = await Membership.find({}).populate("brandId").lean();
  const byUser = new Map<string, { brand: string; role: string }[]>();
  for (const m of memberships) {
    const b = m.brandId as unknown as { name: string } | null;
    if (!b) continue;
    const key = String(m.userId);
    const arr = byUser.get(key) ?? [];
    arr.push({ brand: b.name, role: m.role });
    byUser.set(key, arr);
  }

  return (
    <div>
      <PageHeader title="Manage users" subtitle="Everyone across every brand">
        <Link
          href="/admin/users/new"
          className="rounded-md bg-[var(--accent)] hover:bg-[var(--accent-hover)] text-[var(--accent-ink)] text-sm font-semibold px-3 py-1.5 transition"
        >
          + New user
        </Link>
      </PageHeader>
      <div className="p-8">
        {users.length === 0 ? (
          <EmptyState title="No users yet" />
        ) : (
          <div className="space-y-2">
            {users.map((u) => {
              const mems = byUser.get(String(u._id)) ?? [];
              return (
                <Link key={String(u._id)} href={`/admin/users/${String(u._id)}`}>
                  <Card className="flex items-center gap-3 py-3 hover:border-[var(--border-strong)] transition">
                    <div className="h-8 w-8 rounded-full bg-[var(--bg-sunken)] border border-[var(--border)] grid place-items-center text-xs uppercase font-semibold text-[var(--text-muted)]">
                      {(u.name ?? u.email).slice(0, 2)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium truncate flex items-center gap-2">
                        {u.name ?? "—"}
                        {u.deactivatedAt && <Pill tone="red">Deactivated</Pill>}
                      </div>
                      <div className="text-xs text-[var(--text-subtle)] truncate">{u.email}</div>
                    </div>
                    <div className="flex items-center gap-1 flex-wrap justify-end max-w-[50%]">
                      {u.isFounder && <Pill tone="gold">Founder</Pill>}
                      {mems.map((m, i) => (
                        <Pill key={i}>
                          {m.brand}: {m.role.replace("_", " ")}
                        </Pill>
                      ))}
                    </div>
                  </Card>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
