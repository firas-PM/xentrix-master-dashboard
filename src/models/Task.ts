import { Schema, model, models, type InferSchemaType, type Model } from "mongoose";
import { TASK_KINDS, TASK_PRIORITIES, TASK_STATUSES } from "./types";

const TaskSchema = new Schema(
  {
    brandId: { type: Schema.Types.ObjectId, ref: "Brand", required: true, index: true },
    projectId: { type: Schema.Types.ObjectId, ref: "Project", default: null, index: true },
    parentTaskId: { type: Schema.Types.ObjectId, ref: "Task", default: null },
    title: { type: String, required: true },
    description: { type: String },
    kind: { type: String, enum: TASK_KINDS, default: "ops" },
    status: { type: String, enum: TASK_STATUSES, default: "todo", index: true },
    priority: { type: String, enum: TASK_PRIORITIES, default: "normal" },
    assignedToId: { type: Schema.Types.ObjectId, ref: "User", default: null, index: true },
    createdById: { type: Schema.Types.ObjectId, ref: "User", default: null },
    dueAt: { type: Date, default: null, index: true },
    completedAt: { type: Date, default: null },
    estimateMinutes: { type: Number },
    /** External links attached to the task (Figma, GitHub, Google Doc, etc.) */
    links: {
      type: [
        {
          label: { type: String, required: true },
          url: { type: String, required: true },
          _id: false,
        },
      ],
      default: [],
    },
    metadata: { type: Schema.Types.Mixed },
    recurringTemplateId: { type: Schema.Types.ObjectId, ref: "RecurringTaskTemplate", default: null },
  },
  { timestamps: true }
);

TaskSchema.index({ brandId: 1, status: 1 });
TaskSchema.index({ assignedToId: 1, status: 1 });

export type TaskDoc = InferSchemaType<typeof TaskSchema> & { _id: Schema.Types.ObjectId };

export const Task: Model<TaskDoc> =
  (models.Task as Model<TaskDoc>) || model<TaskDoc>("Task", TaskSchema);
