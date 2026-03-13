import crypto from "node:crypto";

export function makeNonce(bytes = 16) {
  return crypto.randomBytes(bytes).toString("hex");
}
