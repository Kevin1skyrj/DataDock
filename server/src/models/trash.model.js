import { getDatabase } from "../config/db.js";

const ITEMS_COLLECTION = "items";

export async function moveItemsToTrash({ ownerId, itemIds }) {
  const database = getDatabase();
  const itemsCollection = database.collection(ITEMS_COLLECTION);
  const trashedAt = new Date();

  await itemsCollection.updateMany(
    {
      _id: { $in: itemIds },
      ownerId,
      trashedAt: null,
    },
    {
      $set: {
        trashedAt,
        updatedAt: trashedAt,
      },
    },
  );

  return itemsCollection
    .find({
      _id: { $in: itemIds },
      ownerId,
      trashedAt,
    })
    .toArray();
}
