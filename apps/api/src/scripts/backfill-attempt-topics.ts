import dotenv from "dotenv";
import { connectDb } from "../lib/db.js";
import { Attempt } from "../models/Attempt.js";
import { QUESTION_BANK } from "../questions/index.js";

dotenv.config();

const topicByQuestionId = new Map(QUESTION_BANK.map((q) => [q.id, q.topic] as const));

async function main() {
  await connectDb();

  const cursor = Attempt.find({ $or: [{ topic: { $exists: false } }, { topic: null }] })
    .select({ _id: 1, questionId: 1 })
    .cursor();

  let batch: Array<{ id: string; topic: string }> = [];
  let updated = 0;
  let skipped = 0;

  async function flush() {
    if (batch.length === 0) return;
    const ops = batch.map((x) => ({
      updateOne: {
        filter: { _id: x.id },
        update: { $set: { topic: x.topic } }
      }
    }));
    await Attempt.bulkWrite(ops);
    updated += batch.length;
    batch = [];
  }

  for await (const doc of cursor as any) {
    const topic = topicByQuestionId.get(String(doc.questionId));
    if (!topic) {
      skipped += 1;
      continue;
    }
    batch.push({ id: String(doc._id), topic });
    if (batch.length >= 500) await flush();
  }

  await flush();

  // eslint-disable-next-line no-console
  console.log(`[backfill] updated=${updated} skipped=${skipped}`);
  process.exit(0);
}

main().catch((err) => {
  // eslint-disable-next-line no-console
  console.error(err);
  process.exit(1);
});
