import mongoose, { type InferSchemaType } from "mongoose";

const BadgeUnlockSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    badgeId: { type: String, required: true },
    unlockedAt: { type: Date, required: true, default: () => new Date(), index: true }
  },
  { versionKey: false }
);

BadgeUnlockSchema.index({ userId: 1, badgeId: 1 }, { unique: true });

export type BadgeUnlockDoc = InferSchemaType<typeof BadgeUnlockSchema> & { _id: mongoose.Types.ObjectId };

export const BadgeUnlock = mongoose.models.BadgeUnlock ?? mongoose.model("BadgeUnlock", BadgeUnlockSchema);
