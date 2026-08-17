import { getRedisClient } from "../config/redis.js";
import { getJSON, setJSON } from "./redis.service.js";

const ITEM_LIST_TTL_SECONDS = 60;

function versionKey(ownerId) {
  return `datadock:items:${ownerId}:version`;
}

export async function getItemListCacheKey({ ownerId, parentId }) {
  try {
    const version = (await getRedisClient().get(versionKey(ownerId))) ?? "0";
    const folder = parentId?.toHexString() ?? "root";

    return `datadock:items:${ownerId}:list:${folder}:v${version}`;
  } catch (error) {
    console.error("Item cache key lookup failed:", error.message);
    return null;
  }
}

export async function getCachedItemList(key) {
  if (!key) return null;

  try {
    return await getJSON(key);
  } catch (error) {
    console.error("Item cache read failed:", error.message);
    return null;
  }
}

export async function cacheItemList(key, value) {
  if (!key) return;

  try {
    await setJSON(key, value, ITEM_LIST_TTL_SECONDS);
  } catch (error) {
    console.error("Item cache write failed:", error.message);
  }
}

export async function invalidateItemLists(ownerId) {
  try {
    await getRedisClient().incr(versionKey(ownerId));
  } catch (error) {
    console.error("Item cache invalidation failed:", error.message);
  }
}
