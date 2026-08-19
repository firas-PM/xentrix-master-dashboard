import { AppShell } from "@/components/app-shell";
import { requireSession } from "@/lib/access";
import { listAllBrands, getUnreadCount } from "@/lib/queries";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const session = await requireSession();
  const [captureBrands, unreadCount] = await Promise.all([
    session.user.isFounder
      ? listAllBrands()
      : Promise.resolve(
          session.user.memberships.map((m) => ({
            slug: m.brandSlug,
            name: m.brandName,
          }))
        ),
    getUnreadCount(session.user.id),
  ]);
  return (
    <AppShell
      user={{
        name: session.user.name,
        email: session.user.email,
        isFounder: session.user.isFounder,
      }}
      memberships={session.user.memberships}
      captureBrands={captureBrands}
      unreadCount={unreadCount}
    >
      {children}
    </AppShell>
  );
}
