import { ObjectId } from "mongodb";
import { DeleteObjectsCommand } from "@aws-sdk/client-s3";
import { AppError } from "../errors/app-error.js";
import { s3BucketName, s3Client } from "../config/s3.js";
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
  findPermanentDeletionCandidates,
  deleteItemsPermanently,
} from "../models/trash.model.js";
import { invalidateItemLists } from "./item-cache.service.js";

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

  await invalidateItemLists(ownerId);

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

  await invalidateItemLists(ownerId);

  return restoredItems.map(toPublicItem);
}

export async function permanentlyDeleteItems({ ownerId, itemIds }) {
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

  const rootIds = [...new Set(itemIds)].map((itemId) => new ObjectId(itemId));
  const candidates = await findPermanentDeletionCandidates({ ownerId, itemIds: rootIds });
  const uniqueItems = [...new Map(candidates.map((item) => [item._id.toHexString(), item])).values()];
  const foundRootIds = new Set(
    uniqueItems
      .filter((item) => rootIds.some((rootId) => rootId.equals(item._id)))
      .map((item) => item._id.toHexString()),
  );

  if (foundRootIds.size !== rootIds.length) {
    throw new AppError("One or more trashed items were not found", {
      statusCode: 404,
      code: "items-not-found",
    });
  }

  const storageKeys = uniqueItems
    .filter((item) => item.type === "file" && item.storageKey)
    .map((item) => item.storageKey);

  for (let index = 0; index < storageKeys.length; index += 1000) {
    const batch = storageKeys.slice(index, index + 1000);
    const result = await s3Client.send(
      new DeleteObjectsCommand({
        Bucket: s3BucketName,
        Delete: {
          Objects: batch.map((Key) => ({ Key })),
          Quiet: true,
        },
      }),
    );

    if (result.Errors?.length) {
      throw new AppError("Some stored files could not be deleted", {
        statusCode: 502,
        code: "storage-delete-failed",
      });
    }
  }

  await deleteItemsPermanently({
    ownerId,
    itemIds: uniqueItems.map((item) => item._id),
  });
  await invalidateItemLists(ownerId);

  return {
    deletedItems: uniqueItems.length,
    deletedFiles: storageKeys.length,
  };
}
