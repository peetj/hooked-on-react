import mongoose, { type InferSchemaType } from "mongoose";

const AttemptSchema = new mongoose.Schema(
  {
    sessionId: { type: mongoose.Schema.Types.ObjectId, ref: "Session", required: true, index: true },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    questionId: { type: String, required: true, index: true },
    selected: { type: [Number], required: true },
    correct: { type: Boolean, required: true },
    timeTakenMs: { type: Number, required: true },
    createdAt: { type: Date, required: true, default: () => new Date() }
  },
  { versionKey: false }
);

export type AttemptDoc = InferSchemaType<typeof AttemptSchema> & { _id: mongoose.Types.ObjectId };

export const Attempt = mongoose.models.Attempt ?? mongoose.model("Attempt", AttemptSchema);
