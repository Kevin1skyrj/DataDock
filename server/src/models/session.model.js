import { getDatabase } from "../config/db.js";

const SESSIONS_COLLECTION = "sessions";

export async function createSessionIndexes() {
  const database = getDatabase();
  const sessions = database.collection(SESSIONS_COLLECTION);

  await sessions.createIndex({ tokenHash: 1 }, { unique: true });
  await sessions.createIndex({ expiresAt: 1 }, { expireAfterSeconds: 0 });
  await sessions.createIndex({ userId: 1, createdAt: 1 });
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

export async function deleteSessionById({ sessionId, userId }) {
  const database = getDatabase();

  return database.collection(SESSIONS_COLLECTION).deleteOne({
    _id: sessionId,
    userId,
  });
}

export async function deleteExcessActiveSessions({ userId, keepCount }) {
  const database = getDatabase();
  const sessions = database.collection(SESSIONS_COLLECTION);

  const excessSessions = await sessions
    .find({
      userId,
      expiresAt: { $gt: new Date() },
    })
    .sort({
      createdAt: -1,
      _id: -1,
    })
    .skip(keepCount)
    .project({ _id: 1 })
    .toArray();

  if (excessSessions.length === 0) {
    return;
  }

  await sessions.deleteMany({
    userId,
    _id: {
      $in: excessSessions.map((session) => session._id),
    },
  });
}
