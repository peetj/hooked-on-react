import nodemailer from "nodemailer";

let cachedTransport: nodemailer.Transporter | null = null;

function getSmtpUrl() {
  const smtpUrl = process.env.SMTP_URL;
  if (!smtpUrl) throw new Error("SMTP_URL is required");
  return smtpUrl;
}

export function getFeedbackRecipient() {
  const feedbackAddress = process.env.FEEDBACK_EMAIL_ADDRESS;
  if (!feedbackAddress) throw new Error("FEEDBACK_EMAIL_ADDRESS is required");
  return feedbackAddress;
}

export function getMailFromAddress() {
  return process.env.SMTP_FROM ?? getFeedbackRecipient();
}

function getTransport() {
  if (!cachedTransport) {
    cachedTransport = nodemailer.createTransport(getSmtpUrl());
  }
  return cachedTransport;
}

export async function sendMail(opts: { to: string; subject: string; text: string; replyTo?: string }) {
  const transport = getTransport();
  await transport.sendMail({
    from: getMailFromAddress(),
    to: opts.to,
    subject: opts.subject,
    text: opts.text,
    ...(opts.replyTo ? { replyTo: opts.replyTo } : {})
  });
}
