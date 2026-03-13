import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import dotenv from "dotenv";

import { connectDb } from "./lib/db.js";
import { authRouter } from "./routes/auth.js";
import { sessionRouter } from "./routes/session.js";
import { socialRouter } from "./routes/social.js";
import { adminRouter } from "./routes/admin.js";
import { leaderboardRouter } from "./routes/leaderboard.js";
import { followRouter } from "./routes/follow.js";
import { badgesRouter } from "./routes/badges.js";

dotenv.config();

const app = express();
app.use(helmet());
app.use(cors({ origin: process.env.CORS_ORIGIN?.split(",") ?? true, credentials: true }));
app.use(express.json({ limit: "1mb" }));
app.use(morgan("dev"));

app.get("/health", (_req, res) => res.json({ ok: true }));
app.use("/auth", authRouter);
app.use("/session", sessionRouter);
app.use("/social", socialRouter);
app.use("/admin", adminRouter);
app.use("/leaderboard", leaderboardRouter);
app.use("/follow", followRouter);
app.use("/badges", badgesRouter);

const port = Number(process.env.PORT ?? 8787);

await connectDb();
app.listen(port, () => {
  // eslint-disable-next-line no-console
  console.log(`[api] listening on http://localhost:${port}`);
});
