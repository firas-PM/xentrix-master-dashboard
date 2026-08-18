import { Schema, model, models, type InferSchemaType, type Model } from "mongoose";

const TaskCommentSchema = new Schema(
  {
    taskId: { type: Schema.Types.ObjectId, ref: "Task", required: true, index: true },
    authorId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    body: { type: String, required: true },
  },
  { timestamps: true }
);

export type TaskCommentDoc = InferSchemaType<typeof TaskCommentSchema> & {
  _id: Schema.Types.ObjectId;
};

export const TaskComment: Model<TaskCommentDoc> =
  (models.TaskComment as Model<TaskCommentDoc>) ||
  model<TaskCommentDoc>("TaskComment", TaskCommentSchema);
