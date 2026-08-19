"use server";

import { revalidatePath, updateTag } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { connectDb } from "@/lib/mongoose";
import { Task, Brand, Membership, TaskComment, User } from "@/models";
import { requireBrandAccess } from "@/lib/access";
import { TASK_KINDS, TASK_PRIORITIES, TASK_STATUSES } from "@/models/types";
import { brandStatsTag, founderOverviewTag } from "@/lib/queries";
import { logActivity } from "@/lib/activity";
import { mentionEmail, sendEmailViaResend } from "@/lib/email";

function bustStatsCache() {
  updateTag(brandStatsTag);
  updateTag(founderOverviewTag);
}

const createSchema = z.object({
  brandSlug: z.string(),
  title: z.string().min(1).max(300),
  kind: z.enum(TASK_KINDS).default("ops"),
  priority: z.enum(TASK_PRIORITIES).default("normal"),
  assignedToId: z.string().optional().nullable(),
  dueAt: z.string().optional().nullable(),
  description: z.string().optional().nullable(),
  projectId: z.string().optional().nullable(),
});

export async function createTask(input: unknown) {
  const parsed = createSchema.parse(input);
  const { session } = await requireBrandAccess(parsed.brandSlug);

  await connectDb();
  const brand = await Brand.findOne({ slug: parsed.brandSlug }).lean();
  if (!brand) throw new Error("Brand not found");

  const created = await Task.create({
    brandId: brand._id,
    title: parsed.title,
    kind: parsed.kind,
    priority: parsed.priority,
    description: parsed.description || undefined,
    assignedToId: parsed.assignedToId || undefined,
    projectId: parsed.projectId || undefined,
    dueAt: parsed.dueAt ? new Date(parsed.dueAt) : undefined,
    createdById: session.user.id,
  });

  await logActivity({
    brandId: String(brand._id),
    actorId: session.user.id,
    kind: "task_created",
    summary: `created task "${parsed.title}"`,
    entityType: "task",
    entityId: String(created._id),
    href: `/b/${parsed.brandSlug}/tasks/${String(created._id)}`,
  });

  bustStatsCache();
  revalidatePath(`/b/${parsed.brandSlug}`);
  revalidatePath(`/b/${parsed.brandSlug}/tasks`);
  revalidatePath("/");
}

const updateStatusSchema = z.object({
  brandSlug: z.string(),
  taskId: z.string(),
  status: z.enum(TASK_STATUSES),
});

export async function updateTaskStatus(input: unknown) {
  const parsed = updateStatusSchema.parse(input);
  const { session } = await requireBrandAccess(parsed.brandSlug);

  await connectDb();
  const brand = await Brand.findOne({ slug: parsed.brandSlug }).lean();
  if (!brand) throw new Error("Brand not found");

  const task = await Task.findOne({ _id: parsed.taskId, brandId: brand._id }).lean();
  if (!task) throw new Error("Task not found");

  await Task.updateOne(
    { _id: parsed.taskId, brandId: brand._id },
    {
      $set: {
        status: parsed.status,
        completedAt: parsed.status === "done" ? new Date() : null,
      },
    }
  );

  await logActivity({
    brandId: String(brand._id),
    actorId: session.user.id,
    kind: "task_status_changed",
    summary: `moved "${task.title}" → ${parsed.status.replace("_", " ")}`,
    entityType: "task",
    entityId: parsed.taskId,
    href: `/b/${parsed.brandSlug}/tasks/${parsed.taskId}`,
  });

  bustStatsCache();
  revalidatePath(`/b/${parsed.brandSlug}`);
  revalidatePath(`/b/${parsed.brandSlug}/tasks`);
  revalidatePath("/");
}

const linkSchema = z.object({
  label: z.string().min(1).max(120),
  url: z.string().url("Must be a valid URL"),
});

const updateDetailsSchema = z.object({
  brandSlug: z.string(),
  taskId: z.string(),
  title: z.string().min(1).max(300).optional(),
  description: z.string().max(20000).optional().nullable(),
  kind: z.enum(TASK_KINDS).optional(),
  priority: z.enum(TASK_PRIORITIES).optional(),
  assignedToId: z.string().optional().nullable(),
  dueAt: z.string().optional().nullable(),
  links: z.array(linkSchema).max(20).optional(),
});

export async function updateTaskDetails(input: unknown) {
  const parsed = updateDetailsSchema.parse(input);
  const { session } = await requireBrandAccess(parsed.brandSlug);
  await connectDb();
  const brand = await Brand.findOne({ slug: parsed.brandSlug }).lean();
  if (!brand) throw new Error("Brand not found");

  const $set: Record<string, unknown> = {};
  if (parsed.title !== undefined) $set.title = parsed.title;
  if (parsed.description !== undefined) $set.description = parsed.description || null;
  if (parsed.kind !== undefined) $set.kind = parsed.kind;
  if (parsed.priority !== undefined) $set.priority = parsed.priority;
  if (parsed.assignedToId !== undefined) $set.assignedToId = parsed.assignedToId || null;
  if (parsed.dueAt !== undefined) $set.dueAt = parsed.dueAt ? new Date(parsed.dueAt) : null;
  if (parsed.links !== undefined) $set.links = parsed.links;

  await Task.updateOne({ _id: parsed.taskId, brandId: brand._id }, { $set });
  await logActivity({
    brandId: String(brand._id),
    actorId: session.user.id,
    kind: "task_updated",
    summary: `edited "${parsed.title ?? "task"}"`,
    entityType: "task",
    entityId: parsed.taskId,
    href: `/b/${parsed.brandSlug}/tasks/${parsed.taskId}`,
  });
  bustStatsCache();
  revalidatePath(`/b/${parsed.brandSlug}/tasks/${parsed.taskId}`);
  revalidatePath(`/b/${parsed.brandSlug}/tasks`);
  revalidatePath(`/b/${parsed.brandSlug}`);
}

const addCommentSchema = z.object({
  brandSlug: z.string(),
  taskId: z.string(),
  body: z.string().min(1).max(10000),
});

export async function addTaskComment(input: unknown) {
  const parsed = addCommentSchema.parse(input);
  const { session } = await requireBrandAccess(parsed.brandSlug);
  await connectDb();
  const brand = await Brand.findOne({ slug: parsed.brandSlug }).lean();
  if (!brand) throw new Error("Brand not found");
  const task = await Task.findOne({ _id: parsed.taskId, brandId: brand._id }).lean();
  if (!task) throw new Error("Task not found");

  await TaskComment.create({
    taskId: task._id,
    authorId: session.user.id,
    body: parsed.body,
  });
  await logActivity({
    brandId: String(brand._id),
    actorId: session.user.id,
    kind: "task_commented",
    summary: `commented on "${task.title}"`,
    entityType: "task",
    entityId: parsed.taskId,
    href: `/b/${parsed.brandSlug}/tasks/${parsed.taskId}`,
  });

  // Fire-and-forget @mention notifications.
  notifyMentions({
    body: parsed.body,
    brandId: brand._id,
    brandName: brand.name,
    brandSlug: parsed.brandSlug,
    taskId: parsed.taskId,
    taskTitle: task.title,
    actorName: session.user.name ?? session.user.email ?? "Someone",
    actorId: session.user.id,
  }).catch(() => {
    /* email failures must not break comment posting */
  });

  revalidatePath(`/b/${parsed.brandSlug}/tasks/${parsed.taskId}`);
}

/** Parse @first-last / @first tokens and email matching brand members. */
async function notifyMentions(input: {
  body: string;
  brandId: unknown;
  brandName: string;
  brandSlug: string;
  taskId: string;
  taskTitle: string;
  actorName: string;
  actorId: string;
}) {
  if (!process.env.RESEND_API_KEY) return;
  const tokens = Array.from(input.body.matchAll(/@([a-zA-Z][\w-]{1,40})/g)).map(
    (m) => m[1].toLowerCase()
  );
  if (tokens.length === 0) return;

  const memberships = await Membership.find({ brandId: input.brandId })
    .populate("userId")
    .lean();

  const uniqueMatches = new Map<string, { email: string; name: string }>();
  for (const m of memberships) {
    const u = m.userId as unknown as {
      _id: { toString(): string };
      name?: string;
      email: string;
    } | null;
    if (!u) continue;
    if (String(u._id) === input.actorId) continue;
    const nameSlug = (u.name ?? u.email.split("@")[0])
      .toLowerCase()
      .replace(/\s+/g, "-");
    const emailLocal = u.email.split("@")[0].toLowerCase();
    if (tokens.includes(nameSlug) || tokens.includes(emailLocal)) {
      uniqueMatches.set(u.email, {
        email: u.email,
        name: u.name ?? u.email,
      });
    }
  }
  if (uniqueMatches.size === 0) return;

  const base = process.env.NEXTAUTH_URL ?? "https://xentrix-master-dashboard.vercel.app";
  const url = `${base}/b/${input.brandSlug}/tasks/${input.taskId}`;
  const from = process.env.RESEND_FROM ?? "Xentrix <no-reply@xentrix.xyz>";

  await Promise.all(
    [...uniqueMatches.values()].map((m) =>
      sendEmailViaResend({
        from,
        to: m.email,
        ...mentionEmail({
          toName: m.name,
          fromName: input.actorName,
          brandName: input.brandName,
          taskTitle: input.taskTitle,
          commentBody: input.body,
          url,
        }),
      })
    )
  );
}

const editCommentSchema = z.object({
  brandSlug: z.string(),
  commentId: z.string(),
  taskId: z.string(),
  body: z.string().min(1).max(10000),
});

export type EditCommentResult = { ok: true } | { ok: false; error: string };

export async function editTaskComment(
  input: unknown
): Promise<EditCommentResult> {
  const parsed = editCommentSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }
  const { session } = await requireBrandAccess(parsed.data.brandSlug);
  await connectDb();
  const comment = await TaskComment.findById(parsed.data.commentId).lean();
  if (!comment) return { ok: false, error: "Comment not found" };
  if (
    !session.user.isFounder &&
    String(comment.authorId) !== String(session.user.id)
  ) {
    return { ok: false, error: "Only the author can edit a comment." };
  }
  await TaskComment.updateOne(
    { _id: parsed.data.commentId },
    { $set: { body: parsed.data.body, editedAt: new Date() } }
  );
  revalidatePath(`/b/${parsed.data.brandSlug}/tasks/${parsed.data.taskId}`);
  return { ok: true };
}

export async function deleteTaskComment(input: unknown) {
  const parsed = z
    .object({
      brandSlug: z.string(),
      taskId: z.string(),
      commentId: z.string(),
    })
    .parse(input);
  const { session } = await requireBrandAccess(parsed.brandSlug);
  await connectDb();
  const comment = await TaskComment.findById(parsed.commentId).lean();
  if (!comment) return;
  if (
    !session.user.isFounder &&
    String(comment.authorId) !== String(session.user.id)
  ) {
    throw new Error("Only the author can delete a comment.");
  }
  await TaskComment.deleteOne({ _id: parsed.commentId });
  revalidatePath(`/b/${parsed.brandSlug}/tasks/${parsed.taskId}`);
}

export async function deleteTask(input: unknown) {
  const parsed = z
    .object({ brandSlug: z.string(), taskId: z.string() })
    .parse(input);
  const { session } = await requireBrandAccess(parsed.brandSlug, "manager");
  await connectDb();
  const brand = await Brand.findOne({ slug: parsed.brandSlug }).lean();
  if (!brand) throw new Error("Brand not found");
  const task = await Task.findOne({ _id: parsed.taskId, brandId: brand._id }).lean();
  await Task.deleteOne({ _id: parsed.taskId, brandId: brand._id });
  await TaskComment.deleteMany({ taskId: parsed.taskId });
  await logActivity({
    brandId: String(brand._id),
    actorId: session.user.id,
    kind: "task_deleted",
    summary: `deleted "${task?.title ?? "task"}"`,
    entityType: "task",
    entityId: parsed.taskId,
  });
  bustStatsCache();
  revalidatePath(`/b/${parsed.brandSlug}/tasks`);
  revalidatePath(`/b/${parsed.brandSlug}`);
  redirect(`/b/${parsed.brandSlug}/tasks`);
}

export type BrandMember = {
  id: string;
  name: string;
  email: string;
  role: string;
};

export async function listBrandMembers(brandSlug: string): Promise<BrandMember[]> {
  await requireBrandAccess(brandSlug);
  await connectDb();
  const brand = await Brand.findOne({ slug: brandSlug }).lean();
  if (!brand) return [];
  const rows = await Membership.find({ brandId: brand._id }).populate("userId").lean();
  const out: BrandMember[] = [];
  for (const r of rows) {
    const u = r.userId as unknown as {
      _id: { toString(): string };
      name?: string;
      email: string;
    } | null;
    if (!u) continue;
    out.push({
      id: u._id.toString(),
      name: u.name ?? u.email,
      email: u.email,
      role: r.role,
    });
  }
  return out;
}
