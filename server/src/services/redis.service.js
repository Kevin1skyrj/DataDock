import { getRedisClient } from "../config/redis.js";
import { randomUUID } from "node:crypto";

export async function setJSON(key, value, ttlSeconds) {
  const client = getRedisClient();
  const json = JSON.stringify(value);

  if (ttlSeconds) {
    return client.set(key, json, { EX: ttlSeconds });
  }

  return client.set(key, json);
}

export async function getJSON(key) {
  const json = await getRedisClient().get(key);

  return json === null ? null : JSON.parse(json);
}

export async function deleteKey(key) {
  return getRedisClient().del(key);
}

export async function withDistributedLock(
  key,
  operation,
  { ttlMs = 30_000, waitMs = 5_000 } = {},
) {
  const client = getRedisClient();
  const token = randomUUID();
  const deadline = Date.now() + waitMs;

  while ((await client.set(key, token, { NX: true, PX: ttlMs })) !== "OK") {
    if (Date.now() >= deadline) {
      const error = new Error("The operation is already in progress");
      error.code = "operation-in-progress";
      error.statusCode = 409;
      throw error;
    }
    await new Promise((resolve) => setTimeout(resolve, 50));
  }

  try {
    return await operation();
  } finally {
    await client.eval(
      "if redis.call('get', KEYS[1]) == ARGV[1] then return redis.call('del', KEYS[1]) else return 0 end",
      { keys: [key], arguments: [token] },
    );
  }
}
