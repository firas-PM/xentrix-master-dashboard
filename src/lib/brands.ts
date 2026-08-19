import { cache } from "react";
import { unstable_cache } from "next/cache";
import { notFound } from "next/navigation";
import { connectDb } from "@/lib/mongoose";
import { Brand } from "@/models";

/**
 * Shared cross-request cache — 60s freshness, bust via `revalidateTag`.
 * Brands change rarely, so a minute of staleness on name/color/sector is fine.
 */
const readBrandBySlug = unstable_cache(
  async (slug: string) => {
    await connectDb();
    const brand = await Brand.findOne({ slug }).lean();
    return brand ? JSON.parse(JSON.stringify(brand)) : null;
  },
  ["brand-by-slug"],
  { revalidate: 60, tags: ["brands"] }
);

/**
 * Wrapped in React.cache so a single render tree only calls the underlying
 * function once even when brand landing + brand layout both need the brand.
 */
export const getBrandBySlug = cache(async (slug: string) => {
  const brand = await readBrandBySlug(slug);
  if (!brand) notFound();
  return brand;
});
