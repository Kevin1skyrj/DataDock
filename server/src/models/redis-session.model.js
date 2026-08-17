import { ObjectId } from "mongodb";

import { getRedisClient } from "../config/redis.js";
import { getJSON } from "../services/redis.service.js";

function sessionKey(tokenHash) {
  return `datadock:session:${tokenHash}`;
}

function userSessionsKey(userId) {
  return `datadock:user:${userId}:sessions`;
}

export async function insertSession({ userId, tokenHash, expiresAt }) {
  const client = getRedisClient();
  const now = new Date();
  const ttlSeconds = Math.ceil((expiresAt.getTime() - Date.now()) / 1000);
  const session = {
    userId: userId.toHexString(),
    tokenHash,
    expiresAt: expiresAt.toISOString(),
    createdAt: now.toISOString(),
  };

  await client
    .multi()
    .set(sessionKey(tokenHash), JSON.stringify(session), { EX: ttlSeconds })
    .zAdd(userSessionsKey(userId), {
      score: expiresAt.getTime(),
      value: tokenHash,
    })
    .expire(userSessionsKey(userId), ttlSeconds)
    .exec();

  return { ...session, _id: tokenHash };
}

export async function findActiveSessionByTokenHash(tokenHash) {
  const session = await getJSON(sessionKey(tokenHash));

  if (!session || !ObjectId.isValid(session.userId)) {
    return null;
  }

  const expiresAt = new Date(session.expiresAt);

  if (expiresAt <= new Date()) {
    return null;
  }

  return {
    ...session,
    _id: tokenHash,
    userId: new ObjectId(session.userId),
    expiresAt,
    createdAt: new Date(session.createdAt),
  };
}

export async function deleteSessionById({ sessionId, userId }) {
  await getRedisClient()
    .multi()
    .del(sessionKey(sessionId))
    .zRem(userSessionsKey(userId), sessionId)
    .exec();
}

export async function deleteAllSessionsByUserId(userId) {
  const client = getRedisClient();
  const indexKey = userSessionsKey(userId);
  const tokenHashes = await client.zRange(indexKey, 0, -1);
  const transaction = client.multi();

  for (const tokenHash of tokenHashes) {
    transaction.del(sessionKey(tokenHash));
  }

  transaction.del(indexKey);
  await transaction.exec();
}

export async function deleteOtherSessionsByUserId({ userId, sessionId }) {
  const client = getRedisClient();
  const indexKey = userSessionsKey(userId);
  const tokenHashes = await client.zRange(indexKey, 0, -1);
  const otherTokenHashes = tokenHashes.filter((tokenHash) => tokenHash !== sessionId);
  const transaction = client.multi();

  for (const tokenHash of otherTokenHashes) {
    transaction.del(sessionKey(tokenHash));
  }

  if (otherTokenHashes.length > 0) {
    transaction.zRem(indexKey, otherTokenHashes);
  }

  await transaction.exec();
}

export async function deleteExcessActiveSessions({ userId, keepCount }) {
  const client = getRedisClient();
  const indexKey = userSessionsKey(userId);

  await client.zRemRangeByScore(indexKey, 0, Date.now());

  const tokenHashes = await client.zRange(indexKey, 0, -1);
  const excessTokenHashes = tokenHashes.slice(0, Math.max(0, tokenHashes.length - keepCount));

  if (excessTokenHashes.length === 0) {
    return;
  }

  const transaction = client.multi();

  for (const tokenHash of excessTokenHashes) {
    transaction.del(sessionKey(tokenHash));
  }

  transaction.zRem(indexKey, excessTokenHashes);
  await transaction.exec();
}
