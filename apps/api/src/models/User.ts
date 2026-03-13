import mongoose, { type InferSchemaType } from "mongoose";

const UserSchema = new mongoose.Schema(
  {
    email: { type: String, required: true, unique: true, index: true },
    passwordHash: { type: String, required: true },
    displayName: { type: String, required: true },
    role: { type: String, required: true, default: "user", enum: ["user", "mod", "admin"] },
    banned: { type: Boolean, required: true, default: false },
    shadowbanned: { type: Boolean, required: true, default: false },
    mutedSocialUntil: { type: Date, required: false },
    createdAt: { type: Date, required: true, default: () => new Date() }
  },
  { versionKey: false }
);

export type UserDoc = InferSchemaType<typeof UserSchema> & { _id: mongoose.Types.ObjectId };

export const User = mongoose.models.User ?? mongoose.model("User", UserSchema);
