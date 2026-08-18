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
          className="rounded-md bg-indigo-500 hover:bg-indigo-400 text-white text-sm px-3 py-1.5"
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
                <Card key={String(u._id)} className="flex items-center gap-3 py-3">
                  <div className="h-8 w-8 rounded-full bg-neutral-800 grid place-items-center text-xs uppercase">
                    {(u.name ?? u.email).slice(0, 2)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm truncate">{u.name ?? "—"}</div>
                    <div className="text-xs text-neutral-500 truncate">{u.email}</div>
                  </div>
                  <div className="flex items-center gap-1 flex-wrap justify-end max-w-[50%]">
                    {u.isFounder && <Pill tone="violet">Founder</Pill>}
                    {mems.map((m, i) => (
                      <Pill key={i}>
                        {m.brand}: {m.role.replace("_", " ")}
                      </Pill>
                    ))}
                  </div>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
