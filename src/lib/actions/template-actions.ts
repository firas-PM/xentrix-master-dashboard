"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { connectDb } from "@/lib/mongoose";
import { TaskTemplate, Brand, Task } from "@/models";
import { requireBrandAccess } from "@/lib/access";
import {
  TASK_KINDS,
  TASK_PRIORITIES,
  type TaskKind,
  type TaskPriority,
} from "@/models/types";
import { brandStatsTag, founderOverviewTag } from "@/lib/queries";
import { logActivity } from "@/lib/activity";
import { updateTag } from "next/cache";

const upsertSchema = z.object({
  brandSlug: z.string(),
  templateId: z.string().optional().nullable(),
  title: z.string().min(1).max(300),
  description: z.string().max(20000).optional().nullable(),
  kind: z.enum(TASK_KINDS).default("ops"),
  priority: z.enum(TASK_PRIORITIES).default("normal"),
  defaultAssigneeId: z.string().optional().nullable(),
  projectId: z.string().optional().nullable(),
  estimateMinutes: z
    .number()
    .int()
    .min(0)
    .max(60 * 24 * 30)
    .optional()
    .nullable(),
});

export type TemplateResult = { ok: true } | { ok: false; error: string };

export async function upsertTaskTemplate(
  input: unknown
): Promise<TemplateResult> {
  const parsed = upsertSchema.safeParse(input);
  if (!parsed.success) {
    return {
      ok: false,
      error: parsed.error.issues[0]?.message ?? "Invalid input",
    };
  }
  const { session } = await requireBrandAccess(parsed.data.brandSlug, "manager");
  await connectDb();
  const brand = await Brand.findOne({ slug: parsed.data.brandSlug }).lean();
  if (!brand) return { ok: false, error: "Brand not found" };

  const doc = {
    brandId: brand._id,
    title: parsed.data.title.trim(),
    description: parsed.data.description?.trim() || null,
    kind: parsed.data.kind,
    priority: parsed.data.priority,
    defaultAssigneeId: parsed.data.defaultAssigneeId || null,
    projectId: parsed.data.projectId || null,
    estimateMinutes:
      parsed.data.estimateMinutes && parsed.data.estimateMinutes > 0
        ? parsed.data.estimateMinutes
        : null,
    createdById: session.user.id,
  };

  if (parsed.data.templateId) {
    await TaskTemplate.updateOne(
      { _id: parsed.data.templateId, brandId: brand._id },
      { $set: doc }
    );
  } else {
    await TaskTemplate.create(doc);
  }
  revalidatePath(`/b/${parsed.data.brandSlug}/tasks`);
  revalidatePath(`/b/${parsed.data.brandSlug}/templates`);
  return { ok: true };
}

export async function deleteTaskTemplate(input: unknown) {
  const parsed = z
    .object({ brandSlug: z.string(), templateId: z.string() })
    .parse(input);
  await requireBrandAccess(parsed.brandSlug, "manager");
  await connectDb();
  const brand = await Brand.findOne({ slug: parsed.brandSlug }).lean();
  if (!brand) throw new Error("Brand not found");
  await TaskTemplate.deleteOne({
    _id: parsed.templateId,
    brandId: brand._id,
  });
  revalidatePath(`/b/${parsed.brandSlug}/tasks`);
  revalidatePath(`/b/${parsed.brandSlug}/templates`);
}

const fromTemplateSchema = z.object({
  brandSlug: z.string(),
  templateId: z.string(),
  dueAt: z.string().optional().nullable(),
  assignedToId: z.string().optional().nullable(),
});

/** Create a task from a template. Anyone with brand access can do this. */
export async function createTaskFromTemplate(
  input: unknown
): Promise<{ id: string }> {
  const parsed = fromTemplateSchema.parse(input);
  const { session } = await requireBrandAccess(parsed.brandSlug);
  await connectDb();
  const brand = await Brand.findOne({ slug: parsed.brandSlug }).lean();
  if (!brand) throw new Error("Brand not found");

  const t = await TaskTemplate.findOne({
    _id: parsed.templateId,
    brandId: brand._id,
  }).lean();
  if (!t) throw new Error("Template not found");

  const created = await Task.create({
    brandId: brand._id,
    title: t.title,
    description: t.description ?? undefined,
    kind: t.kind,
    priority: t.priority,
    assignedToId: parsed.assignedToId || t.defaultAssigneeId || undefined,
    projectId: t.projectId ?? undefined,
    estimateMinutes: t.estimateMinutes ?? undefined,
    dueAt: parsed.dueAt ? new Date(parsed.dueAt) : undefined,
    createdById: session.user.id,
  });

  await logActivity({
    brandId: String(brand._id),
    actorId: session.user.id,
    kind: "task_created",
    summary: `created task "${t.title}" from template`,
    entityType: "task",
    entityId: String(created._id),
    href: `/b/${parsed.brandSlug}/tasks/${String(created._id)}`,
  });

  updateTag(brandStatsTag);
  updateTag(founderOverviewTag);
  revalidatePath(`/b/${parsed.brandSlug}/tasks`);
  revalidatePath(`/b/${parsed.brandSlug}`);
  revalidatePath("/");
  return { id: String(created._id) };
}

const duplicateSchema = z.object({
  brandSlug: z.string(),
  taskId: z.string(),
});

export async function duplicateTask(input: unknown): Promise<{ id: string }> {
  const parsed = duplicateSchema.parse(input);
  const { session } = await requireBrandAccess(parsed.brandSlug);
  await connectDb();
  const brand = await Brand.findOne({ slug: parsed.brandSlug }).lean();
  if (!brand) throw new Error("Brand not found");
  const t = await Task.findOne({
    _id: parsed.taskId,
    brandId: brand._id,
  }).lean();
  if (!t) throw new Error("Task not found");

  const created = await Task.create({
    brandId: brand._id,
    title: `${t.title} (copy)`,
    description: t.description ?? undefined,
    kind: t.kind,
    priority: t.priority,
    assignedToId: t.assignedToId ?? undefined,
    projectId: t.projectId ?? undefined,
    parentTaskId: t.parentTaskId ?? undefined,
    estimateMinutes: t.estimateMinutes ?? undefined,
    links: t.links ?? [],
    createdById: session.user.id,
  });

  await logActivity({
    brandId: String(brand._id),
    actorId: session.user.id,
    kind: "task_created",
    summary: `duplicated "${t.title}"`,
    entityType: "task",
    entityId: String(created._id),
    href: `/b/${parsed.brandSlug}/tasks/${String(created._id)}`,
  });

  updateTag(brandStatsTag);
  updateTag(founderOverviewTag);
  revalidatePath(`/b/${parsed.brandSlug}/tasks`);
  return { id: String(created._id) };
}

const bulkSchema = z.object({
  brandSlug: z.string(),
  titles: z.array(z.string().min(1).max(300)).min(1).max(50),
  kind: z.enum(TASK_KINDS).default("ops"),
  priority: z.enum(TASK_PRIORITIES).default("normal"),
  assignedToId: z.string().optional().nullable(),
  projectId: z.string().optional().nullable(),
});

export type BulkResult = { ok: true; count: number } | { ok: false; error: string };

export async function bulkCreateTasks(input: unknown): Promise<BulkResult> {
  const parsed = bulkSchema.safeParse(input);
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

  const docs = parsed.data.titles.map((raw) => ({
    brandId: brand._id,
    title: raw.trim(),
    kind: parsed.data.kind as TaskKind,
    priority: parsed.data.priority as TaskPriority,
    assignedToId: parsed.data.assignedToId || undefined,
    projectId: parsed.data.projectId || undefined,
    createdById: session.user.id,
  }));

  await Task.insertMany(docs);

  await logActivity({
    brandId: String(brand._id),
    actorId: session.user.id,
    kind: "task_created",
    summary: `bulk-created ${docs.length} tasks`,
  });

  updateTag(brandStatsTag);
  updateTag(founderOverviewTag);
  revalidatePath(`/b/${parsed.data.brandSlug}/tasks`);
  revalidatePath(`/b/${parsed.data.brandSlug}`);
  revalidatePath("/");
  return { ok: true, count: docs.length };
}

