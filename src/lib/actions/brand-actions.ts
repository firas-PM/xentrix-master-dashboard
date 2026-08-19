"use server";

import { revalidatePath, updateTag } from "next/cache";
import { z } from "zod";
import { connectDb } from "@/lib/mongoose";
import { Brand } from "@/models";
import { requireFounder } from "@/lib/access";
import { BRAND_SECTORS } from "@/models/types";
import { brandStatsTag, founderOverviewTag } from "@/lib/queries";

const slugPattern = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

const createBrandSchema = z.object({
  name: z.string().min(1).max(120),
  slug: z
    .string()
    .min(2)
    .max(60)
    .regex(slugPattern, "Slug: lowercase letters, numbers, and dashes only"),
  sector: z.enum(BRAND_SECTORS).default("other"),
  color: z
    .string()
    .regex(/^#[0-9a-fA-F]{6}$/, "Color must be a 6-digit hex")
    .default("#6366f1"),
  description: z.string().max(500).optional().nullable(),
  timezone: z.string().min(1).max(64).default("Africa/Tunis"),
});

export type CreateBrandResult =
  | { ok: true; slug: string }
  | { ok: false; error: string };

export async function createBrand(input: unknown): Promise<CreateBrandResult> {
  const parsed = createBrandSchema.safeParse(input);
  if (!parsed.success) {
    return {
      ok: false,
      error: parsed.error.issues[0]?.message ?? "Invalid input",
    };
  }
  await requireFounder();
  await connectDb();

  const slug = parsed.data.slug.toLowerCase();
  const existing = await Brand.findOne({ slug }).lean();
  if (existing) return { ok: false, error: "A brand with this slug already exists" };

  await Brand.create({
    slug,
    name: parsed.data.name.trim(),
    sector: parsed.data.sector,
    color: parsed.data.color,
    description: parsed.data.description?.trim() || undefined,
    timezone: parsed.data.timezone,
  });

  updateTag(founderOverviewTag);
  updateTag(brandStatsTag);
  revalidatePath("/admin/brands");
  revalidatePath("/");
  return { ok: true, slug };
}

const archiveSchema = z.object({ slug: z.string() });

export async function archiveBrand(input: unknown) {
  const parsed = archiveSchema.parse(input);
  await requireFounder();
  await connectDb();
  await Brand.updateOne({ slug: parsed.slug }, { $set: { archivedAt: new Date() } });
  updateTag(founderOverviewTag);
  updateTag(brandStatsTag);
  revalidatePath("/admin/brands");
  revalidatePath("/");
}

export async function restoreBrand(input: unknown) {
  const parsed = archiveSchema.parse(input);
  await requireFounder();
  await connectDb();
  await Brand.updateOne({ slug: parsed.slug }, { $set: { archivedAt: null } });
  updateTag(founderOverviewTag);
  updateTag(brandStatsTag);
  revalidatePath("/admin/brands");
  revalidatePath("/");
}
