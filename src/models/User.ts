import { Schema, model, models, type InferSchemaType, type Model } from "mongoose";

const UserSchema = new Schema(
  {
    name: { type: String },
    email: { type: String, required: true, unique: true, lowercase: true, index: true },
    emailVerified: { type: Date, default: null },
    image: { type: String },
    passwordHash: { type: String },
    isFounder: { type: Boolean, default: false },
    /** When set, the user can't sign in. Sessions already issued expire on next JWT refresh. */
    deactivatedAt: { type: Date, default: null },
    /** Increments on password reset so magic-link and reset-token reuse is blocked. */
    tokenVersion: { type: Number, default: 0 },
  },
  { timestamps: true }
);

export type UserDoc = InferSchemaType<typeof UserSchema> & { _id: Schema.Types.ObjectId };

export const User: Model<UserDoc> =
  (models.User as Model<UserDoc>) || model<UserDoc>("User", UserSchema);
