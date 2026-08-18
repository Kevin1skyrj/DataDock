import { randomUUID } from "node:crypto";
import { ObjectId } from "mongodb";
import {
  findItemById,
  findFolderById,
  findItemByName,
  findItemsByParent,
  findItemsByView,
  insertFolder,
  updateItemName,
  updateItemsStarred,
  findStarredItems,
  findItemsByIds,
  updateItemsParent,
  findFoldersByParent,
  getFolderSummaryData,
  getFolderDescendantStats,
  findItemTrees,
  deleteItemsByIds,
  getUserStorageUsage,
  insertFile,
  updateItemOpenedAt,
} from "../models/item.model.js";
import { AppError } from "../errors/app-error.js";
import { toPublicItem } from "../mappers/item.mapper.js";
import {
  CopyObjectCommand,
  DeleteObjectsCommand,
  GetObjectCommand,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { s3BucketName, s3Client } from "../config/s3.js";
import { USER_STORAGE_QUOTA_BYTES } from "../config/storage.js";
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

export async function addFolderStats(ownerId, items) {
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

export async function listItems({
  ownerId,
  parentId = null,
  view = "folder",
  kinds = [],
  query = "",
  sortField,
  sortDirection,
}) {
  if (!ownerId) {
    throw new Error("ownerId is required to list the items");
  }

  const resolvedParentId = view === "folder"
    ? await resolveParentId({ ownerId, parentId })
    : null;
  const normalizedQuery = typeof query === "string" ? query.trim().toLowerCase() : "";
  if (normalizedQuery.length > 200) {
    throw new AppError("Search query is too long", {
      statusCode: 400,
      code: "invalid-search-query",
    });
  }

  const escapedQuery = normalizedQuery.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const requestedKinds = Array.isArray(kinds) ? kinds.slice(0, 20) : [];
  const fileKinds = requestedKinds.filter((kind) => kind !== "folder");
  const kindFilter = requestedKinds.length
    ? {
        $or: [
          ...(requestedKinds.includes("folder") ? [{ type: "folder" }] : []),
          ...(fileKinds.length ? [{ type: "file", kind: { $in: fileKinds } }] : []),
        ],
      }
    : {};
  const viewFilter = {
    folder: { trashedAt: null },
    recent: { trashedAt: null, openedAt: { $type: "date" } },
    starred: { trashedAt: null, starred: true },
    shared: { trashedAt: null, "share.token": { $type: "string" } },
    trash: { trashedAt: { $ne: null } },
  }[view] ?? { trashedAt: null };
  const filters = {
    ...viewFilter,
    ...(escapedQuery ? { normalizedName: { $regex: escapedQuery } } : {}),
    ...kindFilter,
  };
  const allowedSorts = new Set(["name", "kind", "size", "updatedAt", "createdAt", "openedAt", "trashedAt"]);
  const field = allowedSorts.has(sortField)
    ? sortField
    : view === "recent"
      ? "openedAt"
      : view === "trash"
        ? "trashedAt"
        : "name";
  const direction = sortDirection === "desc" ? -1 : 1;
  const sort = field === "name"
    ? { type: -1, normalizedName: direction, _id: direction }
    : field === "kind"
      ? { type: -1, kind: direction, normalizedName: 1, _id: direction }
    : { [field]: direction, _id: direction };
  const cacheable = view === "folder" && !escapedQuery && !requestedKinds.length && field === "name" && direction === 1;
  const cacheKey = cacheable
    ? await getItemListCacheKey({ ownerId, parentId: resolvedParentId })
    : null;
  const cachedResult = cacheKey ? await getCachedItemList(cacheKey) : null;

  if (cachedResult) {
    return cachedResult;
  }

  const items = view === "folder"
    ? await findItemsByParent({ ownerId, parentId: resolvedParentId, filters, sort })
    : await findItemsByView({ ownerId, filters, sort });

  const itemsWithStats = await addFolderStats(ownerId, items);
  const result = {
    items: itemsWithStats.map(toPublicItem),
    nextCursor: null,
    total: items.length,
  };

  if (cacheKey) await cacheItemList(cacheKey, result);
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

  await updateItemOpenedAt({ ownerId, itemId: item._id });

  return createFileDownload(item);
}

export async function createFileDownload(item) {
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

  await updateItemOpenedAt({ ownerId, itemId: item._id });

  return createFilePreview(item);
}

export async function createFilePreview(item) {
  const officeTypes = new Set([
    "application/msword",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    "application/vnd.ms-excel",
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    "application/vnd.ms-powerpoint",
    "application/vnd.openxmlformats-officedocument.presentationml.presentation",
  ]);
  const textPreview =
    item.mimeType?.startsWith("text/") ||
    item.mimeType === "application/json" ||
    item.name.toLowerCase().endsWith(".md");

  if (textPreview) {
    if (item.size > 1_000_000) {
      return {
        kind: "unsupported",
        reason: "Text previews are limited to files smaller than 1 MB.",
      };
    }
    const object = await s3Client.send(
      new GetObjectCommand({
        Bucket: s3BucketName,
        Key: item.storageKey,
      }),
    );
    const content = await object.Body.transformToString("utf-8");
    return {
      kind: item.name.toLowerCase().endsWith(".md")
        ? "markdown"
        : item.kind === "code" || item.mimeType === "application/json"
          ? "code"
          : "text",
      content,
    };
  }

  if (
    !officeTypes.has(item.mimeType) &&
    !["image", "pdf", "video", "audio"].includes(item.kind)
  ) {
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

  const expiresAt = new Date(Date.now() + expiresIn * 1000);
  if (officeTypes.has(item.mimeType)) {
    return {
      kind: "office",
      url: `https://view.officeapps.live.com/op/embed.aspx?src=${encodeURIComponent(url)}`,
      expiresAt,
    };
  }

  return { kind: item.kind, url, expiresAt };
}

function duplicateName(name, number = 1) {
  const dot = name.lastIndexOf(".");
  const hasExtension = dot > 0 && dot < name.length - 1;
  const stem = hasExtension ? name.slice(0, dot) : name;
  const extension = hasExtension ? name.slice(dot) : "";
  return `${stem} copy${number > 1 ? ` ${number}` : ""}${extension}`;
}

async function availableDuplicateName({ ownerId, parentId, name }) {
  for (let number = 1; number <= 1000; number += 1) {
    const candidate = duplicateName(name, number);
    const existing = await findItemByName({
      ownerId,
      parentId,
      normalizedName: candidate.toLowerCase(),
    });
    if (!existing) return candidate;
  }
  throw new AppError("A unique duplicate name could not be created", {
    statusCode: 409,
    code: "name-conflict",
  });
}

export async function duplicateItems({ ownerId, itemIds }) {
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

  const requestedIds = [...new Set(itemIds)].map((itemId) => new ObjectId(itemId));
  const treeItems = await findItemTrees({ ownerId, itemIds: requestedIds });
  const byId = new Map(treeItems.map((item) => [item._id.toHexString(), item]));
  if (requestedIds.some((itemId) => !byId.has(itemId.toHexString()))) {
    throw new AppError("One or more items were not found", {
      statusCode: 404,
      code: "items-not-found",
    });
  }

  const requested = new Set(requestedIds.map((itemId) => itemId.toHexString()));
  const roots = requestedIds
    .map((itemId) => byId.get(itemId.toHexString()))
    .filter((item) => {
      let parentId = item.parentId;
      while (parentId) {
        if (requested.has(parentId.toHexString())) return false;
        parentId = byId.get(parentId.toHexString())?.parentId ?? null;
      }
      return true;
    });
  const totalBytes = [...byId.values()]
    .filter((item) => item.type === "file")
    .reduce((total, item) => total + (item.size ?? 0), 0);
  if ((await getUserStorageUsage(ownerId)) + totalBytes > USER_STORAGE_QUOTA_BYTES) {
    throw new AppError("Duplicating these items would exceed your 5 GB storage limit", {
      statusCode: 409,
      code: "storage-quota-exceeded",
    });
  }

  const children = new Map();
  for (const item of byId.values()) {
    const parent = item.parentId?.toHexString();
    if (parent && byId.has(parent)) {
      children.set(parent, [...(children.get(parent) ?? []), item]);
    }
  }
  const createdIds = [];
  const createdKeys = [];
  const createdRoots = [];

  async function copyTree(source, parentId, isRoot = false) {
    const name = isRoot
      ? await availableDuplicateName({ ownerId, parentId, name: source.name })
      : source.name;

    if (source.type === "folder") {
      const folder = await insertFolder({ ownerId, name, parentId });
      createdIds.push(folder._id);
      if (isRoot) createdRoots.push(folder);
      for (const child of children.get(source._id.toHexString()) ?? []) {
        await copyTree(child, folder._id);
      }
      return;
    }

    if (!source.storageKey) {
      throw new AppError(`${source.name} has no stored file to duplicate`, {
        statusCode: 409,
        code: "file-storage-missing",
      });
    }
    const storageKey = `users/${ownerId}/objects/${randomUUID()}`;
    await s3Client.send(
      new CopyObjectCommand({
        Bucket: s3BucketName,
        Key: storageKey,
        CopySource: `${s3BucketName}/${encodeURIComponent(source.storageKey).replaceAll("%2F", "/")}`,
        ContentType: source.mimeType,
        MetadataDirective: "REPLACE",
      }),
    );
    createdKeys.push(storageKey);
    const file = await insertFile({
      ownerId,
      name,
      parentId,
      kind: source.kind,
      mimeType: source.mimeType,
      size: source.size,
      storageKey,
    });
    createdIds.push(file._id);
    if (isRoot) createdRoots.push(file);
  }

  try {
    for (const root of roots) await copyTree(root, root.parentId, true);
    await invalidateItemLists(ownerId);
    return createdRoots.map(toPublicItem);
  } catch (error) {
    for (let index = 0; index < createdKeys.length; index += 1000) {
      await s3Client.send(
        new DeleteObjectsCommand({
          Bucket: s3BucketName,
          Delete: {
            Objects: createdKeys.slice(index, index + 1000).map((Key) => ({ Key })),
            Quiet: true,
          },
        }),
      );
    }
    if (createdIds.length) await deleteItemsByIds({ ownerId, itemIds: createdIds });
    throw error;
  }
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
