import { ObjectId } from "mongodb";
import { AppError } from "../errors/app-error.js";
import { toPublicItem } from "../mappers/item.mapper.js";
import { findItemsByIds } from "../models/item.model.js";
import { moveItemsToTrash, findTrashedItems } from "../models/trash.model.js";

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