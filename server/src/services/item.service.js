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
} from "../models/item.model.js";
import { AppError } from "../errors/app-error.js";

function toPublicItem(item) {
  return {
    id: item._id.toHexString(),
    type: item.type,
    name: item.name,
    parentId: item.parentId?.toHexString() ?? null,
    starred: item.starred,
    trashedAt: item.trashedAt,
    createdAt: item.createdAt,
    updatedAt: item.updatedAt,
  };
}

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

export async function listItems({ ownerId, parentId = null }) {
  if (!ownerId) {
    throw new Error("ownerId is required to list the items");
  }
  const resolvedParentId = await resolveParentId({
    ownerId,
    parentId,
  });
  const items = await findItemsByParent({
    ownerId,
    parentId: resolvedParentId,
  });

  return {
    items: items.map(toPublicItem),
    nextCursor: null,
    total: items.length,
  };
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

  return items.map(toPublicItem);
}


export async function listStarredItems({ ownerId }) {
  const items = await findStarredItems({
    ownerId,
  });

  return {
    items: items.map(toPublicItem),
    nextCursor: null,
    total: items.length,
  };
}