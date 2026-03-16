import jwt from "jsonwebtoken";
import type { Request, Response, NextFunction } from "express";
import { User } from "../models/User.js";

export type AuthClaims = {
  sub: string; // userId
  email: string;
  role: "user" | "mod" | "admin";
};

export function signToken(claims: AuthClaims) {
  const secret = process.env.JWT_SECRET;
  if (!secret) throw new Error("JWT_SECRET is required");
  return jwt.sign(claims, secret, { expiresIn: "30d" });
}

export function requireRole(role: AuthClaims["role"]) {
  const order = { user: 0, mod: 1, admin: 2 } as const;
  return function (req: Request, res: Response, next: NextFunction) {
    const auth = (req as any).auth as AuthClaims | undefined;
    if (!auth) return res.status(401).json({ error: "missing_token" });
    if (order[auth.role] < order[role]) return res.status(403).json({ error: "forbidden" });
    return next();
  };
}

export async function requireAuth(req: Request, res: Response, next: NextFunction) {
  const header = req.header("authorization");
  const token = header?.startsWith("Bearer ") ? header.slice("Bearer ".length) : null;
  if (!token) return res.status(401).json({ error: "missing_token" });

  const secret = process.env.JWT_SECRET;
  if (!secret) throw new Error("JWT_SECRET is required");

  try {
    const decoded = jwt.verify(token, secret) as Partial<AuthClaims> | string;
    if (!decoded || typeof decoded === "string" || typeof decoded.sub !== "string") {
      return res.status(401).json({ error: "invalid_token" });
    }

    const user = await User.findById(decoded.sub).select({ email: 1, role: 1, banned: 1 }).lean();
    if (!user) return res.status(401).json({ error: "invalid_token" });
    if (user.banned) return res.status(403).json({ error: "banned" });

    (req as any).auth = {
      sub: decoded.sub,
      email: user.email,
      role: user.role
    } satisfies AuthClaims;
    return next();
  } catch {
    return res.status(401).json({ error: "invalid_token" });
  }
}

export function getAuth(req: Request): AuthClaims {
  const auth = (req as any).auth as AuthClaims | undefined;
  if (!auth) throw new Error("auth missing");
  return auth;
}
