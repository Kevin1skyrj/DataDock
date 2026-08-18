import { USER_STORAGE_QUOTA_BYTES } from "../config/storage.js";
import {
  findLargestUserFiles,
  getUserStorageBreakdown,
  getUserStorageSummary,
} from "../models/item.model.js";
import { toPublicItem } from "../mappers/item.mapper.js";

export async function getStorageSummary(ownerId) {
  const summary = await getUserStorageSummary(ownerId);
  const occupied = summary.used + summary.trashed;

  return {
    ...summary,
    quota: USER_STORAGE_QUOTA_BYTES,
    available: Math.max(0, USER_STORAGE_QUOTA_BYTES - occupied),
    plan: {
      name: "Free",
      quotaLabel: "5 GB",
    },
  };
}

export function getStorageBreakdown(ownerId) {
  return getUserStorageBreakdown(ownerId);
}

export async function getLargestFiles({ ownerId, limit = 8 }) {
  const safeLimit = Number.isInteger(limit) ? Math.min(50, Math.max(1, limit)) : 8;
  const files = await findLargestUserFiles({ ownerId, limit: safeLimit });
  return files.map(toPublicItem);
}
