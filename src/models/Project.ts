import { Schema, model, models, type InferSchemaType, type Model } from "mongoose";
import { PROJECT_STAGES } from "./types";

const ProjectSchema = new Schema(
  {
    brandId: { type: Schema.Types.ObjectId, ref: "Brand", required: true, index: true },
    name: { type: String, required: true },
    slug: { type: String, required: true },
    description: { type: String },
    stage: { type: String, enum: PROJECT_STAGES, default: "discovery" },
    progress: { type: Number, default: 0, min: 0, max: 100 },
    startDate: { type: Date },
    dueDate: { type: Date },
    liveUrl: { type: String },
    repoUrl: { type: String },
    leadUserId: { type: Schema.Types.ObjectId, ref: "User", default: null },
    archivedAt: { type: Date, default: null },
  },
  { timestamps: true }
);

ProjectSchema.index({ brandId: 1, slug: 1 }, { unique: true });
ProjectSchema.index({ brandId: 1, stage: 1 });

export type ProjectDoc = InferSchemaType<typeof ProjectSchema> & { _id: Schema.Types.ObjectId };

export const Project: Model<ProjectDoc> =
  (models.Project as Model<ProjectDoc>) || model<ProjectDoc>("Project", ProjectSchema);
