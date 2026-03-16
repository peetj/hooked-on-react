import { Router } from "express";
import { User } from "../models/User.js";
import { UserStats } from "../models/UserStats.js";
import type { QuizStream } from "@react-quiz-1000/shared";

export const leaderboardRouter = Router();

type LeaderboardRow = {
  userId: string;
  displayName: string;
  rating: number;
  totalAnswered: number;
  accuracy: number;
  bestStreak: number;
  avgTimeMs: number;
};

leaderboardRouter.get("/", async (req, res) => {
  const limit = Math.max(1, Math.min(100, Number(req.query.limit ?? 50)));
  const minAnswered = Math.max(0, Math.min(500, Number(req.query.minAnswered ?? 30)));
  const stream = (["adaptive", "1", "2", "3", "4", "5"].includes(String(req.query.stream)) ? String(req.query.stream) : "adaptive") as QuizStream;
  const streamPath = `streams.${stream}`;

  const rows = await UserStats.aggregate<LeaderboardRow>([
    {
      $match: {
        [`${streamPath}.totalAnswered`]: { $gte: minAnswered }
      }
    },
    {
      $lookup: {
        from: User.collection.name,
        localField: "userId",
        foreignField: "_id",
        as: "user"
      }
    },
    { $unwind: "$user" },
    {
      $match: {
        "user.shadowbanned": false,
        "user.banned": false
      }
    },
    {
      $project: {
        _id: 0,
        userId: { $toString: "$userId" },
        displayName: "$user.displayName",
        rating: { $ifNull: [`$${streamPath}.rating`, 0] },
        totalAnswered: { $ifNull: [`$${streamPath}.totalAnswered`, 0] },
        totalCorrect: { $ifNull: [`$${streamPath}.totalCorrect`, 0] },
        bestStreak: { $ifNull: [`$${streamPath}.bestStreak`, 0] },
        avgTimeMs: { $ifNull: [`$${streamPath}.avgTimeMs`, 0] }
      }
    },
    {
      $addFields: {
        accuracy: {
          $cond: [{ $gt: ["$totalAnswered", 0] }, { $divide: ["$totalCorrect", "$totalAnswered"] }, 0]
        }
      }
    },
    {
      $sort: {
        rating: -1,
        bestStreak: -1,
        avgTimeMs: 1,
        totalAnswered: -1,
        displayName: 1
      }
    },
    { $limit: limit },
    {
      $project: {
        totalCorrect: 0
      }
    }
  ]);

  return res.json({ rows, stream });
});
