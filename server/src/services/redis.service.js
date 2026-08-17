import { getRedisClient } from "../config/redis.js";

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
