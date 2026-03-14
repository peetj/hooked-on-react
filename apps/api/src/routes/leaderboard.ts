import { Router } from "express";
import { User } from "../models/User.js";
import { UserStats } from "../models/UserStats.js";
import type { QuizStream } from "@react-quiz-1000/shared";

export const leaderboardRouter = Router();

leaderboardRouter.get("/", async (req, res) => {
  const limit = Math.max(1, Math.min(100, Number(req.query.limit ?? 50)));
  const minAnswered = Math.max(0, Math.min(500, Number(req.query.minAnswered ?? 30)));
  const stream = (["adaptive", "1", "2", "3", "4", "5"].includes(String(req.query.stream)) ? String(req.query.stream) : "adaptive") as QuizStream;

  const stats = await UserStats.find({})
    .limit(500)
    .lean();

  const userIds = stats.map((s: any) => s.userId);
  const users = await User.find({ _id: { $in: userIds }, shadowbanned: false, banned: false })
    .select({ displayName: 1, createdAt: 1 })
    .lean();

  const userById = new Map(users.map((u: any) => [u._id.toString(), u]));

  const rows = stats
    .map((s: any) => {
      const streamStats = s.streams?.[stream];
      const totalAnswered = Number(streamStats?.totalAnswered ?? 0);
      if (totalAnswered < minAnswered) return null;

      const u = userById.get(s.userId.toString());
      if (!u) return null;
      return {
        userId: s.userId.toString(),
        displayName: u.displayName,
        rating: Number(streamStats?.rating ?? 0),
        totalAnswered,
        accuracy: totalAnswered ? Number(streamStats?.totalCorrect ?? 0) / totalAnswered : 0,
        bestStreak: Number(streamStats?.bestStreak ?? 0),
        avgTimeMs: Number(streamStats?.avgTimeMs ?? 0)
      };
    })
    .filter(Boolean)
    .sort((a: any, b: any) => b.rating - a.rating || b.bestStreak - a.bestStreak || a.avgTimeMs - b.avgTimeMs)
    .slice(0, limit);

  return res.json({ rows, stream });
});
