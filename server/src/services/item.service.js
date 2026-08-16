import { findItemsByParent, insertFolder } from "../models/item.model.js";

export async function listItems({ ownerId, parentId = null }) {
  if (!ownerId) {
    throw new Error("ownerId is required to list the items");
  }

  const items = await findItemsByParent({
    ownerId,
    parentId,
  });
  return {
    items,
    nextCursor: null,
    total: items.length,
  };
}
