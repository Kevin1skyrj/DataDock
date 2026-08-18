import { ObjectId } from "mongodb";
import {
  findItemById,
  findFolderById,
  findItemByName,
  findItemsByParent,
  insertFolder,
  updateItemName,
  updateItemsStarred,
  findStarredItems,
  findItemsByIds,
  updateItemsParent,
  findFoldersByParent,
  getFolderSummaryData,
  getFolderDescendantStats,
} from "../models/item.model.js";
import { AppError } from "../errors/app-error.js";
import { toPublicItem } from "../mappers/item.mapper.js";
import { GetObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { s3BucketName, s3Client } from "../config/s3.js";
import {
  cacheItemList,
  getCachedItemList,
  getItemListCacheKey,
  invalidateItemLists,
} from "./item-cache.service.js";

async function resolveParentId({ ownerId, parentId }) {
  if (parentId === null || parentId === undefined) {
    return null;
  }
  if (typeof parentId !== "string" || !ObjectId.isValid(parentId)) {
    throw new AppError("Invalid parent folder ID", {
      statusCode: 400,
      code: "invalid-parent-id",
    });
  }
  const folderId = new ObjectId(parentId);
  const parentFolder = await findFolderById({
    ownerId,
    folderId,
  });

  if (!parentFolder) {
    throw new AppError("Parent folder not found", {
      statusCode: 404,
      code: "parent-folder-not-found",
    });
  }
  return folderId;
}

async function addFolderStats(ownerId, items) {
  const folderIds = items.filter((item) => item.type === "folder").map((item) => item._id);
  const stats = await getFolderDescendantStats({ ownerId, folderIds });
  const statsById = new Map(stats.map((entry) => [entry._id.toHexString(), entry]));

  return items.map((item) => {
    if (item.type !== "folder") return item;
    const folderStats = statsById.get(item._id.toHexString());
    return {
      ...item,
      itemCount: folderStats?.itemCount ?? 0,
      size: folderStats?.size ?? 0,
    };
  });
}

export async function listItems({ ownerId, parentId = null }) {
  if (!ownerId) {
    throw new Error("ownerId is required to list the items");
  }
  const resolvedParentId = await resolveParentId({
    ownerId,
    parentId,
  });
  const cacheKey = await getItemListCacheKey({
    ownerId,
    parentId: resolvedParentId,
  });
  const cachedResult = await getCachedItemList(cacheKey);

  if (cachedResult) {
    return cachedResult;
  }

  const items = await findItemsByParent({
    ownerId,
    parentId: resolvedParentId,
  });

  const itemsWithStats = await addFolderStats(ownerId, items);
  const result = {
    items: itemsWithStats.map(toPublicItem),
    nextCursor: null,
    total: items.length,
  };

  await cacheItemList(cacheKey, result);
  return result;
}

export async function getItem({ ownerId, itemId }) {
  if (!ObjectId.isValid(itemId)) {
    throw new AppError("Invalid item ID", {
      statusCode: 400,
      code: "invalid-item-id",
    });
  }
  const item = await findItemById({
    ownerId,
    itemId: new ObjectId(itemId),
  });
  if (!item) {
    throw new AppError("Item not found", {
      statusCode: 404,
      code: "item-not-found",
    });
  }
  return toPublicItem(item);
}

export async function getItemDownload({ ownerId, itemId }) {
  if (!ObjectId.isValid(itemId)) {
    throw new AppError("Invalid item ID", {
      statusCode: 400,
      code: "invalid-item-id",
    });
  }

  const item = await findItemById({ ownerId, itemId: new ObjectId(itemId) });
  if (!item || item.type !== "file" || item.trashedAt || !item.storageKey) {
    throw new AppError("File not found", {
      statusCode: 404,
      code: "file-not-found",
    });
  }

  const safeName = item.name.replace(/[\r\n"]/g, "_");
  const expiresIn = 15 * 60;
  const url = await getSignedUrl(
    s3Client,
    new GetObjectCommand({
      Bucket: s3BucketName,
      Key: item.storageKey,
      ResponseContentDisposition: `attachment; filename="${safeName}"; filename*=UTF-8''${encodeURIComponent(item.name)}`,
      ResponseContentType: item.mimeType,
    }),
    { expiresIn },
  );

  return {
    url,
    expiresAt: new Date(Date.now() + expiresIn * 1000),
  };
}

export async function getItemPreview({ ownerId, itemId }) {
  if (!ObjectId.isValid(itemId)) {
    throw new AppError("Invalid item ID", {
      statusCode: 400,
      code: "invalid-item-id",
    });
  }

  const item = await findItemById({ ownerId, itemId: new ObjectId(itemId) });
  if (!item || item.type !== "file" || item.trashedAt || !item.storageKey) {
    throw new AppError("File not found", {
      statusCode: 404,
      code: "file-not-found",
    });
  }

  if (!["image", "pdf", "video", "audio"].includes(item.kind)) {
    return {
      kind: "unsupported",
      reason: "There is no preview for this file type yet.",
    };
  }

  const expiresIn = 15 * 60;
  const url = await getSignedUrl(
    s3Client,
    new GetObjectCommand({
      Bucket: s3BucketName,
      Key: item.storageKey,
      ResponseContentDisposition: "inline",
      ResponseContentType: item.mimeType,
    }),
    { expiresIn },
  );

  return {
    kind: item.kind,
    url,
    expiresAt: new Date(Date.now() + expiresIn * 1000),
  };
}

export async function createFolder({ ownerId, name, parentId = null }) {
  if (!ownerId) {
    throw new Error("ownerId is required");
  }

  if (typeof name !== "string" || !name.trim()) {
    throw new AppError("Folder name is required", {
      statusCode: 400,
      code: "invalid-name",
    });
  }

  const trimmedName = name.trim();
  const resolvedParentId = await resolveParentId({ ownerId, parentId });

  const existingItem = await findItemByName({
    ownerId,
    parentId: resolvedParentId,
    normalizedName: trimmedName.toLowerCase(),
  });

  if (existingItem) {
    throw new AppError("An item with this name already exists in this folder", {
      statusCode: 409,
      code: "name-conflict",
    });
  }

  const folder = await insertFolder({
    ownerId,
    name: trimmedName,
    parentId: resolvedParentId,
  });

  await invalidateItemLists(ownerId);

  return toPublicItem(folder);
}

export async function getFolderPath({ ownerId, folderId }) {
  if (!ObjectId.isValid(folderId)) {
    throw new AppError("Invalid folder ID", {
      statusCode: 400,
      code: "invalid-folder-id",
    });
  }
  const path = [];
  let currentFolderId = new ObjectId(folderId);
  while (currentFolderId) {
    const folder = await findFolderById({
      ownerId,
      folderId: currentFolderId,
    });

    if (!folder) {
      throw new AppError("Folder not found", {
        statusCode: 404,
        code: "folder-not-found",
      });
    }
    path.unshift(toPublicItem(folder));
    currentFolderId = folder.parentId;
  }
  return path;
}

export async function renameItem({ ownerId, itemId, name }) {
  if (!ObjectId.isValid(itemId)) {
    throw new AppError("Invalid item ID", {
      statusCode: 400,
      code: "invalid-item-id",
    });
  }
  if (typeof name !== "string" || !name.trim()) {
    throw new AppError("Item name is required", {
      statusCode: 400,
      code: "invalid-name",
    });
  }
  const objectId = new ObjectId(itemId);
  const item = await findItemById({
    ownerId,
    itemId: objectId,
  });

  if (!item || item.trashedAt) {
    throw new AppError("Item not found", {
      statusCode: 404,
      code: "item-not-found",
    });
  }

  const trimmedName = name.trim();
  const normalizedName = trimmedName.toLowerCase();

  const existingItem = await findItemByName({
    ownerId,
    parentId: item.parentId,
    normalizedName,
  });

  if (existingItem && !existingItem._id.equals(objectId)) {
    throw new AppError("An item with this name already exists in this folder", {
      statusCode: 409,
      code: "name-conflict",
    });
  }

  const updatedItem = await updateItemName({
    ownerId,
    itemId: objectId,
    name: trimmedName,
    normalizedName,
  });

  await invalidateItemLists(ownerId);

  return toPublicItem(updatedItem);
}

export async function starItems({ ownerId, itemIds, starred }) {
  if (!Array.isArray(itemIds) || itemIds.length === 0) {
    throw new AppError("At least one item ID is required", {
      statusCode: 400,
      code: "invalid-item-ids",
    });
  }

  if (!itemIds.every((itemId) => ObjectId.isValid(itemId))) {
    throw new AppError("One or more item IDs are invalid", {
      statusCode: 400,
      code: "invalid-item-ids",
    });
  }

  if (typeof starred !== "boolean") {
    throw new AppError("Starred must be true or false", {
      statusCode: 400,
      code: "invalid-starred-value",
    });
  }

  const objectIds = itemIds.map((itemId) => new ObjectId(itemId));

  const items = await updateItemsStarred({
    ownerId,
    itemIds: objectIds,
    starred,
  });

  if (items.length === 0) {
    throw new AppError("Items not found", {
      statusCode: 404,
      code: "items-not-found",
    });
  }

  await invalidateItemLists(ownerId);

  return items.map(toPublicItem);
}

export async function listStarredItems({ ownerId }) {
  const items = await findStarredItems({
    ownerId,
  });
  const itemsWithStats = await addFolderStats(ownerId, items);

  return {
    items: itemsWithStats.map(toPublicItem),
    nextCursor: null,
    total: items.length,
  };
}

export async function moveItems({ ownerId, itemIds, parentId = null }) {
  if (!Array.isArray(itemIds) || itemIds.length === 0) {
    throw new AppError("At least one item ID is required", {
      statusCode: 400,
      code: "invalid-item-ids",
    });
  }

  if (!itemIds.every((itemId) => ObjectId.isValid(itemId))) {
    throw new AppError("One or more item IDs are invalid", {
      statusCode: 400,
      code: "invalid-item-ids",
    });
  }

  const uniqueItemIds = [...new Set(itemIds)];
  const objectIds = uniqueItemIds.map((itemId) => new ObjectId(itemId));

  const items = await findItemsByIds({
    ownerId,
    itemIds: objectIds,
  });

  if (items.length !== objectIds.length) {
    throw new AppError("One or more items were not found", {
      statusCode: 404,
      code: "items-not-found",
    });
  }

  const resolvedParentId = await resolveParentId({
    ownerId,
    parentId,
  });

  const selectedFolderIds = new Set(
    items
      .filter((item) => item.type === "folder")
      .map((item) => item._id.toHexString()),
  );

  let ancestorId = resolvedParentId;

  while (ancestorId) {
    if (selectedFolderIds.has(ancestorId.toHexString())) {
      throw new AppError("A folder cannot be moved inside itself", {
        statusCode: 400,
        code: "invalid-move",
      });
    }

    const ancestor = await findFolderById({
      ownerId,
      folderId: ancestorId,
    });

    ancestorId = ancestor?.parentId ?? null;
  }

  const selectedNames = new Set();

  for (const item of items) {
    if (selectedNames.has(item.normalizedName)) {
      throw new AppError("Selected items contain duplicate names", {
        statusCode: 409,
        code: "name-conflict",
      });
    }

    selectedNames.add(item.normalizedName);

    const existingItem = await findItemByName({
      ownerId,
      parentId: resolvedParentId,
      normalizedName: item.normalizedName,
    });

    const existingItemIsSelected = objectIds.some((itemId) =>
      existingItem?._id.equals(itemId),
    );

    if (existingItem && !existingItemIsSelected) {
      throw new AppError(
        "An item with this name already exists in the destination folder",
        {
          statusCode: 409,
          code: "name-conflict",
        },
      );
    }
  }

  const movedItems = await updateItemsParent({
    ownerId,
    itemIds: objectIds,
    parentId: resolvedParentId,
  });

  await invalidateItemLists(ownerId);

  return movedItems.map(toPublicItem);
}

export async function listFolders({ ownerId, parentId = null }) {
  const resolvedParentId = await resolveParentId({
    ownerId,
    parentId,
  });

  const folders = await findFoldersByParent({
    ownerId,
    parentId: resolvedParentId,
  });

  const foldersWithStats = await addFolderStats(ownerId, folders);
  return foldersWithStats.map(toPublicItem);
}

export async function getFolderSummary({ ownerId, parentId = null }) {
  const resolvedParentId = await resolveParentId({
    ownerId,
    parentId,
  });

  const summary = await getFolderSummaryData({
    ownerId,
    parentId: resolvedParentId,
  });

  return {
    count: summary.count,
    folderCount: summary.folderCount,
    size: summary.size,
    updatedAt: summary.updatedAt,
  };
}
