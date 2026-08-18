import { AppShell } from "@/components/app-shell";
import { requireSession } from "@/lib/access";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const session = await requireSession();
  return (
    <AppShell
      user={{
        name: session.user.name,
        email: session.user.email,
        isFounder: session.user.isFounder,
      }}
      memberships={session.user.memberships}
    >
      {children}
    </AppShell>
  );
}
