import { ObjectId } from "mongodb";
import {
  findItemById,
  findFolderById,
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
})
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

export async function getItem({ownerId, itemId}) {
  if(!ObjectId.isValid(itemId)){
    throw new AppError("Invalid item ID",{
      statusCode: 400,
      code: "invalid-item-id",
    });
  }
  const item = await findItemById({
    ownerId,
    itemId: new ObjectId(itemId),
  })
  if(!item){
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
