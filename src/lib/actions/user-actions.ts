"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import bcrypt from "bcryptjs";
import { randomBytes } from "node:crypto";
import { connectDb } from "@/lib/mongoose";
import { User, Membership, Brand, Task } from "@/models";
import { requireFounder, requireSession } from "@/lib/access";
import { ROLES, type Role } from "@/models/types";

// ------------ Self-service (account settings) ------------

const updateProfileSchema = z.object({
  name: z.string().max(120).optional(),
});

export async function updateProfile(input: unknown) {
  const parsed = updateProfileSchema.parse(input);
  const session = await requireSession();
  await connectDb();
  await User.updateOne(
    { _id: session.user.id },
    { $set: { name: parsed.name?.trim() || null } }
  );
  revalidatePath("/settings/account");
}

const changePasswordSchema = z
  .object({
    current: z.string().min(1),
    next: z.string().min(8, "Use at least 8 characters"),
    confirm: z.string().min(1),
  })
  .refine((v) => v.next === v.confirm, {
    message: "New passwords don't match",
    path: ["confirm"],
  });

export type ChangePasswordResult = { ok: true } | { ok: false; error: string };

export async function changePassword(input: unknown): Promise<ChangePasswordResult> {
  const parsed = changePasswordSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }
  const session = await requireSession();
  await connectDb();
  const user = await User.findById(session.user.id).lean();
  if (!user?.passwordHash) return { ok: false, error: "No password set on account" };
  const ok = await bcrypt.compare(parsed.data.current, user.passwordHash);
  if (!ok) return { ok: false, error: "Current password is wrong" };
  const hash = await bcrypt.hash(parsed.data.next, 10);
  await User.updateOne({ _id: session.user.id }, { $set: { passwordHash: hash } });
  return { ok: true };
}

// ------------ Founder-only user management ------------

const createUserSchema = z.object({
  name: z.string().min(1).max(120),
  email: z.string().email(),
  password: z.string().min(8),
  isFounder: z.boolean().optional().default(false),
  memberships: z
    .array(
      z.object({
        brandSlug: z.string(),
        role: z.enum(ROLES),
        title: z.string().optional(),
      })
    )
    .default([]),
});

export type CreateUserResult = { ok: true; id: string } | { ok: false; error: string };

export async function createUser(input: unknown): Promise<CreateUserResult> {
  const parsed = createUserSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }
  await requireFounder();
  await connectDb();

  const email = parsed.data.email.toLowerCase();
  const existing = await User.findOne({ email }).lean();
  if (existing) return { ok: false, error: "A user with this email already exists" };

  const hash = await bcrypt.hash(parsed.data.password, 10);
  const user = await User.create({
    name: parsed.data.name.trim(),
    email,
    passwordHash: hash,
    isFounder: parsed.data.isFounder ?? false,
  });

  for (const m of parsed.data.memberships) {
    const brand = await Brand.findOne({ slug: m.brandSlug }).lean();
    if (!brand) continue;
    await Membership.updateOne(
      { userId: user._id, brandId: brand._id },
      { $set: { role: m.role, title: m.title ?? null } },
      { upsert: true }
    );
  }

  revalidatePath("/admin/users");
  return { ok: true, id: String(user._id) };
}

const updateMembershipSchema = z.object({
  userId: z.string(),
  brandSlug: z.string(),
  role: z.enum(ROLES),
});

export async function upsertMembership(input: unknown) {
  const parsed = updateMembershipSchema.parse(input);
  await requireFounder();
  await connectDb();
  const brand = await Brand.findOne({ slug: parsed.brandSlug }).lean();
  if (!brand) throw new Error("Brand not found");
  await Membership.updateOne(
    { userId: parsed.userId, brandId: brand._id },
    { $set: { role: parsed.role as Role } },
    { upsert: true }
  );
  revalidatePath("/admin/users");
}

export async function removeMembership(input: unknown) {
  const parsed = z.object({ userId: z.string(), brandSlug: z.string() }).parse(input);
  await requireFounder();
  await connectDb();
  const brand = await Brand.findOne({ slug: parsed.brandSlug }).lean();
  if (!brand) return;
  await Membership.deleteOne({ userId: parsed.userId, brandId: brand._id });
  revalidatePath("/admin/users");
  revalidatePath(`/admin/users/${parsed.userId}`);
}

const updateUserSchema = z.object({
  userId: z.string(),
  name: z.string().min(1).max(120),
  isFounder: z.boolean(),
});

export type UpdateUserResult = { ok: true } | { ok: false; error: string };

export async function updateUser(input: unknown): Promise<UpdateUserResult> {
  const parsed = updateUserSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }
  const session = await requireFounder();

  // Prevent a founder from demoting themselves — you'd get locked out of the
  // admin section immediately after the JWT refresh.
  if (
    parsed.data.userId === session.user.id &&
    !parsed.data.isFounder &&
    session.user.isFounder
  ) {
    return { ok: false, error: "You cannot remove your own founder flag." };
  }

  await connectDb();
  await User.updateOne(
    { _id: parsed.data.userId },
    { $set: { name: parsed.data.name.trim(), isFounder: parsed.data.isFounder } }
  );
  revalidatePath("/admin/users");
  revalidatePath(`/admin/users/${parsed.data.userId}`);
  return { ok: true };
}

const resetSchema = z.object({ userId: z.string() });

export type ResetPasswordResult =
  | { ok: true; newPassword: string }
  | { ok: false; error: string };

/** Founder-only: reset a user's password to a random string and return it once. */
export async function adminResetPassword(input: unknown): Promise<ResetPasswordResult> {
  const parsed = resetSchema.parse(input);
  await requireFounder();
  await connectDb();
  const user = await User.findById(parsed.userId).lean();
  if (!user) return { ok: false, error: "User not found" };

  const newPassword = randomPassword(16);
  const hash = await bcrypt.hash(newPassword, 10);
  await User.updateOne(
    { _id: parsed.userId },
    { $set: { passwordHash: hash }, $inc: { tokenVersion: 1 } }
  );
  revalidatePath(`/admin/users/${parsed.userId}`);
  return { ok: true, newPassword };
}

export async function setUserDeactivated(input: unknown) {
  const parsed = z
    .object({ userId: z.string(), deactivated: z.boolean() })
    .parse(input);
  const session = await requireFounder();
  if (parsed.userId === session.user.id) {
    throw new Error("Cannot deactivate your own account here.");
  }
  await connectDb();
  await User.updateOne(
    { _id: parsed.userId },
    { $set: { deactivatedAt: parsed.deactivated ? new Date() : null } }
  );
  revalidatePath("/admin/users");
  revalidatePath(`/admin/users/${parsed.userId}`);
}

export async function deleteUser(input: unknown) {
  const parsed = z.object({ userId: z.string() }).parse(input);
  const session = await requireFounder();
  if (parsed.userId === session.user.id) {
    throw new Error("Cannot delete your own account.");
  }
  await connectDb();
  // Unassign any tasks first so we don't leave dangling references.
  await Task.updateMany(
    { assignedToId: parsed.userId },
    { $set: { assignedToId: null } }
  );
  await Membership.deleteMany({ userId: parsed.userId });
  await User.deleteOne({ _id: parsed.userId });
  revalidatePath("/admin/users");
}

function randomPassword(len: number) {
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789";
  const bytes = randomBytes(len);
  let out = "";
  for (let i = 0; i < len; i++) out += alphabet[bytes[i] % alphabet.length];
  return out;
}
