import { Router } from "express";
import { z } from "zod";
import type { ServedQuestion as ServedQuestionPayload, SubmitAnswerResponse } from "@react-quiz-1000/shared";

import { requireAuth, getAuth } from "../lib/auth.js";
import { Session } from "../models/Session.js";
import { Attempt } from "../models/Attempt.js";
import { UserStats } from "../models/UserStats.js";
import { ServedQuestion } from "../models/ServedQuestion.js";
import { makeNonce } from "../lib/nonce.js";
import { QUESTION_BANK, getQuestionById } from "../questions/index.js";
import { pickNextQuestion, updateRating, nextTimeLimitSec } from "../lib/adaptive.js";
import { evaluateBadgesAfterAnswer } from "../badges/evaluate.js";

export const sessionRouter = Router();

sessionRouter.post("/start", requireAuth, async (req, res) => {
  const auth = getAuth(req);
  const session = await Session.create({ userId: auth.sub });
  return res.json({ sessionId: session._id.toString() });
});

sessionRouter.get("/:sessionId/question", requireAuth, async (req, res) => {
  const auth = getAuth(req);
  const sessionId = req.params.sessionId;

  const session = await Session.findOne({ _id: sessionId, userId: auth.sub });
  if (!session) return res.status(404).json({ error: "session_not_found" });

  const attempts = await Attempt.find({ sessionId: session._id }).select({ questionId: 1 });
  const seen = new Set(attempts.map((a) => a.questionId));

  const q = pickNextQuestion({ bank: QUESTION_BANK, rating: session.rating, topicMastery: session.topicMastery, seenIds: seen });
  const timeLimitSec = nextTimeLimitSec({ rating: session.rating, difficulty: q.difficulty });

  const nonce = makeNonce(16);
  const issuedAt = new Date();
  const expiresAt = new Date(Date.now() + (timeLimitSec + 10) * 1000); // small grace
  const servedDoc = await ServedQuestion.create({
    sessionId: session._id,
    userId: auth.sub,
    questionId: q.id,
    nonce,
    issuedAt,
    expiresAt
  });

  const served: ServedQuestionPayload = {
    sessionId: session._id.toString(),
    question: {
      id: q.id,
      type: q.type,
      topic: q.topic,
      difficulty: q.difficulty,
      weight: q.weight,
      prompt: q.prompt,
      options: q.options,
      explanation: "" // client receives explanation only after answering
    },
    timeLimitSec,
    servedToken: servedDoc.nonce
  };

  return res.json(served);
});

sessionRouter.post("/:sessionId/answer", requireAuth, async (req, res) => {
  const auth = getAuth(req);
  const sessionId = req.params.sessionId;

  const body = z
    .object({
      questionId: z.string().min(1),
      selected: z.array(z.number().int().nonnegative()),
      servedToken: z.string().min(16),
      clientTimeTakenMs: z.number().int().nonnegative().optional()
    })
    .safeParse(req.body);

  if (!body.success) return res.status(400).json({ error: "invalid_body" });

  const session = await Session.findOne({ _id: sessionId, userId: auth.sub });
  if (!session) return res.status(404).json({ error: "session_not_found" });

  const q = getQuestionById(body.data.questionId);
  if (!q) return res.status(404).json({ error: "question_not_found" });

  // Anti-cheat: validate served token (one-time, tied to user+session+question, server-timed)
  const served = await ServedQuestion.findOne({
    nonce: body.data.servedToken,
    sessionId: session._id,
    userId: auth.sub,
    questionId: q.id
  });
  if (!served) return res.status(400).json({ error: "invalid_served_token" });
  if (served.usedAt) return res.status(400).json({ error: "served_token_used" });
  if (served.expiresAt < new Date()) return res.status(400).json({ error: "served_token_expired" });
  served.usedAt = new Date();
  await served.save();

  const serverTimeTakenMs = Math.max(0, Date.now() - new Date(served.issuedAt).getTime());

  const selectedSorted = [...new Set(body.data.selected)].sort((a, b) => a - b);
  const answerSorted = [...q.answer].sort((a, b) => a - b);
  const correct = selectedSorted.length === answerSorted.length && selectedSorted.every((v, i) => v === answerSorted[i]);

  const timeLimitSec = nextTimeLimitSec({ rating: session.rating, difficulty: q.difficulty });
  const { delta, newRating } = updateRating({
    rating: session.rating,
    correct,
    difficulty: q.difficulty,
    timeTakenMs: serverTimeTakenMs,
    timeLimitSec
  });

  session.rating = newRating;
  session.totalAnswered += 1;
  session.streak = correct ? session.streak + 1 : 0;
  const m = Number((session.topicMastery as any)[q.topic] ?? 0);
  (session.topicMastery as any)[q.topic] = Math.max(-3, Math.min(3, m + (correct ? 0.25 : -0.35)));
  await session.save();

  await Attempt.create({
    sessionId: session._id,
    userId: auth.sub,
    questionId: q.id,
    topic: q.topic,
    selected: selectedSorted,
    correct,
    timeTakenMs: serverTimeTakenMs
  });

  // Update per-user stats for leaderboards
  const stats = (await UserStats.findOne({ userId: auth.sub })) ?? (await UserStats.create({ userId: auth.sub }));
  const nPrev = stats.totalAnswered;
  stats.totalAnswered = nPrev + 1;
  stats.totalCorrect = stats.totalCorrect + (correct ? 1 : 0);
  stats.rating = newRating;
  stats.bestStreak = Math.max(stats.bestStreak, session.streak);
  stats.avgTimeMs = Math.round((stats.avgTimeMs * nPrev + serverTimeTakenMs) / (nPrev + 1));
  stats.updatedAt = new Date();
  await stats.save();

  const badgeResult = await evaluateBadgesAfterAnswer({
    userId: auth.sub,
    sessionId: session._id.toString(),
    wasCorrect: correct,
    newStreak: session.streak
  });

  const resp: SubmitAnswerResponse = {
    correct,
    correctAnswer: q.answer,
    explanation: q.explanation,
    ratingDelta: delta,
    newRating,
    newStreak: session.streak,
    nextTimeLimitSec: nextTimeLimitSec({ rating: newRating, difficulty: q.difficulty }),
    unlockedBadges: badgeResult.unlockedDefs
  };

  return res.json(resp);
});
