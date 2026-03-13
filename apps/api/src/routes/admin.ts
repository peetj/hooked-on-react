import { Router } from "express";
import { z } from "zod";
import { requireAuth, requireRole } from "../lib/auth.js";
import { User } from "../models/User.js";
import { SocialEvent } from "../models/SocialEvent.js";

export const adminRouter = Router();

adminRouter.use(requireAuth);
adminRouter.use(requireRole("mod"));

adminRouter.get("/users", async (req, res) => {
  const q = String(req.query.q ?? "").trim();
  const limit = Math.max(1, Math.min(50, Number(req.query.limit ?? 20)));

  const filter = q
    ? {
        $or: [{ email: { $regex: q, $options: "i" } }, { displayName: { $regex: q, $options: "i" } }]
      }
    : {};

  const users = await User.find(filter).sort({ createdAt: -1 }).limit(limit).lean();
  return res.json({
    users: users.map((u: any) => ({
      id: u._id.toString(),
      email: u.email,
      displayName: u.displayName,
      role: u.role,
      banned: u.banned,
      shadowbanned: u.shadowbanned,
      mutedSocialUntil: u.mutedSocialUntil ?? null,
      createdAt: u.createdAt
    }))
  });
});

adminRouter.patch("/users/:id", requireRole("admin"), async (req, res) => {
  const body = z
    .object({
      role: z.enum(["user", "mod", "admin"]).optional(),
      banned: z.boolean().optional(),
      shadowbanned: z.boolean().optional(),
      mutedSocialMinutes: z.number().int().min(0).max(60 * 24 * 30).optional()
    })
    .safeParse(req.body);

  if (!body.success) return res.status(400).json({ error: "invalid_body" });

  const patch: any = {};
  if (body.data.role) patch.role = body.data.role;
  if (typeof body.data.banned === "boolean") patch.banned = body.data.banned;
  if (typeof body.data.shadowbanned === "boolean") patch.shadowbanned = body.data.shadowbanned;
  if (typeof body.data.mutedSocialMinutes === "number") {
    patch.mutedSocialUntil = body.data.mutedSocialMinutes === 0 ? null : new Date(Date.now() + body.data.mutedSocialMinutes * 60 * 1000);
  }

  const u = await User.findByIdAndUpdate(req.params.id, patch, { new: true });
  if (!u) return res.status(404).json({ error: "user_not_found" });

  return res.json({ ok: true });
});

adminRouter.get("/social", async (req, res) => {
  const limit = Math.max(1, Math.min(100, Number(req.query.limit ?? 50)));
  const items = await SocialEvent.find({}).sort({ createdAt: -1 }).limit(limit).lean();
  return res.json({
    items: items.map((x: any) => ({
      id: x._id.toString(),
      kind: x.kind,
      lane: x.lane,
      template: x.template,
      fromUserId: x.fromUserId.toString(),
      toUserId: x.toUserId.toString(),
      createdAt: x.createdAt
    }))
  });
});
