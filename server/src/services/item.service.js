import {
  findItemByName,
  findItemsByParent,
  insertFolder,
} from "../models/item.model.js";

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
    throw new Error("Folder name is required");
  }

  const trimmedName = name.trim();
  const existingItem = await findItemByName({
    ownerId,
    parentId,
    normalizedName: trimmedName.toLowerCase(),
  });

  if (existingItem) {
    throw new Error("An item with this name already exists in this folder");
  }

  const folder = await insertFolder({
    ownerId,
    name: trimmedName,
    parentId,
  });

  return toPublicItem(folder);
}
