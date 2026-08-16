import { createHash, randomBytes } from "node:crypto";

export function generateSessionToken() {
  return randomBytes(32).toString("base64url");
}

export function hashSessionToken(token) {
  return createHash("sha256").update(token).digest("hex");
}