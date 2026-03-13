import { Router } from "express";
import { requireAuth, getAuth } from "../lib/auth.js";
import { BADGES } from "../badges/catalog.js";
import { BadgeUnlock } from "../models/BadgeUnlock.js";

export const badgesRouter = Router();

badgesRouter.get("/catalog", (_req, res) => {
  return res.json({ badges: BADGES });
});

badgesRouter.get("/me", requireAuth, async (req, res) => {
  const auth = getAuth(req);
  const unlocks = await BadgeUnlock.find({ userId: auth.sub }).sort({ unlockedAt: -1 }).lean();
  const unlockedSet = new Set(unlocks.map((u: any) => u.badgeId));

  return res.json({
    unlocked: BADGES.filter((b) => unlockedSet.has(b.id)).map((b) => ({ ...b, unlockedAt: unlocks.find((u: any) => u.badgeId === b.id)?.unlockedAt }))
  });
});
