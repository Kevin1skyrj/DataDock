import { USER_STORAGE_QUOTA_BYTES } from "../config/storage.js";
import { getUserStorageSummary } from "../models/item.model.js";

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
