import { createClient } from "redis";

const redisUrl = process.env.REDIS_URL;

if (!redisUrl) {
  throw new Error("REDIS_URL is missing from environment variables");
}

const redisClient = createClient({ url: redisUrl });

redisClient.on("error", (error) => {
  console.error("Redis error:", error.message);
});

export async function connectToRedis() {
  if (!redisClient.isOpen) {
    await redisClient.connect();
  }

  await redisClient.ping();
  console.log("Redis connected");
}

export function getRedisClient() {
  if (!redisClient.isReady) {
    throw new Error("Redis is not connected");
  }

  return redisClient;
}

export async function closeRedisConnection() {
  if (redisClient.isOpen) {
    await redisClient.quit();
  }
}
