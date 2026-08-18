import { Schema, model, models, type InferSchemaType, type Model } from "mongoose";

const UserSchema = new Schema(
  {
    name: { type: String },
    email: { type: String, required: true, unique: true, lowercase: true, index: true },
    emailVerified: { type: Date, default: null },
    image: { type: String },
    passwordHash: { type: String },
    isFounder: { type: Boolean, default: false },
  },
  { timestamps: true }
);

export type UserDoc = InferSchemaType<typeof UserSchema> & { _id: Schema.Types.ObjectId };

export const User: Model<UserDoc> =
  (models.User as Model<UserDoc>) || model<UserDoc>("User", UserSchema);
