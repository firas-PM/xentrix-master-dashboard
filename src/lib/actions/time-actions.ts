"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { connectDb } from "@/lib/mongoose";
import { TaskTimeEntry, Task, Brand } from "@/models";
import { requireBrandAccess } from "@/lib/access";

const logSchema = z.object({
  brandSlug: z.string(),
  taskId: z.string(),
  minutes: z.number().int().min(1).max(24 * 60),
  note: z.string().max(500).optional().nullable(),
  workedAt: z.string().optional().nullable(),
});

export type LogTimeResult = { ok: true } | { ok: false; error: string };

export async function logTaskTime(input: unknown): Promise<LogTimeResult> {
  const parsed = logSchema.safeParse(input);
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
  const task = await Task.findOne({
    _id: parsed.data.taskId,
    brandId: brand._id,
  }).lean();
  if (!task) return { ok: false, error: "Task not found" };

  await TaskTimeEntry.create({
    taskId: task._id,
    brandId: brand._id,
    userId: session.user.id,
    minutes: parsed.data.minutes,
    note: parsed.data.note || null,
    workedAt: parsed.data.workedAt ? new Date(parsed.data.workedAt) : new Date(),
  });

  revalidatePath(`/b/${parsed.data.brandSlug}/tasks/${parsed.data.taskId}`);
  return { ok: true };
}

const deleteSchema = z.object({
  brandSlug: z.string(),
  taskId: z.string(),
  entryId: z.string(),
});

export async function deleteTaskTime(input: unknown): Promise<LogTimeResult> {
  const parsed = deleteSchema.parse(input);
  const { session } = await requireBrandAccess(parsed.brandSlug);
  await connectDb();
  const brand = await Brand.findOne({ slug: parsed.brandSlug }).lean();
  if (!brand) return { ok: false, error: "Brand not found" };

  const entry = await TaskTimeEntry.findOne({
    _id: parsed.entryId,
    taskId: parsed.taskId,
    brandId: brand._id,
  }).lean();
  if (!entry) return { ok: false, error: "Entry not found" };

  // Owner-only delete unless caller is a founder.
  if (
    !session.user.isFounder &&
    String(entry.userId) !== String(session.user.id)
  ) {
    return { ok: false, error: "Only the author can delete their entry" };
  }

  await TaskTimeEntry.deleteOne({ _id: parsed.entryId });
  revalidatePath(`/b/${parsed.brandSlug}/tasks/${parsed.taskId}`);
  return { ok: true };
}
