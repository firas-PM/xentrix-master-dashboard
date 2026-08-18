import { requireBrandAccess } from "@/lib/access";

// This layout exists purely to enforce brand access + set up per-brand context.
// The sidebar's active brand highlight is derived from the URL in AppShell (client).
export default async function BrandLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  await requireBrandAccess(slug);
  return <>{children}</>;
}
