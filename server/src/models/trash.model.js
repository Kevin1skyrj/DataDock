import { getDatabase } from "../config/db.js";

const ITEMS_COLLECTION = "items";

export async function moveItemsToTrash({ ownerId, trees }) {
  const database = getDatabase();
  const itemsCollection = database.collection(ITEMS_COLLECTION);
  const trashedAt = new Date();

  await itemsCollection.bulkWrite(trees.map(({ rootId, itemIds }) => ({
    updateMany: {
      filter: { _id: { $in: itemIds }, ownerId, trashedAt: null },
      update: { $set: { trashedAt, trashRootId: rootId, updatedAt: trashedAt } },
    },
  })));

  const rootIds = trees.map((tree) => tree.rootId);

  return itemsCollection
    .find({
      _id: { $in: rootIds },
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
      $expr: { $eq: ["$_id", { $ifNull: ["$trashRootId", "$_id"] }] },
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
      $expr: { $eq: ["$_id", { $ifNull: ["$trashRootId", "$_id"] }] },
    })
    .toArray();
}

export async function restoreItemsFromTrash({ ownerId, itemIds }) {
  const database = getDatabase();
  const itemsCollection = database.collection(ITEMS_COLLECTION);

  await itemsCollection.updateMany(
    {
      ownerId,
      $or: [
        { trashRootId: { $in: itemIds } },
        { _id: { $in: itemIds }, trashRootId: { $exists: false } },
      ],
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
      $unset: { trashRootId: "" },
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

export async function findPermanentDeletionCandidates({ ownerId, itemIds }) {
  return getDatabase()
    .collection(ITEMS_COLLECTION)
    .aggregate([
      {
        $match: {
          _id: { $in: itemIds },
          ownerId,
          trashedAt: { $exists: true, $ne: null },
          $expr: { $eq: ["$_id", { $ifNull: ["$trashRootId", "$_id"] }] },
        },
      },
      {
        $graphLookup: {
          from: ITEMS_COLLECTION,
          startWith: "$_id",
          connectFromField: "_id",
          connectToField: "parentId",
          as: "descendants",
          restrictSearchWithMatch: { ownerId },
        },
      },
      {
        $project: {
          items: { $concatArrays: [["$$ROOT"], "$descendants"] },
        },
      },
      { $unwind: "$items" },
      { $replaceRoot: { newRoot: "$items" } },
    ])
    .toArray();
}

export async function deleteItemsPermanently({ ownerId, itemIds }) {
  return getDatabase().collection(ITEMS_COLLECTION).deleteMany({
    _id: { $in: itemIds },
    ownerId,
  });
}
