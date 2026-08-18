import { Schema, model, models, type InferSchemaType, type Model } from "mongoose";
import { BRAND_SECTORS } from "./types";

const BrandSchema = new Schema(
  {
    slug: { type: String, required: true, unique: true, lowercase: true, index: true },
    name: { type: String, required: true },
    sector: { type: String, enum: BRAND_SECTORS, default: "other" },
    color: { type: String, default: "#6366f1" },
    logoUrl: { type: String },
    description: { type: String },
    timezone: { type: String, default: "Africa/Tunis" },
    isXentrixManaged: { type: Boolean, default: true },
    archivedAt: { type: Date, default: null },
  },
  { timestamps: true }
);

export type BrandDoc = InferSchemaType<typeof BrandSchema> & { _id: Schema.Types.ObjectId };

export const Brand: Model<BrandDoc> =
  (models.Brand as Model<BrandDoc>) || model<BrandDoc>("Brand", BrandSchema);
