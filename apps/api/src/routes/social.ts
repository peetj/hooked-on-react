import { Router } from "express";
import { z } from "zod";
import { requireAuth, getAuth } from "../lib/auth.js";
import { User } from "../models/User.js";
import { SocialEvent } from "../models/SocialEvent.js";
import { Follow } from "../models/Follow.js";

export const socialRouter = Router();

const ENCOURAGEMENT_TEMPLATES = [
  "Nice streak!",
  "Good grind today.",
  "Clutch answer.",
  "You’re leveling up.",
  "Respect — that one was tricky.",
  "Daily run buddies?"
] as const;

type Lane = "followers" | "anyone";

function dayKey(d = new Date()) {
  return d.toISOString().slice(0, 10);
}

async function assertThrottle(opts: { fromUserId: string; toUserId: string; lane: Lane }) {
  const now = new Date();
  const since24h = new Date(now.getTime() - 24 * 60 * 60 * 1000);

  // sender daily caps
  const senderCount = await SocialEvent.countDocuments({
    fromUserId: opts.fromUserId,
    kind: "encourage",
    lane: opts.lane,
    createdAt: { $gte: since24h }
  });

  const maxPerDay = opts.lane === "anyone" ? 5 : 30;
  if (senderCount >= maxPerDay) throw new Error("rate_limited_day");

  // per-target/day for anyone lane
  if (opts.lane === "anyone") {
    const today = dayKey(now);
    const start = new Date(`${today}T00:00:00.000Z`);
    const end = new Date(`${today}T23:59:59.999Z`);
    const perTarget = await SocialEvent.countDocuments({
      fromUserId: opts.fromUserId,
      toUserId: opts.toUserId,
      kind: "encourage",
      lane: "anyone",
      createdAt: { $gte: start, $lte: end }
    });
    if (perTarget >= 1) throw new Error("rate_limited_target_day");
  }

  // cooldown: 1 per 2 minutes
  const sinceCooldown = new Date(now.getTime() - 2 * 60 * 1000);
  const cooldownCount = await SocialEvent.countDocuments({
    fromUserId: opts.fromUserId,
    kind: "encourage",
    lane: opts.lane,
    createdAt: { $gte: sinceCooldown }
  });
  if (cooldownCount >= 1) throw new Error("rate_limited_cooldown");
}

socialRouter.post("/encourage", requireAuth, async (req, res) => {
  const auth = getAuth(req);
  const body = z
    .object({
      toUserId: z.string().min(1),
      lane: z.enum(["followers", "anyone"]),
      template: z.string().min(1)
    })
    .safeParse(req.body);

  if (!body.success) return res.status(400).json({ error: "invalid_body" });

  if (!(ENCOURAGEMENT_TEMPLATES as readonly string[]).includes(body.data.template)) {
    return res.status(400).json({ error: "invalid_template" });
  }

  const fromUser = await User.findById(auth.sub);
  if (!fromUser) return res.status(401).json({ error: "bad_user" });
  if (fromUser.banned) return res.status(403).json({ error: "banned" });
  if (fromUser.mutedSocialUntil && fromUser.mutedSocialUntil > new Date()) return res.status(403).json({ error: "muted" });

  // followers lane: require mutual follow (safer / more meaningful)
  if (body.data.lane === "followers") {
    const a = await Follow.findOne({ fromUserId: auth.sub, toUserId: body.data.toUserId });
    const b = await Follow.findOne({ fromUserId: body.data.toUserId, toUserId: auth.sub });
    if (!a || !b) return res.status(403).json({ error: "not_mutual" });
  }

  // anyone lane restriction: require some activity / account age (simple heuristic)
  if (body.data.lane === "anyone") {
    const ageMs = Date.now() - new Date(fromUser.createdAt).getTime();
    if (ageMs < 24 * 60 * 60 * 1000) return res.status(403).json({ error: "new_account_restricted" });
  }

  try {
    await assertThrottle({ fromUserId: auth.sub, toUserId: body.data.toUserId, lane: body.data.lane });
  } catch (e: any) {
    return res.status(429).json({ error: e?.message ?? "rate_limited" });
  }

  const ev = await SocialEvent.create({
    kind: "encourage",
    fromUserId: auth.sub,
    toUserId: body.data.toUserId,
    lane: body.data.lane,
    template: body.data.template
  });

  return res.json({ id: ev._id.toString(), ok: true });
});

socialRouter.get("/feed", requireAuth, async (req, res) => {
  const auth = getAuth(req);
  const limit = Math.max(1, Math.min(50, Number(req.query.limit ?? 20)));

  const items = await SocialEvent.find({ toUserId: auth.sub })
    .sort({ createdAt: -1 })
    .limit(limit)
    .populate("fromUserId", { displayName: 1 })
    .lean();

  return res.json({
    items: items.map((x: any) => ({
      id: x._id.toString(),
      kind: x.kind,
      lane: x.lane,
      template: x.template,
      emoji: x.emoji ?? null,
      createdAt: x.createdAt,
      from: { id: x.fromUserId?._id?.toString?.() ?? String(x.fromUserId), displayName: x.fromUserId?.displayName ?? "Someone" }
    }))
  });
});
