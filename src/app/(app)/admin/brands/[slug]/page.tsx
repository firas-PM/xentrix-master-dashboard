import { notFound } from "next/navigation";
import Link from "next/link";
import { requireFounder } from "@/lib/access";
import { connectDb } from "@/lib/mongoose";
import { Brand } from "@/models";
import { PageHeader, Card } from "@/components/primitives";
import { EditBrandForm } from "./edit-brand-form";
import type { BrandSector } from "@/models/types";

export default async function EditBrandPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  await requireFounder();
  const { slug } = await params;
  await connectDb();
  const brand = await Brand.findOne({ slug }).lean();
  if (!brand) notFound();

  return (
    <div>
      <PageHeader title={`Edit ${brand.name}`} subtitle={brand.slug}>
        <Link
          href="/admin/brands"
          className="text-sm text-[var(--text-muted)] hover:text-[var(--text)] transition"
        >
          ← Back to brands
        </Link>
      </PageHeader>
      <div className="p-8 max-w-3xl">
        <Card>
          <EditBrandForm
            initial={{
              slug: brand.slug,
              name: brand.name,
              sector: brand.sector as BrandSector,
              color: brand.color,
              description: brand.description ?? "",
              timezone: brand.timezone,
            }}
          />
        </Card>
      </div>
    </div>
  );
}
