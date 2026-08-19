import { Schema, model, models, type InferSchemaType, type Model } from "mongoose";

export const NOTIFICATION_KINDS = ["mention", "assignment", "system"] as const;
export type NotificationKind = (typeof NOTIFICATION_KINDS)[number];

const NotificationSchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    kind: { type: String, enum: NOTIFICATION_KINDS, default: "mention" },
    summary: { type: String, required: true },
    href: { type: String, required: true },
    /** Optional actor for attribution display. */
    actorId: { type: Schema.Types.ObjectId, ref: "User", default: null },
    /** Optional brand context (e.g. a mention in a Bake+Brew task). */
    brandId: { type: Schema.Types.ObjectId, ref: "Brand", default: null },
    readAt: { type: Date, default: null, index: true },
  },
  { timestamps: true }
);

NotificationSchema.index({ userId: 1, readAt: 1, createdAt: -1 });

export type NotificationDoc = InferSchemaType<typeof NotificationSchema> & {
  _id: Schema.Types.ObjectId;
};

export const Notification: Model<NotificationDoc> =
  (models.Notification as Model<NotificationDoc>) ||
  model<NotificationDoc>("Notification", NotificationSchema);
