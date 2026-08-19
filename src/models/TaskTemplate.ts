import { Schema, model, models, type InferSchemaType, type Model } from "mongoose";
import { TASK_KINDS, TASK_PRIORITIES } from "./types";

const TaskTemplateSchema = new Schema(
  {
    brandId: { type: Schema.Types.ObjectId, ref: "Brand", required: true, index: true },
    title: { type: String, required: true },
    description: { type: String, default: null },
    kind: { type: String, enum: TASK_KINDS, default: "ops" },
    priority: { type: String, enum: TASK_PRIORITIES, default: "normal" },
    defaultAssigneeId: { type: Schema.Types.ObjectId, ref: "User", default: null },
    projectId: { type: Schema.Types.ObjectId, ref: "Project", default: null },
    estimateMinutes: { type: Number },
    createdById: { type: Schema.Types.ObjectId, ref: "User", default: null },
  },
  { timestamps: true }
);

TaskTemplateSchema.index({ brandId: 1, title: 1 });

export type TaskTemplateDoc = InferSchemaType<typeof TaskTemplateSchema> & {
  _id: Schema.Types.ObjectId;
};

export const TaskTemplate: Model<TaskTemplateDoc> =
  (models.TaskTemplate as Model<TaskTemplateDoc>) ||
  model<TaskTemplateDoc>("TaskTemplate", TaskTemplateSchema);
