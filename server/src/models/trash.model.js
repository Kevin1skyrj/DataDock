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

export async function findTrashedItems({ ownerId }) {
  const database = getDatabase();

  return database
    .collection(ITEMS_COLLECTION)
    .find({
      ownerId,
      trashedAt: {
        $exists: true,
        $ne: null,
      },
    })
    .sort({
      trashedAt: -1,
    })
    .toArray();
}

export async function findTrashedItemsByIds({ ownerId, itemIds }) {
  const database = getDatabase();

  return database
    .collection(ITEMS_COLLECTION)
    .find({
      _id: { $in: itemIds },
      ownerId,
      trashedAt: {
        $exists: true,
        $ne: null,
      },
    })
    .toArray();
}

export async function restoreItemsFromTrash({ ownerId, itemIds }) {
  const database = getDatabase();
  const itemsCollection = database.collection(ITEMS_COLLECTION);

  await itemsCollection.updateMany(
    {
      _id: { $in: itemIds },
      ownerId,
      trashedAt: {
        $exists: true,
        $ne: null,
      },
    },
    {
      $set: {
        trashedAt: null,
        updatedAt: new Date(),
      },
    },
  );

  return itemsCollection
    .find({
      _id: { $in: itemIds },
      ownerId,
      trashedAt: null,
    })
    .toArray();
}
