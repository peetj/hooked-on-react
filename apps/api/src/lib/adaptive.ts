import type { Question, Topic, QuizStream } from "@react-quiz-1000/shared";
import { clampDifficulty, topicList } from "../questions/index.js";

export function pickNextQuestion(opts: {
  bank: Question[];
  rating: number;
  stream: QuizStream;
  topicMastery: Record<string, number>;
  seenIds: Set<string>;
}): Question {
  const topics = topicList();

  const targetDifficulty = opts.stream === "adaptive" ? clampDifficulty(3 + opts.rating / 25) : clampDifficulty(Number(opts.stream));

  // Topic need: lower mastery => higher need
  const topicNeed: Record<Topic, number> = Object.fromEntries(
    topics.map((t) => {
      const m = Number(opts.topicMastery[t] ?? 0);
      const need = 1.5 ** (-m); // m=-2 => big need; m=+2 => small need
      return [t, need];
    })
  ) as any;

  const difficultyCandidates =
    opts.stream === "adaptive" ? opts.bank : opts.bank.filter((q) => q.difficulty === Number(opts.stream));
  const candidates = difficultyCandidates.filter((q) => !opts.seenIds.has(q.id));
  if (candidates.length === 0) {
    // If we've seen everything, allow repeats but prefer hardest missed topics.
    const fallbackPool = difficultyCandidates.length > 0 ? difficultyCandidates : opts.bank;
    return fallbackPool[Math.floor(Math.random() * fallbackPool.length)]!;
  }

  // Score questions by closeness to target difficulty, topic need, and intrinsic weight.
  const scored = candidates.map((q) => {
    const diffPenalty = Math.abs(q.difficulty - targetDifficulty);
    const diffScore = 1 / (1 + diffPenalty);
    const tNeed = topicNeed[q.topic as Topic] ?? 1;
    const score = diffScore * tNeed * (q.weight ?? 1);
    return { q, score };
  });

  // Weighted random pick
  const sum = scored.reduce((a, b) => a + b.score, 0);
  let r = Math.random() * sum;
  for (const s of scored) {
    r -= s.score;
    if (r <= 0) return s.q;
  }
  return scored[scored.length - 1]!.q;
}

export function updateRating(opts: {
  rating: number;
  correct: boolean;
  difficulty: number;
  timeTakenMs: number;
  timeLimitSec: number;
}) {
  // ELO-ish: harder questions move rating more, speed gives a small bonus.
  const baseK = 6 + (opts.difficulty - 1) * 2; // 6..14
  const speed = Math.max(0, Math.min(1, 1 - opts.timeTakenMs / (opts.timeLimitSec * 1000)));
  const speedBonus = (opts.correct ? 1 : -1) * speed * 2;
  const delta = (opts.correct ? +baseK : -baseK) + speedBonus;
  const newRating = Math.max(-50, Math.min(50, opts.rating + delta));
  return { delta, newRating };
}

export function nextTimeLimitSec(opts: { rating: number; difficulty: number }) {
  // Higher rating => slightly tighter time, but never punishing.
  const base = 30 - (opts.difficulty - 1) * 3; // 30..18
  const tighten = Math.max(-4, Math.min(4, Math.round(opts.rating / 20))); // -2..+2-ish
  return Math.max(12, base - tighten);
}
