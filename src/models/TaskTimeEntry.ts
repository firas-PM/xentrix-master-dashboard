import { Schema, model, models, type InferSchemaType, type Model } from "mongoose";

const TaskTimeEntrySchema = new Schema(
  {
    taskId: { type: Schema.Types.ObjectId, ref: "Task", required: true, index: true },
    brandId: { type: Schema.Types.ObjectId, ref: "Brand", required: true, index: true },
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    minutes: { type: Number, required: true, min: 1, max: 24 * 60 },
    note: { type: String, default: null },
    /** When the work was done (may differ from createdAt if backdated). */
    workedAt: { type: Date, default: () => new Date(), index: true },
  },
  { timestamps: true }
);

TaskTimeEntrySchema.index({ brandId: 1, workedAt: -1 });
TaskTimeEntrySchema.index({ userId: 1, workedAt: -1 });

export type TaskTimeEntryDoc = InferSchemaType<typeof TaskTimeEntrySchema> & {
  _id: Schema.Types.ObjectId;
};

export const TaskTimeEntry: Model<TaskTimeEntryDoc> =
  (models.TaskTimeEntry as Model<TaskTimeEntryDoc>) ||
  model<TaskTimeEntryDoc>("TaskTimeEntry", TaskTimeEntrySchema);
