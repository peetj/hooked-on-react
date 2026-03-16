import { Router } from "express";
import { z } from "zod";
import type { QuizStream, SessionMode, ServedQuestion as ServedQuestionPayload, SubmitAnswerResponse } from "@react-quiz-1000/shared";

import { requireAuth, getAuth } from "../lib/auth.js";
import { Session } from "../models/Session.js";
import { Attempt } from "../models/Attempt.js";
import { UserStats } from "../models/UserStats.js";
import { ServedQuestion, type ServedQuestionDoc } from "../models/ServedQuestion.js";
import { makeNonce } from "../lib/nonce.js";
import { QUESTION_BANK, getQuestionById } from "../questions/index.js";
import { buildExplanation, getQuestionPlayground, getQuestionResources } from "../questions/resources.js";
import { pickNextQuestion, updateRating, nextTimeLimitSec } from "../lib/adaptive.js";
import { evaluateBadgesAfterAnswer } from "../badges/evaluate.js";

export const sessionRouter = Router();

const quizStreamSchema = z.enum(["adaptive", "1", "2", "3", "4", "5"]);
const sessionModeSchema = z.enum(["ranked", "practice"]);

type StreamStats = {
  rating: number;
  totalAnswered: number;
  totalCorrect: number;
  bestStreak: number;
  avgTimeMs: number;
  updatedAt: Date;
};

function getSessionMode(session: { mode?: unknown }): SessionMode {
  return session.mode === "practice" ? "practice" : "ranked";
}

function ensureStreamStats(stats: any, stream: QuizStream): StreamStats {
  if (!stats.streams) stats.streams = {};
  if (!stats.streams[stream]) {
    stats.streams[stream] = {
      rating: 0,
      totalAnswered: 0,
      totalCorrect: 0,
      bestStreak: 0,
      avgTimeMs: 0,
      updatedAt: new Date()
    };
  }
  return stats.streams[stream] as StreamStats;
}

function toServedPayload(opts: {
  session: {
    _id: { toString(): string };
    stream: QuizStream;
    mode: SessionMode;
    correctCount: number;
    wrongCount: number;
    streak: number;
  };
  servedDoc: Pick<ServedQuestionDoc, "questionId" | "nonce">;
  timeLimitSec: number;
}): ServedQuestionPayload | null {
  const q = getQuestionById(opts.servedDoc.questionId);
  if (!q) return null;

  return {
    sessionId: opts.session._id.toString(),
    stream: opts.session.stream,
    mode: getSessionMode(opts.session),
    question: {
      id: q.id,
      type: q.type,
      topic: q.topic,
      difficulty: q.difficulty,
      weight: q.weight,
      prompt: q.prompt,
      options: q.options,
      explanation: ""
    },
    timeLimitSec: opts.timeLimitSec,
    correctCount: opts.session.correctCount,
    wrongCount: opts.session.wrongCount,
    streak: opts.session.streak,
    servedToken: opts.servedDoc.nonce
  };
}

async function findReusableServedQuestion(sessionId: string, userId: string, now: Date) {
  return ServedQuestion.findOne({
    sessionId,
    userId,
    usedAt: { $exists: false },
    $or: [{ pausedAt: { $exists: true } }, { expiresAt: { $gt: now } }]
  }).sort({ issuedAt: -1 });
}

function isDuplicateKeyError(error: unknown): error is { code: number } {
  return typeof error === "object" && error !== null && "code" in error && (error as { code: number }).code === 11000;
}

async function findActiveSession(userId: string) {
  const now = new Date();
  const served = await ServedQuestion.findOne({
    userId,
    usedAt: { $exists: false },
    $or: [{ pausedAt: { $exists: true } }, { expiresAt: { $gt: now } }]
  }).sort({ issuedAt: -1 });

  if (!served) return null;

  const session = await Session.findOne({ _id: served.sessionId, userId });
  if (!session) {
    served.usedAt = now;
    await served.save();
    return null;
  }

  const mode = getSessionMode(session);
  const remainingTimeSec =
    mode === "practice"
      ? 0
      : served.pausedAt && served.remainingTimeSec
        ? served.remainingTimeSec
        : Math.max(1, Math.ceil((served.expiresAt.getTime() - now.getTime()) / 1000));

  return {
    sessionId: session._id.toString(),
    stream: session.stream as QuizStream,
    mode,
    paused: Boolean(served.pausedAt),
    remainingTimeSec,
    correctCount: session.correctCount,
    wrongCount: session.wrongCount,
    streak: session.streak
  };
}

sessionRouter.get("/active", requireAuth, async (req, res) => {
  const auth = getAuth(req);
  const active = await findActiveSession(auth.sub);
  return res.json({ active });
});

sessionRouter.post("/start", requireAuth, async (req, res) => {
  const auth = getAuth(req);
  const body = z.object({ stream: quizStreamSchema.optional(), mode: sessionModeSchema.optional() }).safeParse(req.body ?? {});
  if (!body.success) return res.status(400).json({ error: "invalid_body" });

  const session = await Session.create({ userId: auth.sub, stream: body.data.stream ?? "adaptive", mode: body.data.mode ?? "ranked" });
  return res.json({ sessionId: session._id.toString(), stream: session.stream, mode: session.mode });
});

sessionRouter.post("/:sessionId/pause", requireAuth, async (req, res) => {
  const auth = getAuth(req);
  const sessionId = String(req.params.sessionId);
  const session = await Session.findOne({ _id: sessionId, userId: auth.sub });
  if (!session) return res.status(404).json({ error: "session_not_found" });

  const served = await ServedQuestion.findOne({
    sessionId: session._id,
    userId: auth.sub,
    usedAt: { $exists: false }
  }).sort({ issuedAt: -1 });

  if (!served) return res.status(404).json({ error: "active_question_not_found" });
  const mode = getSessionMode(session);
  if (served.pausedAt) {
    return res.json({
      ok: true,
      remainingTimeSec: mode === "practice" ? 0 : served.remainingTimeSec ?? 1
    });
  }

  const remainingTimeSec = mode === "practice" ? 0 : Math.max(1, Math.ceil((served.expiresAt.getTime() - Date.now()) / 1000));
  served.pausedAt = new Date();
  served.remainingTimeSec = remainingTimeSec;
  await served.save();

  return res.json({ ok: true, remainingTimeSec });
});

sessionRouter.post("/:sessionId/resume", requireAuth, async (req, res) => {
  const auth = getAuth(req);
  const sessionId = String(req.params.sessionId);
  const session = await Session.findOne({ _id: sessionId, userId: auth.sub });
  if (!session) return res.status(404).json({ error: "session_not_found" });

  const served = await ServedQuestion.findOne({
    sessionId: session._id,
    userId: auth.sub,
    usedAt: { $exists: false },
    pausedAt: { $exists: true }
  }).sort({ issuedAt: -1 });

  if (!served) return res.status(404).json({ error: "paused_question_not_found" });

  const mode = getSessionMode(session);
  const remainingTimeSec =
    mode === "practice"
      ? 0
      : Math.max(1, served.remainingTimeSec ?? nextTimeLimitSec({ rating: session.rating, difficulty: getQuestionById(served.questionId)?.difficulty ?? 3 }));
  const now = new Date();
  served.issuedAt = now;
  served.expiresAt = mode === "practice" ? new Date(now.getTime() + 24 * 60 * 60 * 1000) : new Date(now.getTime() + (remainingTimeSec + 10) * 1000);
  served.pausedAt = undefined;
  served.remainingTimeSec = remainingTimeSec;
  await served.save();

  return res.json({ ok: true, remainingTimeSec });
});

sessionRouter.get("/:sessionId/question", requireAuth, async (req, res) => {
  const auth = getAuth(req);
  const sessionId = String(req.params.sessionId);

  const session = await Session.findOne({ _id: sessionId, userId: auth.sub });
  if (!session) return res.status(404).json({ error: "session_not_found" });

  const now = new Date();
  const mode = getSessionMode(session);
  const reusable = await findReusableServedQuestion(sessionId, auth.sub, now);
  if (reusable) {
    const timeLimitSec =
      mode === "practice"
        ? 0
        : reusable.pausedAt && reusable.remainingTimeSec
          ? reusable.remainingTimeSec
          : Math.max(1, Math.ceil((reusable.expiresAt.getTime() - now.getTime()) / 1000));
    const payload = toServedPayload({ session, servedDoc: reusable, timeLimitSec });
    if (payload) return res.json(payload);

    reusable.usedAt = now;
    await reusable.save();
  }

  await ServedQuestion.updateMany(
    {
      sessionId,
      userId: auth.sub,
      pausedAt: { $exists: false },
      usedAt: { $exists: false },
      expiresAt: { $lte: now }
    },
    { $set: { usedAt: now } }
  );

  const attempts = await Attempt.find({ sessionId: session._id }).select({ questionId: 1 });
  const seen = new Set(attempts.map((a) => a.questionId));

  const q = pickNextQuestion({
    bank: QUESTION_BANK,
    rating: session.rating,
    stream: session.stream as QuizStream,
    topicMastery: session.topicMastery,
    seenIds: seen
  });
  const timeLimitSec = mode === "practice" ? 0 : nextTimeLimitSec({ rating: session.rating, difficulty: q.difficulty });

  const nonce = makeNonce(16);
  const issuedAt = new Date();
  const expiresAt = mode === "practice" ? new Date(issuedAt.getTime() + 24 * 60 * 60 * 1000) : new Date(issuedAt.getTime() + (timeLimitSec + 10) * 1000);

  try {
    const servedDoc = await ServedQuestion.create({
      sessionId: session._id,
      userId: auth.sub,
      questionId: q.id,
      nonce,
      issuedAt,
      expiresAt,
      remainingTimeSec: timeLimitSec
    });

    const served = toServedPayload({ session, servedDoc, timeLimitSec });
    if (!served) {
      servedDoc.usedAt = new Date();
      await servedDoc.save();
      return res.status(500).json({ error: "question_not_found" });
    }

    return res.json(served);
  } catch (error) {
    if (!isDuplicateKeyError(error)) throw error;

    const activeServed = await findReusableServedQuestion(sessionId, auth.sub, new Date());
    if (!activeServed) throw error;

    const remainingSec =
      mode === "practice"
        ? 0
        : activeServed.pausedAt && activeServed.remainingTimeSec
          ? activeServed.remainingTimeSec
          : Math.max(1, Math.ceil((activeServed.expiresAt.getTime() - Date.now()) / 1000));
    const payload = toServedPayload({ session, servedDoc: activeServed, timeLimitSec: remainingSec });
    if (payload) return res.json(payload);

    activeServed.usedAt = new Date();
    await activeServed.save();
    return res.status(500).json({ error: "question_not_found" });
  }
});

sessionRouter.post("/:sessionId/answer", requireAuth, async (req, res) => {
  const auth = getAuth(req);
  const sessionId = String(req.params.sessionId);

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

  const served = await ServedQuestion.findOne({
    nonce: body.data.servedToken,
    sessionId: session._id,
    userId: auth.sub,
    questionId: q.id
  });
  if (!served) return res.status(400).json({ error: "invalid_served_token" });
  if (served.usedAt) return res.status(400).json({ error: "served_token_used" });
  const mode = getSessionMode(session);
  if (served.pausedAt) return res.status(409).json({ error: "question_paused" });
  if (mode !== "practice" && served.expiresAt < new Date()) return res.status(400).json({ error: "served_token_expired" });
  served.usedAt = new Date();
  await served.save();

  const serverTimeTakenMs = Math.max(0, Date.now() - new Date(served.issuedAt).getTime());

  const selectedSorted = [...new Set(body.data.selected)].sort((a, b) => a - b);
  const answerSorted = [...q.answer].sort((a, b) => a - b);
  const correct = selectedSorted.length === answerSorted.length && selectedSorted.every((v, i) => v === answerSorted[i]);

  const timeLimitSec = mode === "practice" ? 0 : nextTimeLimitSec({ rating: session.rating, difficulty: q.difficulty });
  const { delta, newRating } = updateRating({
    rating: session.rating,
    correct,
    difficulty: q.difficulty,
    timeTakenMs: serverTimeTakenMs,
    timeLimitSec
  });

  session.rating = newRating;
  session.totalAnswered += 1;
  session.correctCount += correct ? 1 : 0;
  session.wrongCount += correct ? 0 : 1;
  session.streak = correct ? session.streak + 1 : 0;
  const mastery = Number((session.topicMastery as any)[q.topic] ?? 0);
  (session.topicMastery as any)[q.topic] = Math.max(-3, Math.min(3, mastery + (correct ? 0.25 : -0.35)));
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

  let badgeResult = { unlockedDefs: [] as NonNullable<SubmitAnswerResponse["unlockedBadges"]> };
  if (mode === "ranked") {
    const stats = (await UserStats.findOne({ userId: auth.sub })) ?? (await UserStats.create({ userId: auth.sub }));
    const totalPrev = stats.totalAnswered;
    stats.totalAnswered = totalPrev + 1;
    stats.totalCorrect = stats.totalCorrect + (correct ? 1 : 0);
    stats.rating = newRating;
    stats.bestStreak = Math.max(stats.bestStreak, session.streak);
    stats.avgTimeMs = Math.round((stats.avgTimeMs * totalPrev + serverTimeTakenMs) / (totalPrev + 1));
    stats.updatedAt = new Date();

    const streamStats = ensureStreamStats(stats, session.stream as QuizStream);
    const streamPrev = streamStats.totalAnswered;
    streamStats.totalAnswered += 1;
    streamStats.totalCorrect += correct ? 1 : 0;
    streamStats.rating = newRating;
    streamStats.bestStreak = Math.max(streamStats.bestStreak, session.streak);
    streamStats.avgTimeMs = Math.round((streamStats.avgTimeMs * streamPrev + serverTimeTakenMs) / (streamPrev + 1));
    streamStats.updatedAt = new Date();
    await stats.save();

    badgeResult = await evaluateBadgesAfterAnswer({
      userId: auth.sub,
      sessionId: session._id.toString(),
      wasCorrect: correct,
      newStreak: session.streak
    });
  }

  const resp: SubmitAnswerResponse = {
    mode,
    correct,
    correctAnswer: q.answer,
    explanation: buildExplanation(q),
    resources: getQuestionResources(q),
    playground: mode === "practice" ? getQuestionPlayground(q) : undefined,
    ratingDelta: delta,
    newRating,
    newStreak: session.streak,
    correctCount: session.correctCount,
    wrongCount: session.wrongCount,
    nextTimeLimitSec: mode === "practice" ? 0 : nextTimeLimitSec({ rating: newRating, difficulty: q.difficulty }),
    unlockedBadges: badgeResult.unlockedDefs
  };

  return res.json(resp);
});
