import { requireSession } from "@/lib/access";
import { connectDb } from "@/lib/mongoose";
import { User } from "@/models";
import { PageHeader, Card } from "@/components/primitives";
import { AccountForms } from "./account-forms";
import { PrivacySection } from "./privacy-section";

export default async function AccountSettingsPage() {
  const session = await requireSession();
  await connectDb();
  const user = await User.findById(session.user.id).lean();

  return (
    <div>
      <PageHeader title="Account" subtitle="Your profile and password." />
      <div className="p-8 max-w-2xl space-y-6">
        <Card>
          <h2 className="text-xs uppercase tracking-wider font-semibold text-[var(--text-muted)] mb-4">Profile</h2>
          <AccountForms
            initialName={user?.name ?? ""}
            email={user?.email ?? session.user.email ?? ""}
          />
        </Card>
        <Card>
          <h2 className="text-xs uppercase tracking-wider font-semibold text-[var(--text-muted)] mb-4">
            Privacy
          </h2>
          <PrivacySection
            email={user?.email ?? session.user.email ?? ""}
            isFounder={session.user.isFounder}
          />
        </Card>
      </div>
    </div>
  );
}
