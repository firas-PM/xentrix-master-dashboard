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
