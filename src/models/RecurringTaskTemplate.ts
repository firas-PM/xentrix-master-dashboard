import { Schema, model, models, type InferSchemaType, type Model } from "mongoose";
import { RECURRENCE_FREQS, TASK_KINDS, TASK_PRIORITIES } from "./types";

const RecurringTaskTemplateSchema = new Schema(
  {
    brandId: { type: Schema.Types.ObjectId, ref: "Brand", required: true, index: true },
    projectId: { type: Schema.Types.ObjectId, ref: "Project", default: null },
    title: { type: String, required: true },
    description: { type: String },
    kind: { type: String, enum: TASK_KINDS, default: "chore" },
    priority: { type: String, enum: TASK_PRIORITIES, default: "normal" },
    defaultAssigneeId: { type: Schema.Types.ObjectId, ref: "User", default: null },
    frequency: { type: String, enum: RECURRENCE_FREQS, default: "daily" },
    schedule: {
      daysOfWeek: { type: [Number], default: undefined }, // 0..6 for weekly
      dayOfMonth: { type: Number }, // 1..31 for monthly
      time: { type: String, required: true }, // HH:mm in brand timezone
    },
    active: { type: Boolean, default: true },
    lastRunAt: { type: Date, default: null },
  },
  { timestamps: true }
);

export type RecurringTaskTemplateDoc = InferSchemaType<typeof RecurringTaskTemplateSchema> & {
  _id: Schema.Types.ObjectId;
};

export const RecurringTaskTemplate: Model<RecurringTaskTemplateDoc> =
  (models.RecurringTaskTemplate as Model<RecurringTaskTemplateDoc>) ||
  model<RecurringTaskTemplateDoc>("RecurringTaskTemplate", RecurringTaskTemplateSchema);
