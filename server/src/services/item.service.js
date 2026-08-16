import {
  findItemByName,
  findItemsByParent,
  insertFolder,
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

export async function listItems({ ownerId, parentId = null }) {
  if (!ownerId) {
    throw new Error("ownerId is required to list the items");
  }

  const items = await findItemsByParent({
    ownerId,
    parentId,
  });

  return {
    items: items.map(toPublicItem),
    nextCursor: null,
    total: items.length,
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
  const existingItem = await findItemByName({
    ownerId,
    parentId,
    normalizedName: trimmedName.toLowerCase(),
  });

  if (existingItem) {
    throw new AppError(
      "An item with this name already exists in this folder",
      {
        statusCode: 409,
        code: "name-conflict",
      },
    );
  }

  const folder = await insertFolder({
    ownerId,
    name: trimmedName,
    parentId,
  });

  return toPublicItem(folder);
}
