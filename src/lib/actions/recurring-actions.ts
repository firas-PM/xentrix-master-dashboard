"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { connectDb } from "@/lib/mongoose";
import { RecurringTaskTemplate, Brand } from "@/models";
import { requireBrandAccess } from "@/lib/access";
import {
  RECURRENCE_FREQS,
  TASK_KINDS,
  TASK_PRIORITIES,
} from "@/models/types";

const timePattern = /^([01]\d|2[0-3]):[0-5]\d$/;

const createSchema = z.object({
  brandSlug: z.string(),
  title: z.string().min(1).max(300),
  description: z.string().max(2000).optional().nullable(),
  kind: z.enum(TASK_KINDS).default("chore"),
  priority: z.enum(TASK_PRIORITIES).default("normal"),
  defaultAssigneeId: z.string().optional().nullable(),
  frequency: z.enum(RECURRENCE_FREQS).default("daily"),
  daysOfWeek: z.array(z.number().int().min(0).max(6)).optional(),
  dayOfMonth: z.number().int().min(1).max(31).optional().nullable(),
  time: z.string().regex(timePattern, "Time must be HH:mm").default("09:00"),
});

export type RecurringResult = { ok: true } | { ok: false; error: string };

export async function createRecurring(input: unknown): Promise<RecurringResult> {
  const parsed = createSchema.safeParse(input);
  if (!parsed.success) {
    return {
      ok: false,
      error: parsed.error.issues[0]?.message ?? "Invalid input",
    };
  }
  await requireBrandAccess(parsed.data.brandSlug, "manager");
  await connectDb();
  const brand = await Brand.findOne({ slug: parsed.data.brandSlug }).lean();
  if (!brand) return { ok: false, error: "Brand not found" };

  await RecurringTaskTemplate.create({
    brandId: brand._id,
    title: parsed.data.title,
    description: parsed.data.description || undefined,
    kind: parsed.data.kind,
    priority: parsed.data.priority,
    defaultAssigneeId: parsed.data.defaultAssigneeId || undefined,
    frequency: parsed.data.frequency,
    schedule: {
      daysOfWeek:
        parsed.data.frequency === "weekly" ? parsed.data.daysOfWeek ?? [1] : undefined,
      dayOfMonth:
        parsed.data.frequency === "monthly" ? parsed.data.dayOfMonth ?? 1 : undefined,
      time: parsed.data.time,
    },
    active: true,
  });

  revalidatePath(`/b/${parsed.data.brandSlug}/recurring`);
  return { ok: true };
}

const toggleSchema = z.object({
  brandSlug: z.string(),
  templateId: z.string(),
  active: z.boolean(),
});

export async function setRecurringActive(input: unknown) {
  const parsed = toggleSchema.parse(input);
  await requireBrandAccess(parsed.brandSlug, "manager");
  await connectDb();
  const brand = await Brand.findOne({ slug: parsed.brandSlug }).lean();
  if (!brand) throw new Error("Brand not found");
  await RecurringTaskTemplate.updateOne(
    { _id: parsed.templateId, brandId: brand._id },
    { $set: { active: parsed.active } }
  );
  revalidatePath(`/b/${parsed.brandSlug}/recurring`);
}

export async function deleteRecurring(input: unknown) {
  const parsed = z
    .object({ brandSlug: z.string(), templateId: z.string() })
    .parse(input);
  await requireBrandAccess(parsed.brandSlug, "manager");
  await connectDb();
  const brand = await Brand.findOne({ slug: parsed.brandSlug }).lean();
  if (!brand) throw new Error("Brand not found");
  await RecurringTaskTemplate.deleteOne({
    _id: parsed.templateId,
    brandId: brand._id,
  });
  revalidatePath(`/b/${parsed.brandSlug}/recurring`);
}
