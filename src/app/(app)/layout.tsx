import { AppShell } from "@/components/app-shell";
import { requireSession } from "@/lib/access";
import { listAllBrands } from "@/lib/queries";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const session = await requireSession();
  const captureBrands = session.user.isFounder
    ? await listAllBrands()
    : session.user.memberships.map((m) => ({
        slug: m.brandSlug,
        name: m.brandName,
      }));
  return (
    <AppShell
      user={{
        name: session.user.name,
        email: session.user.email,
        isFounder: session.user.isFounder,
      }}
      memberships={session.user.memberships}
      captureBrands={captureBrands}
    >
      {children}
    </AppShell>
  );
}
