import { BadgeUnlock } from "../models/BadgeUnlock.js";
import { BADGES } from "./catalog.js";
import { UserStats } from "../models/UserStats.js";
import { Attempt } from "../models/Attempt.js";
import { Follow } from "../models/Follow.js";
import { SocialEvent } from "../models/SocialEvent.js";

export async function ensureBadge(userId: string, badgeId: string) {
  try {
    const doc = await BadgeUnlock.create({ userId, badgeId });
    return doc.badgeId;
  } catch {
    return null;
  }
}

export async function evaluateBadgesAfterAnswer(opts: {
  userId: string;
  sessionId: string;
  wasCorrect: boolean;
  newStreak: number;
}) {
  const unlocked: string[] = [];

  // always: first-blood
  const stats = await UserStats.findOne({ userId: opts.userId }).lean();
  if (stats && stats.totalAnswered >= 1) {
    const b = await ensureBadge(opts.userId, "first-blood");
    if (b) unlocked.push(b);
  }

  if (opts.newStreak >= 5) {
    const b = await ensureBadge(opts.userId, "on-a-roll");
    if (b) unlocked.push(b);
  }
  if (opts.newStreak >= 10) {
    const b = await ensureBadge(opts.userId, "hot-streak");
    if (b) unlocked.push(b);
  }
  if (opts.newStreak >= 20) {
    const b = await ensureBadge(opts.userId, "unstoppable");
    if (b) unlocked.push(b);
  }

  if (stats && stats.totalAnswered >= 50) {
    const b = await ensureBadge(opts.userId, "the-grind");
    if (b) unlocked.push(b);

    if (stats.totalCorrect / Math.max(1, stats.totalAnswered) >= 0.85) {
      const b2 = await ensureBadge(opts.userId, "accurate");
      if (b2) unlocked.push(b2);
    }
  }

  if (stats && stats.totalAnswered >= 100) {
    const b = await ensureBadge(opts.userId, "centurion");
    if (b) unlocked.push(b);
  }

  if (stats && stats.totalAnswered >= 30 && stats.avgTimeMs <= 7000) {
    const b = await ensureBadge(opts.userId, "speedy");
    if (b) unlocked.push(b);
  }

  // topic-based: count correct attempts by topic-tagged questionIds (cheap approximation via stored questionId only)
  // We don’t have topic stored in Attempt, so we use session streak/rating-driven heuristic later.
  // For now: use questionId prefix buckets (future: store topic on Attempt).

  // comeback: last 10 attempts, if at least 5 correct and contains a miss
  const last10 = await Attempt.find({ userId: opts.userId }).sort({ createdAt: -1 }).limit(10).lean();
  if (last10.length === 10) {
    const correctCount = last10.filter((a: any) => a.correct).length;
    const hasMiss = last10.some((a: any) => !a.correct);
    if (hasMiss && correctCount >= 5) {
      const b = await ensureBadge(opts.userId, "comeback");
      if (b) unlocked.push(b);
    }
  }

  // friendly: mutual follows with >=3 people
  const following = await Follow.find({ fromUserId: opts.userId }).lean();
  const followers = await Follow.find({ toUserId: opts.userId }).lean();
  const followingSet = new Set(following.map((x: any) => x.toUserId.toString()));
  const mutual = followers.map((x: any) => x.fromUserId.toString()).filter((id: string) => followingSet.has(id));
  if (mutual.length >= 3) {
    const b = await ensureBadge(opts.userId, "friendly");
    if (b) unlocked.push(b);
  }

  // cheerleader: 10 encouragements sent
  const encourSent = await SocialEvent.countDocuments({ fromUserId: opts.userId, kind: "encourage" });
  if (encourSent >= 10) {
    const b = await ensureBadge(opts.userId, "cheerleader");
    if (b) unlocked.push(b);
  }

  // Topic skill badges (hooked/testing/a11y/ts) – placeholder now, unlock via stats.rating milestones
  // (we’ll refine once Attempt stores topic)
  if ((stats?.rating ?? 0) >= 15) {
    const b = await ensureBadge(opts.userId, "hooked");
    if (b) unlocked.push(b);
  }
  if ((stats?.rating ?? 0) >= 20) {
    const b = await ensureBadge(opts.userId, "testing-aware");
    if (b) unlocked.push(b);
  }
  if ((stats?.rating ?? 0) >= 25) {
    const b = await ensureBadge(opts.userId, "a11y-ally");
    if (b) unlocked.push(b);
  }
  if ((stats?.rating ?? 0) >= 30) {
    const b = await ensureBadge(opts.userId, "ts-tamer");
    if (b) unlocked.push(b);
  }

  // return defs for unlocked (filtered)
  const unlockedDefs = BADGES.filter((b) => unlocked.includes(b.id));
  return { unlockedIds: unlocked, unlockedDefs };
}
