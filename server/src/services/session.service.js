import {
  deleteExcessActiveSessions,
  deleteSessionById,
  insertSession,
} from "../models/session.model.js";
import {
  generateSessionToken,
  hashSessionToken,
} from "../utils/session-token.js";

const SESSION_DURATION_MS = 7 * 24 * 60 * 60 * 1000;
const MAX_ACTIVE_SESSIONS = 3;

export async function createSession(userId) {
  if (!userId) {
    throw new Error("userId is required to create a session");
  }

  await deleteExcessActiveSessions({
    userId,
    keepCount: MAX_ACTIVE_SESSIONS - 1,
  });

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

export async function deleteCurrentSession({ sessionId, userId }) {
  if (!sessionId || !userId) {
    throw new Error("sessionId and userId are required to delete a session");
  }

  await deleteSessionById({
    sessionId,
    userId,
  });
}
