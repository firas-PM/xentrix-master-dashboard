import { requireFounder } from "@/lib/access";
import { connectDb } from "@/lib/mongoose";
import { Brand } from "@/models";
import { PageHeader, Card } from "@/components/primitives";
import { NewUserForm } from "./new-user-form";

export default async function NewUserPage() {
  await requireFounder();
  await connectDb();
  const brands = await Brand.find({ archivedAt: null }).sort({ name: 1 }).lean();
  return (
    <div>
      <PageHeader
        title="Add a user"
        subtitle="Create an account and grant access to one or more brands."
      />
      <div className="p-8 max-w-3xl">
        <Card>
          <NewUserForm
            brands={brands.map((b) => ({ slug: b.slug, name: b.name }))}
          />
        </Card>
      </div>
    </div>
  );
}
