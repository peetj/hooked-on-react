import { Router } from "express";
import { z } from "zod";
import { sendMail, getFeedbackRecipient } from "../lib/mail.js";

export const feedbackRouter = Router();

feedbackRouter.post("/", async (req, res) => {
  const body = z
    .object({
      message: z.string().trim().min(10).max(4000),
      contactEmail: z.string().trim().email().max(320),
      name: z.string().trim().min(1).max(80).optional(),
      page: z.string().trim().min(1).max(80).optional(),
      user: z
        .object({
          id: z.string().trim().min(1).max(80),
          email: z.string().trim().email().max(320),
          displayName: z.string().trim().min(1).max(80)
        })
        .optional()
    })
    .safeParse(req.body);

  if (!body.success) return res.status(400).json({ error: "invalid_body" });

  const submittedAt = new Date().toISOString();
  const lines = [
    "Hooked on React feedback",
    "",
    `Submitted at: ${submittedAt}`,
    `Contact email: ${body.data.contactEmail}`,
    `Name: ${body.data.name ?? "Anonymous"}`,
    `Page: ${body.data.page ?? "unknown"}`,
    body.data.user
      ? `Signed-in user: ${body.data.user.displayName} <${body.data.user.email}> (${body.data.user.id})`
      : "Signed-in user: none",
    "",
    "Message:",
    body.data.message
  ];

  try {
    await sendMail({
      to: getFeedbackRecipient(),
      subject: `Feedback: ${body.data.page ?? "app"}`,
      text: lines.join("\n"),
      replyTo: body.data.contactEmail
    });
    return res.json({ ok: true });
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error("[feedback] failed to send", error);
    return res.status(503).json({ error: "feedback_unavailable" });
  }
});
