import { Router } from "express";
import { User } from "../models/User.js";
import { UserStats } from "../models/UserStats.js";

export const leaderboardRouter = Router();

leaderboardRouter.get("/", async (req, res) => {
  const limit = Math.max(1, Math.min(100, Number(req.query.limit ?? 50)));
  const minAnswered = Math.max(0, Math.min(500, Number(req.query.minAnswered ?? 30)));

  const stats = await UserStats.find({ totalAnswered: { $gte: minAnswered } })
    .sort({ rating: -1, bestStreak: -1, avgTimeMs: 1 })
    .limit(limit)
    .lean();

  const userIds = stats.map((s: any) => s.userId);
  const users = await User.find({ _id: { $in: userIds }, shadowbanned: false, banned: false })
    .select({ displayName: 1, createdAt: 1 })
    .lean();

  const userById = new Map(users.map((u: any) => [u._id.toString(), u]));

  const rows = stats
    .map((s: any) => {
      const u = userById.get(s.userId.toString());
      if (!u) return null;
      return {
        userId: s.userId.toString(),
        displayName: u.displayName,
        rating: s.rating,
        totalAnswered: s.totalAnswered,
        accuracy: s.totalAnswered ? s.totalCorrect / s.totalAnswered : 0,
        bestStreak: s.bestStreak,
        avgTimeMs: s.avgTimeMs
      };
    })
    .filter(Boolean);

  return res.json({ rows });
});
