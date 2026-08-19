"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { connectDb } from "@/lib/mongoose";
import { User, Membership, Brand } from "@/models";
import { requireBrandAdmin } from "@/lib/access";
import { ROLES, type Role } from "@/models/types";

/**
 * Brand-admin scoped member management — a brand_admin can add / re-role /
 * remove members of their own brand without founder involvement. They can
 * only assign roles up to brand_admin (never founder — that's a system
 * flag, and only founders can grant it).
 */

const setSchema = z.object({
  brandSlug: z.string(),
  email: z.string().email(),
  role: z.enum(ROLES).refine((r) => r !== "founder", {
    message: "Founder is a system flag; only founders can grant it.",
  }),
});

export type SetBrandMemberResult =
  | { ok: true; added: boolean }
  | { ok: false; error: string };

export async function setBrandMemberByEmail(
  input: unknown
): Promise<SetBrandMemberResult> {
  const parsed = setSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }
  await requireBrandAdmin(parsed.data.brandSlug);
  await connectDb();

  const brand = await Brand.findOne({ slug: parsed.data.brandSlug }).lean();
  if (!brand) return { ok: false, error: "Brand not found" };

  const user = await User.findOne({ email: parsed.data.email.toLowerCase() }).lean();
  if (!user) {
    return {
      ok: false,
      error: `No user with email ${parsed.data.email}. Ask a founder to invite them first.`,
    };
  }

  const existing = await Membership.findOne({
    userId: user._id,
    brandId: brand._id,
  }).lean();

  await Membership.updateOne(
    { userId: user._id, brandId: brand._id },
    { $set: { role: parsed.data.role as Role } },
    { upsert: true }
  );
  revalidatePath(`/b/${parsed.data.brandSlug}/team`);
  revalidatePath(`/b/${parsed.data.brandSlug}/members`);
  return { ok: true, added: !existing };
}

const removeSchema = z.object({
  brandSlug: z.string(),
  userId: z.string(),
});

export async function removeBrandMember(input: unknown) {
  const parsed = removeSchema.parse(input);
  await requireBrandAdmin(parsed.brandSlug);
  await connectDb();
  const brand = await Brand.findOne({ slug: parsed.brandSlug }).lean();
  if (!brand) throw new Error("Brand not found");
  await Membership.deleteOne({ userId: parsed.userId, brandId: brand._id });
  revalidatePath(`/b/${parsed.brandSlug}/team`);
  revalidatePath(`/b/${parsed.brandSlug}/members`);
}
