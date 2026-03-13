import mongoose, { type InferSchemaType } from "mongoose";

const ServedQuestionSchema = new mongoose.Schema(
  {
    sessionId: { type: mongoose.Schema.Types.ObjectId, ref: "Session", required: true, index: true },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    questionId: { type: String, required: true, index: true },
    nonce: { type: String, required: true, unique: true, index: true },
    issuedAt: { type: Date, required: true },
    expiresAt: { type: Date, required: true, index: true },
    usedAt: { type: Date, required: false }
  },
  { versionKey: false }
);

export type ServedQuestionDoc = InferSchemaType<typeof ServedQuestionSchema> & { _id: mongoose.Types.ObjectId };

export const ServedQuestion =
  mongoose.models.ServedQuestion ?? mongoose.model("ServedQuestion", ServedQuestionSchema);
