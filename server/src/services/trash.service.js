import { ObjectId } from "mongodb";
import { AppError } from "../errors/app-error.js";
import { toPublicItem } from "../mappers/item.mapper.js";
import {
  findFolderById,
  findItemByName,
  findItemsByIds,
} from "../models/item.model.js";
import {
  moveItemsToTrash,
  findTrashedItems,
  findTrashedItemsByIds,
  restoreItemsFromTrash,
} from "../models/trash.model.js";

export async function trashItems({ ownerId, itemIds }) {
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

  const existingItems = await findItemsByIds({
    ownerId,
    itemIds: objectIds,
  });

  if (existingItems.length !== objectIds.length) {
    throw new AppError("One or more items were not found", {
      statusCode: 404,
      code: "items-not-found",
    });
  }

  const trashedItems = await moveItemsToTrash({
    ownerId,
    itemIds: objectIds,
  });

  return trashedItems.map(toPublicItem);
}

export async function listTrashedItems({ ownerId }) {
  const items = await findTrashedItems({
    ownerId,
  });

  return {
    items: items.map(toPublicItem),
    nextCursor: null,
    total: items.length,
  };
}

export async function restoreItems({ ownerId, itemIds }) {
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

  const items = await findTrashedItemsByIds({
    ownerId,
    itemIds: objectIds,
  });

  if (items.length !== objectIds.length) {
    throw new AppError("One or more trashed items were not found", {
      statusCode: 404,
      code: "items-not-found",
    });
  }

  const restoreNames = new Set();

  for (const item of items) {
    const parentKey = item.parentId?.toHexString() ?? "root";
    const nameKey = `${parentKey}:${item.normalizedName}`;

    if (restoreNames.has(nameKey)) {
      throw new AppError("Restored items would have duplicate names", {
        statusCode: 409,
        code: "name-conflict",
      });
    }

    restoreNames.add(nameKey);

    if (item.parentId) {
      const parentFolder = await findFolderById({
        ownerId,
        folderId: item.parentId,
      });

      if (!parentFolder) {
        throw new AppError("Original parent folder is unavailable", {
          statusCode: 409,
          code: "parent-folder-unavailable",
        });
      }
    }

    const existingItem = await findItemByName({
      ownerId,
      parentId: item.parentId,
      normalizedName: item.normalizedName,
    });

    if (existingItem) {
      throw new AppError(
        "An item with this name already exists in the original folder",
        {
          statusCode: 409,
          code: "name-conflict",
        },
      );
    }
  }

  const restoredItems = await restoreItemsFromTrash({
    ownerId,
    itemIds: objectIds,
  });

  return restoredItems.map(toPublicItem);
}