import type { Types } from "mongoose";
import { ActivityEvent, type ActivityKind } from "@/models";

/**
 * Fire-and-forget activity log write. Callers should have already ensured
 * connectDb() ran for the current operation.
 */
export async function logActivity(input: {
  brandId: Types.ObjectId | string;
  actorId?: Types.ObjectId | string | null;
  kind: ActivityKind;
  summary: string;
  entityType?: string;
  entityId?: string;
  href?: string;
  metadata?: Record<string, unknown>;
}) {
  try {
    await ActivityEvent.create({
      brandId: input.brandId,
      actorId: input.actorId ?? null,
      kind: input.kind,
      summary: input.summary,
      entityType: input.entityType,
      entityId: input.entityId,
      href: input.href,
      metadata: input.metadata,
    });
  } catch {
    // Activity logging must never break the write path.
  }
}
