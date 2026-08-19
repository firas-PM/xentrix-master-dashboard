import { Schema, model, models, type InferSchemaType, type Model } from "mongoose";

export const ACTIVITY_KINDS = [
  "task_created",
  "task_status_changed",
  "task_updated",
  "task_deleted",
  "task_commented",
  "project_created",
  "project_updated",
  "brand_created",
  "brand_updated",
  "brand_archived",
  "brand_restored",
] as const;
export type ActivityKind = (typeof ACTIVITY_KINDS)[number];

const ActivityEventSchema = new Schema(
  {
    brandId: { type: Schema.Types.ObjectId, ref: "Brand", required: true, index: true },
    actorId: { type: Schema.Types.ObjectId, ref: "User", default: null },
    kind: { type: String, enum: ACTIVITY_KINDS, required: true },
    /** Short human sentence — cached snapshot so we don't re-render historical state. */
    summary: { type: String, required: true },
    entityType: { type: String },
    entityId: { type: String },
    href: { type: String },
    metadata: { type: Schema.Types.Mixed },
  },
  { timestamps: true }
);

ActivityEventSchema.index({ brandId: 1, createdAt: -1 });

export type ActivityEventDoc = InferSchemaType<typeof ActivityEventSchema> & {
  _id: Schema.Types.ObjectId;
};

export const ActivityEvent: Model<ActivityEventDoc> =
  (models.ActivityEvent as Model<ActivityEventDoc>) ||
  model<ActivityEventDoc>("ActivityEvent", ActivityEventSchema);
