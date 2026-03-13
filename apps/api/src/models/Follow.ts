import mongoose, { type InferSchemaType } from "mongoose";

const FollowSchema = new mongoose.Schema(
  {
    fromUserId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    toUserId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    createdAt: { type: Date, required: true, default: () => new Date() }
  },
  { versionKey: false }
);

FollowSchema.index({ fromUserId: 1, toUserId: 1 }, { unique: true });

export type FollowDoc = InferSchemaType<typeof FollowSchema> & { _id: mongoose.Types.ObjectId };

export const Follow = mongoose.models.Follow ?? mongoose.model("Follow", FollowSchema);
