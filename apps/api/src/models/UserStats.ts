import mongoose, { type InferSchemaType } from "mongoose";

const StreamStatsSchema = new mongoose.Schema(
  {
    rating: { type: Number, required: true, default: 0 },
    totalAnswered: { type: Number, required: true, default: 0 },
    totalCorrect: { type: Number, required: true, default: 0 },
    bestStreak: { type: Number, required: true, default: 0 },
    avgTimeMs: { type: Number, required: true, default: 0 },
    updatedAt: { type: Date, required: true, default: () => new Date() }
  },
  { _id: false }
);

const UserStatsSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, unique: true, index: true },
    rating: { type: Number, required: true, default: 0 },
    totalAnswered: { type: Number, required: true, default: 0 },
    totalCorrect: { type: Number, required: true, default: 0 },
    bestStreak: { type: Number, required: true, default: 0 },
    avgTimeMs: { type: Number, required: true, default: 0 },
    streams: {
      adaptive: { type: StreamStatsSchema, required: true, default: () => ({}) },
      "1": { type: StreamStatsSchema, required: true, default: () => ({}) },
      "2": { type: StreamStatsSchema, required: true, default: () => ({}) },
      "3": { type: StreamStatsSchema, required: true, default: () => ({}) },
      "4": { type: StreamStatsSchema, required: true, default: () => ({}) },
      "5": { type: StreamStatsSchema, required: true, default: () => ({}) }
    },
    updatedAt: { type: Date, required: true, default: () => new Date(), index: true }
  },
  { versionKey: false }
);

export type UserStatsDoc = InferSchemaType<typeof UserStatsSchema> & { _id: mongoose.Types.ObjectId };

export const UserStats = mongoose.models.UserStats ?? mongoose.model("UserStats", UserStatsSchema);
