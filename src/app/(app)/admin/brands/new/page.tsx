import { requireFounder } from "@/lib/access";
import { PageHeader, Card } from "@/components/primitives";
import { NewBrandForm } from "./new-brand-form";

export default async function NewBrandPage() {
  await requireFounder();
  return (
    <div>
      <PageHeader
        title="New brand"
        subtitle="Add a brand workspace. You can add team members afterwards from Admin → Manage users."
      />
      <div className="p-8 max-w-3xl">
        <Card>
          <NewBrandForm />
        </Card>
      </div>
    </div>
  );
}
