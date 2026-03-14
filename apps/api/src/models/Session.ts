import mongoose, { type InferSchemaType } from "mongoose";

const SessionSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    createdAt: { type: Date, required: true, default: () => new Date() },
    stream: { type: String, required: true, default: "adaptive" },
    mode: { type: String, required: true, default: "ranked" },
    rating: { type: Number, required: true, default: 0 },
    streak: { type: Number, required: true, default: 0 },
    totalAnswered: { type: Number, required: true, default: 0 },
    correctCount: { type: Number, required: true, default: 0 },
    wrongCount: { type: Number, required: true, default: 0 },
    topicMastery: { type: Object, required: true, default: {} }
  },
  { versionKey: false }
);

export type SessionDoc = InferSchemaType<typeof SessionSchema> & { _id: mongoose.Types.ObjectId };

export const Session = mongoose.models.Session ?? mongoose.model("Session", SessionSchema);
