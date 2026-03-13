import { Router } from "express";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { User } from "../models/User.js";
import { signToken } from "../lib/auth.js";

export const authRouter = Router();

authRouter.post("/register", async (req, res) => {
  const body = z
    .object({
      email: z.string().email().toLowerCase(),
      password: z.string().min(8),
      displayName: z.string().min(1).max(50)
    })
    .safeParse(req.body);

  if (!body.success) return res.status(400).json({ error: "invalid_body", details: body.error.flatten() });

  const exists = await User.findOne({ email: body.data.email });
  if (exists) return res.status(409).json({ error: "email_in_use" });

  const passwordHash = await bcrypt.hash(body.data.password, 12);
  const adminEmail = process.env.ADMIN_EMAIL?.toLowerCase();
  const role = adminEmail && body.data.email === adminEmail ? "admin" : "user";

  const user = await User.create({ email: body.data.email, passwordHash, displayName: body.data.displayName, role });

  const token = signToken({ sub: user._id.toString(), email: user.email, role: user.role });
  return res.json({ token, user: { id: user._id.toString(), email: user.email, displayName: user.displayName, role: user.role } });
});

authRouter.post("/login", async (req, res) => {
  const body = z
    .object({
      email: z.string().email().toLowerCase(),
      password: z.string().min(1)
    })
    .safeParse(req.body);

  if (!body.success) return res.status(400).json({ error: "invalid_body" });

  const user = await User.findOne({ email: body.data.email });
  if (!user) return res.status(401).json({ error: "bad_credentials" });

  const ok = await bcrypt.compare(body.data.password, user.passwordHash);
  if (!ok) return res.status(401).json({ error: "bad_credentials" });

  if (user.banned) return res.status(403).json({ error: "banned" });

  const token = signToken({ sub: user._id.toString(), email: user.email, role: user.role });
  return res.json({ token, user: { id: user._id.toString(), email: user.email, displayName: user.displayName, role: user.role } });
});
