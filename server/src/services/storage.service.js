import { USER_STORAGE_QUOTA_BYTES } from "../config/storage.js";
import {
  findLargestUserFiles,
  findRecentUserItems,
  findDuplicateFiles,
  findEmptyFolders,
  findLargeUnusedFiles,
  findOldTrashedItems,
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

export async function getStorageActivity({ ownerId, limit = 12 }) {
  const safeLimit = Number.isInteger(limit) ? Math.min(50, Math.max(1, limit)) : 12;
  const items = await findRecentUserItems({ ownerId, limit: Math.min(200, safeLimit * 4) });
  const events = [];

  for (const item of items) {
    const publicItem = toPublicItem(item);

    events.push({
      id: `${publicItem.id}-created`,
      type: item.type === "folder" ? "created" : "uploaded",
      at: item.createdAt,
      item: publicItem,
    });

    if (item.updatedAt > item.createdAt) {
      events.push({
        id: `${publicItem.id}-modified`,
        type: item.trashedAt ? "deleted" : "modified",
        at: item.trashedAt ?? item.updatedAt,
        item: publicItem,
      });
    }

    if (item.share?.createdAt) {
      events.push({
        id: `${publicItem.id}-shared`,
        type: "shared",
        at: item.share.createdAt,
        item: publicItem,
      });
    }
  }

  return events
    .sort((first, second) => new Date(second.at) - new Date(first.at))
    .slice(0, safeLimit);
}

export async function getCleanupSuggestions(ownerId) {
  const day = 24 * 60 * 60 * 1000;
  const [largeUnused, duplicateGroups, oldTrash, emptyFolders] = await Promise.all([
    findLargeUnusedFiles({
      ownerId,
      minimumSize: 100_000_000,
      openedBefore: new Date(Date.now() - 90 * day),
    }),
    findDuplicateFiles(ownerId),
    findOldTrashedItems({
      ownerId,
      trashedBefore: new Date(Date.now() - 30 * day),
    }),
    findEmptyFolders(ownerId),
  ]);

  const suggestions = [];

  if (largeUnused.length) {
    suggestions.push({
      id: "large-unused",
      title: "Large files you have not opened",
      body: "Nothing has touched these in over 90 days.",
      action: "review",
      items: largeUnused.map(toPublicItem),
      reclaimable: largeUnused.reduce((total, item) => total + (item.size ?? 0), 0),
    });
  }

  if (duplicateGroups.length) {
    const duplicateItems = duplicateGroups.flatMap((group) => group.items);
    suggestions.push({
      id: "duplicates",
      title: "Possible duplicates",
      body: "Same name and same size, in more than one place.",
      action: "review",
      items: duplicateItems.map(toPublicItem),
      reclaimable: duplicateGroups.reduce(
        (total, group) => total + (group._id.size ?? 0) * (group.count - 1),
        0,
      ),
    });
  }

  if (oldTrash.length) {
    suggestions.push({
      id: "old-trash",
      title: "Trash older than a month",
      body: "Still taking up space until it is permanently deleted.",
      action: "trash",
      items: oldTrash.map(toPublicItem),
      reclaimable: oldTrash.reduce((total, item) => total + (item.size ?? 0), 0),
    });
  }

  if (emptyFolders.length) {
    suggestions.push({
      id: "empty-folders",
      title: "Empty folders",
      body: "Nothing is stored inside them.",
      action: "review",
      items: emptyFolders.map(toPublicItem),
      reclaimable: 0,
    });
  }

  return suggestions.sort((first, second) => second.reclaimable - first.reclaimable);
}
