"use server";

import { revalidatePath, updateTag } from "next/cache";
import { z } from "zod";
import { connectDb } from "@/lib/mongoose";
import { Project, Brand } from "@/models";
import { requireBrandAccess } from "@/lib/access";
import { PROJECT_STAGES } from "@/models/types";
import { brandStatsTag, founderOverviewTag } from "@/lib/queries";
import { logActivity } from "@/lib/activity";

const slugPattern = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

const createProjectSchema = z.object({
  brandSlug: z.string(),
  name: z.string().min(1).max(120),
  slug: z.string().min(2).max(60).regex(slugPattern),
  stage: z.enum(PROJECT_STAGES).default("discovery"),
  description: z.string().max(500).optional().nullable(),
  brief: z.string().max(20000).optional().nullable(),
});

export type CreateProjectResult =
  | { ok: true; slug: string }
  | { ok: false; error: string };

export async function createProject(input: unknown): Promise<CreateProjectResult> {
  const parsed = createProjectSchema.safeParse(input);
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

  const existing = await Project.findOne({
    brandId: brand._id,
    slug: parsed.data.slug,
  }).lean();
  if (existing)
    return { ok: false, error: "A project with this slug already exists" };

  const created = await Project.create({
    brandId: brand._id,
    name: parsed.data.name.trim(),
    slug: parsed.data.slug,
    stage: parsed.data.stage,
    description: parsed.data.description?.trim() || undefined,
    brief: parsed.data.brief?.trim() || null,
  });

  await logActivity({
    brandId: String(brand._id),
    actorId: session.user.id,
    kind: "project_created",
    summary: `created project "${parsed.data.name}"`,
    entityType: "project",
    entityId: String(created._id),
    href: `/b/${parsed.data.brandSlug}/projects/${parsed.data.slug}`,
  });

  updateTag(brandStatsTag);
  updateTag(founderOverviewTag);
  revalidatePath(`/b/${parsed.data.brandSlug}/projects`);
  revalidatePath(`/b/${parsed.data.brandSlug}`);
  return { ok: true, slug: parsed.data.slug };
}

const updateProjectSchema = z.object({
  brandSlug: z.string(),
  projectSlug: z.string(),
  name: z.string().min(1).max(120).optional(),
  stage: z.enum(PROJECT_STAGES).optional(),
  description: z.string().max(500).optional().nullable(),
  brief: z.string().max(20000).optional().nullable(),
  progress: z.number().int().min(0).max(100).optional(),
  liveUrl: z.string().url().optional().nullable(),
  repoUrl: z.string().url().optional().nullable(),
});

export type UpdateProjectResult = { ok: true } | { ok: false; error: string };

export async function updateProject(input: unknown): Promise<UpdateProjectResult> {
  const parsed = updateProjectSchema.safeParse(input);
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

  const $set: Record<string, unknown> = {};
  if (parsed.data.name !== undefined) $set.name = parsed.data.name;
  if (parsed.data.stage !== undefined) $set.stage = parsed.data.stage;
  if (parsed.data.description !== undefined)
    $set.description = parsed.data.description || null;
  if (parsed.data.brief !== undefined) $set.brief = parsed.data.brief || null;
  if (parsed.data.progress !== undefined) $set.progress = parsed.data.progress;
  if (parsed.data.liveUrl !== undefined) $set.liveUrl = parsed.data.liveUrl || null;
  if (parsed.data.repoUrl !== undefined) $set.repoUrl = parsed.data.repoUrl || null;

  await Project.updateOne(
    { brandId: brand._id, slug: parsed.data.projectSlug },
    { $set }
  );

  await logActivity({
    brandId: String(brand._id),
    actorId: session.user.id,
    kind: "project_updated",
    summary: `updated project "${parsed.data.name ?? parsed.data.projectSlug}"`,
    entityType: "project",
    entityId: parsed.data.projectSlug,
    href: `/b/${parsed.data.brandSlug}/projects/${parsed.data.projectSlug}`,
  });

  updateTag(brandStatsTag);
  updateTag(founderOverviewTag);
  revalidatePath(`/b/${parsed.data.brandSlug}/projects/${parsed.data.projectSlug}`);
  revalidatePath(`/b/${parsed.data.brandSlug}/projects`);
  revalidatePath(`/b/${parsed.data.brandSlug}`);
  return { ok: true };
}
