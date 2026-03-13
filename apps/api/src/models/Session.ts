import mongoose, { type InferSchemaType } from "mongoose";

const SessionSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    createdAt: { type: Date, required: true, default: () => new Date() },
    rating: { type: Number, required: true, default: 0 },
    streak: { type: Number, required: true, default: 0 },
    totalAnswered: { type: Number, required: true, default: 0 },
    topicMastery: { type: Object, required: true, default: {} }
  },
  { versionKey: false }
);

export type SessionDoc = InferSchemaType<typeof SessionSchema> & { _id: mongoose.Types.ObjectId };

export const Session = mongoose.models.Session ?? mongoose.model("Session", SessionSchema);
