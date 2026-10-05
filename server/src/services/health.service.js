import { pingDatabase } from "../config/db.js";
import { getRedisClient } from "../config/redis.js";
import { checkS3Connection } from "../config/s3.js";

export async function getDependencyHealth() {
  const checks = await Promise.allSettled([
    Promise.resolve().then(() => pingDatabase()),
    Promise.resolve().then(() => getRedisClient().ping()),
    Promise.resolve().then(() => checkS3Connection()),
  ]);
  const names = ["mongodb", "redis", "s3"];
  const dependencies = Object.fromEntries(
    checks.map((result, index) => [names[index], result.status === "fulfilled" ? "ok" : "unavailable"]),
  );
  const healthy = checks.every((result) => result.status === "fulfilled");
  return { status: healthy ? "ok" : "unhealthy", dependencies };
}
