import mongoose, { type InferSchemaType } from "mongoose";

export type SocialEventKind = "encourage" | "react";

const SocialEventSchema = new mongoose.Schema(
  {
    kind: { type: String, required: true, enum: ["encourage", "react"] },
    fromUserId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    toUserId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    lane: { type: String, required: true, enum: ["followers", "anyone"] },
    template: { type: String, required: true },
    emoji: { type: String, required: false },
    createdAt: { type: Date, required: true, default: () => new Date(), index: true }
  },
  { versionKey: false }
);

export type SocialEventDoc = InferSchemaType<typeof SocialEventSchema> & { _id: mongoose.Types.ObjectId };

export const SocialEvent = mongoose.models.SocialEvent ?? mongoose.model("SocialEvent", SocialEventSchema);
