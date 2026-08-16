import { getDatabase } from "../config/db.js";

const SESSIONS_COLLECTION = "sessions";

export async function createSessionIndexes() {
  const database = getDatabase();
  const sessions = database.collection(SESSIONS_COLLECTION);

  await sessions.createIndex({ tokenHash: 1 }, { unique: true });
  await sessions.createIndex({ expiresAt: 1 }, { expireAfterSeconds: 0 });
}

export async function insertSession({ userId, tokenHash, expiresAt }) {
  const database = getDatabase();
  const now = new Date();

  const session = {
    userId,
    tokenHash,
    expiresAt,
    createdAt: now,
    lastActiveAt: now,
  };

  const result = await database
    .collection(SESSIONS_COLLECTION)
    .insertOne(session);

  return {
    ...session,
    _id: result.insertedId,
  };
}

export async function findActiveSessionByTokenHash(tokenHash) {
  const database = getDatabase();

  return database.collection(SESSIONS_COLLECTION).findOne({
    tokenHash,
    expiresAt: { $gt: new Date() },
  });
}