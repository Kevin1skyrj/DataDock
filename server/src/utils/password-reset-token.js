import { createHash, randomBytes } from "node:crypto";

export function generatePasswordResetToken() {
  return randomBytes(32).toString("base64url");
}

export function hashPasswordResetToken(token) {
  return createHash("sha256").update(token).digest("hex");
}
