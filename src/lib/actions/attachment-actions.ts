"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { connectDb } from "@/lib/mongoose";
import { Task, Brand } from "@/models";
import { requireBrandAccess } from "@/lib/access";

const addSchema = z.object({
  brandSlug: z.string(),
  taskId: z.string(),
  url: z.string().url(),
  pathname: z.string().min(1),
  name: z.string().min(1).max(300),
  size: z.number().int().min(0).optional(),
  contentType: z.string().max(200).optional(),
});

export type AddAttachmentResult = { ok: true } | { ok: false; error: string };

export async function addTaskAttachment(
  input: unknown
): Promise<AddAttachmentResult> {
  const parsed = addSchema.safeParse(input);
  if (!parsed.success) {
    return {
      ok: false,
      error: parsed.error.issues[0]?.message ?? "Invalid input",
    };
  }
  const { session } = await requireBrandAccess(parsed.data.brandSlug);
  await connectDb();
  const brand = await Brand.findOne({ slug: parsed.data.brandSlug }).lean();
  if (!brand) return { ok: false, error: "Brand not found" };

  await Task.updateOne(
    { _id: parsed.data.taskId, brandId: brand._id },
    {
      $push: {
        attachments: {
          url: parsed.data.url,
          pathname: parsed.data.pathname,
          name: parsed.data.name,
          size: parsed.data.size,
          contentType: parsed.data.contentType,
          uploadedById: session.user.id,
          uploadedAt: new Date(),
        },
      },
    }
  );
  revalidatePath(`/b/${parsed.data.brandSlug}/tasks/${parsed.data.taskId}`);
  return { ok: true };
}

const removeSchema = z.object({
  brandSlug: z.string(),
  taskId: z.string(),
  pathname: z.string(),
});

export async function removeTaskAttachment(input: unknown) {
  const parsed = removeSchema.parse(input);
  await requireBrandAccess(parsed.brandSlug);
  await connectDb();
  const brand = await Brand.findOne({ slug: parsed.brandSlug }).lean();
  if (!brand) throw new Error("Brand not found");

  await Task.updateOne(
    { _id: parsed.taskId, brandId: brand._id },
    { $pull: { attachments: { pathname: parsed.pathname } } }
  );

  // Best-effort blob delete (only works if BLOB env is present).
  if (process.env.BLOB_READ_WRITE_TOKEN) {
    try {
      const { del } = await import("@vercel/blob");
      await del(parsed.pathname);
    } catch {
      // Non-fatal — the DB record is what matters.
    }
  }
  revalidatePath(`/b/${parsed.brandSlug}/tasks/${parsed.taskId}`);
}
