import { Router } from "express";
import { z } from "zod";
import { requireAuth, getAuth } from "../lib/auth.js";
import { Follow } from "../models/Follow.js";

export const followRouter = Router();

followRouter.use(requireAuth);

followRouter.post("/follow", async (req, res) => {
  const auth = getAuth(req);
  const body = z.object({ toUserId: z.string().min(1) }).safeParse(req.body);
  if (!body.success) return res.status(400).json({ error: "invalid_body" });
  if (body.data.toUserId === auth.sub) return res.status(400).json({ error: "cannot_follow_self" });

  try {
    await Follow.create({ fromUserId: auth.sub, toUserId: body.data.toUserId });
  } catch {
    // ignore duplicates
  }
  return res.json({ ok: true });
});

followRouter.post("/unfollow", async (req, res) => {
  const auth = getAuth(req);
  const body = z.object({ toUserId: z.string().min(1) }).safeParse(req.body);
  if (!body.success) return res.status(400).json({ error: "invalid_body" });

  await Follow.deleteOne({ fromUserId: auth.sub, toUserId: body.data.toUserId });
  return res.json({ ok: true });
});

followRouter.get("/me", async (req, res) => {
  const auth = getAuth(req);
  const following = await Follow.find({ fromUserId: auth.sub }).lean();
  const followers = await Follow.find({ toUserId: auth.sub }).lean();

  const followingSet = new Set(following.map((x: any) => x.toUserId.toString()));
  const mutual = followers
    .map((x: any) => x.fromUserId.toString())
    .filter((id: string) => followingSet.has(id));

  return res.json({
    following: [...followingSet],
    followers: followers.map((x: any) => x.fromUserId.toString()),
    mutual
  });
});
