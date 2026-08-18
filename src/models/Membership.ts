import { Schema, model, models, type InferSchemaType, type Model } from "mongoose";
import { ROLES } from "./types";

const MembershipSchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    brandId: { type: Schema.Types.ObjectId, ref: "Brand", required: true, index: true },
    role: { type: String, enum: ROLES, default: "worker" },
    title: { type: String },
  },
  { timestamps: true }
);

MembershipSchema.index({ userId: 1, brandId: 1 }, { unique: true });

export type MembershipDoc = InferSchemaType<typeof MembershipSchema> & {
  _id: Schema.Types.ObjectId;
};

export const Membership: Model<MembershipDoc> =
  (models.Membership as Model<MembershipDoc>) ||
  model<MembershipDoc>("Membership", MembershipSchema);
