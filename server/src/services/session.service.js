import { insertSession } from "../models/session.model.js";
import {
  generateSessionToken,
  hashSessionToken,
} from "../utils/session-token.js";

const SESSION_DURATION_MS = 7 * 24 * 60 * 60 * 1000;

export async function createSession(userId) {
  if (!userId) {
    throw new Error("userId is required to create a session");
  }

  const token = generateSessionToken();
  const tokenHash = hashSessionToken(token);
  const expiresAt = new Date(Date.now() + SESSION_DURATION_MS);

  await insertSession({
    userId,
    tokenHash,
    expiresAt,
  });

  return {
    token,
    expiresAt,
  };
}
