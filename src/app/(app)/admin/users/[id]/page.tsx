import Link from "next/link";
import { notFound } from "next/navigation";
import { requireSession, requireFounder } from "@/lib/access";
import { connectDb } from "@/lib/mongoose";
import { User, Membership, Brand } from "@/models";
import { PageHeader, Card, Pill } from "@/components/primitives";
import { EditUserForm, type EditableUser } from "./edit-user-form";
import type { Role } from "@/models/types";

export default async function EditUserPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await requireSession();
  await requireFounder();
  const { id } = await params;

  await connectDb();
  const user = await User.findById(id).lean();
  if (!user) notFound();

  const [memberships, brands] = await Promise.all([
    Membership.find({ userId: user._id }).populate("brandId").lean(),
    Brand.find({ archivedAt: null }, { slug: 1, name: 1 })
      .sort({ name: 1 })
      .lean(),
  ]);

  const editable: EditableUser = {
    id: String(user._id),
    name: user.name ?? "",
    email: user.email,
    isFounder: Boolean(user.isFounder),
    deactivatedAt: user.deactivatedAt
      ? new Date(user.deactivatedAt).toISOString()
      : null,
    memberships: memberships
      .map((m) => {
        const b = m.brandId as unknown as { slug: string; name: string } | null;
        if (!b) return null;
        return {
          brandSlug: b.slug,
          brandName: b.name,
          role: m.role as Role,
        };
      })
      .filter((x): x is EditableUser["memberships"][number] => x !== null),
  };

  const isSelf = session.user.id === editable.id;

  return (
    <div>
      <PageHeader
        title={user.name ?? user.email}
        subtitle={
          <>
            <span>{user.email}</span>
            {editable.deactivatedAt && <Pill tone="red">Deactivated</Pill>}
          </>
        }
      >
        <Link
          href="/admin/users"
          className="text-sm text-[var(--text-muted)] hover:text-[var(--text)] transition"
        >
          ← Back to users
        </Link>
      </PageHeader>
      <div className="p-8 max-w-3xl">
        <Card>
          <EditUserForm
            user={editable}
            isSelf={isSelf}
            allBrands={brands.map((b) => ({ slug: b.slug, name: b.name }))}
          />
        </Card>
      </div>
    </div>
  );
}
