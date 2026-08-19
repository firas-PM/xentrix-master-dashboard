import { notFound } from "next/navigation";
import Link from "next/link";
import { canAdminBrand } from "@/lib/access";
import { getBrandBySlug } from "@/lib/brands";
import { PageHeader, Card } from "@/components/primitives";
import { EditBrandForm } from "@/app/(app)/admin/brands/[slug]/edit-brand-form";
import type { BrandSector } from "@/models/types";

export default async function BrandSettingsPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const canAdmin = await canAdminBrand(slug);
  if (!canAdmin) notFound();
  const brand = await getBrandBySlug(slug);

  return (
    <div>
      <PageHeader
        title={`${brand.name} settings`}
        subtitle="Name, sector, brand color, timezone, description."
      >
        <Link
          href={`/b/${slug}`}
          className="text-sm text-[var(--text-muted)] hover:text-[var(--text)] transition"
        >
          ← Back
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
