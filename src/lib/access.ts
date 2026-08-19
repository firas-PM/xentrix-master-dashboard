import { redirect } from "next/navigation";
import { auth } from "@/auth";
import type { Role } from "@/models/types";
import type { SessionMembership } from "@/auth";

export async function requireSession() {
  const session = await auth();
  if (!session?.user) redirect("/login");
  return session;
}

export async function requireFounder() {
  const session = await requireSession();
  if (!session.user.isFounder) redirect("/");
  return session;
}

/**
 * Ensures the current user has access to the given brand slug.
 * Founders always pass. Returns the matched membership (or a virtual one for founders).
 */
export async function requireBrandAccess(
  slug: string,
  minRole: Role = "worker"
) {
  const session = await requireSession();
  const membership = session.user.memberships.find((m) => m.brandSlug === slug);
  if (session.user.isFounder) {
    return {
      session,
      membership:
        membership ?? ({
          brandId: "",
          brandSlug: slug,
          brandName: slug,
          role: "founder" as Role,
        } satisfies SessionMembership),
    };
  }
  if (!membership) redirect("/");
  if (!hasRoleAtLeast(membership.role, minRole)) redirect(`/b/${slug}`);
  return { session, membership };
}

const ROLE_RANK: Record<Role, number> = {
  worker: 1,
  manager: 2,
  brand_admin: 3,
  founder: 4,
};

export function hasRoleAtLeast(role: Role, min: Role) {
  return ROLE_RANK[role] >= ROLE_RANK[min];
}

/**
 * Client-side visibility helper — mirrors the manager-and-up gate that
 * server actions enforce. Use it in pages to hide forms/buttons that a
 * worker can technically see but not submit, so the UI matches capability.
 * Founders always pass.
 */
export async function canManageBrand(slug: string): Promise<boolean> {
  const session = await requireSession();
  if (session.user.isFounder) return true;
  const m = session.user.memberships.find((x) => x.brandSlug === slug);
  return m ? hasRoleAtLeast(m.role, "manager") : false;
}

/**
 * Brand-admin capabilities: manage members + edit brand settings of the
 * brand they own. Distinct from managing tasks/projects/invoices (which
 * managers can also do).
 */
export async function canAdminBrand(slug: string): Promise<boolean> {
  const session = await requireSession();
  if (session.user.isFounder) return true;
  const m = session.user.memberships.find((x) => x.brandSlug === slug);
  return m ? hasRoleAtLeast(m.role, "brand_admin") : false;
}

export async function requireBrandAdmin(slug: string) {
  const session = await requireSession();
  if (session.user.isFounder) return { session, isFounder: true as const };
  const m = session.user.memberships.find((x) => x.brandSlug === slug);
  if (!m || !hasRoleAtLeast(m.role, "brand_admin")) {
    redirect(`/b/${slug}`);
  }
  return { session, isFounder: false as const };
}
