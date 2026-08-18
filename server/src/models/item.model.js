import { getDatabase } from "../config/db.js";

const ITEMS_COLLECTION = "items";

export async function createItemIndexes() {
  await getDatabase().collection(ITEMS_COLLECTION).createIndex(
    { "share.token": 1 },
    {
      unique: true,
      partialFilterExpression: { "share.token": { $type: "string" } },
    },
  );

  await getDatabase().collection(ITEMS_COLLECTION).createIndex(
    { storageKey: 1 },
    {
      unique: true,
      partialFilterExpression: { storageKey: { $type: "string" } },
    },
  );

  await getDatabase()
    .collection(ITEMS_COLLECTION)
    .createIndex({ ownerId: 1, type: 1, trashedAt: 1, size: -1 });
}

export async function findItemsByParent({ ownerId, parentId = null }) {
  const database = getDatabase();
  const itemsCollection = database.collection(ITEMS_COLLECTION);

  const items = await itemsCollection
    .find({
      ownerId,
      parentId,
      trashedAt: null,
    })
    .sort({
      type: -1,
      name: 1,
    })
    .toArray();

  return items;
}

export async function findItemByName({
  ownerId,
  parentId = null,
  normalizedName,
}) {
  const database = getDatabase();

  return database.collection(ITEMS_COLLECTION).findOne({
    ownerId,
    parentId,
    normalizedName,
    trashedAt: null,
  });
}

export async function insertFolder({ ownerId, name, parentId = null }) {
  const database = getDatabase();
  const itemsCollection = database.collection(ITEMS_COLLECTION);
  const now = new Date();
  const folder = {
    ownerId,
    type: "folder",
    name,
    normalizedName: name.toLowerCase(),
    parentId,
    starred: false,
    trashedAt: null,
    createdAt: now,
    updatedAt: now,
  };
  const result = await itemsCollection.insertOne(folder);
  return {
    ...folder,
    _id: result.insertedId,
  };
}

export async function findFolderById({ ownerId, folderId }) {
  const database = getDatabase();
  return database.collection(ITEMS_COLLECTION).findOne({
    _id: folderId,
    ownerId,
    type: "folder",
    trashedAt: null,
  });
}

export async function findItemById({ ownerId, itemId }) {
  const database = getDatabase();
  return database.collection(ITEMS_COLLECTION).findOne({
    _id: itemId,
    ownerId,
  });
}

export async function updateItemName({
  ownerId,
  itemId,
  name,
  normalizedName,
}) {
  const database = getDatabase();
  return database.collection(ITEMS_COLLECTION).findOneAndUpdate(
    {
      _id: itemId,
      ownerId,
      trashedAt: null,
    },
    {
      $set: {
        name,
        normalizedName,
        updatedAt: new Date(),
      },
    },
    {
      returnDocument: "after",
    },
  );
}

export async function updateItemsStarred({ ownerId, itemIds, starred }) {
  const database = getDatabase();
  const itemsCollection = database.collection(ITEMS_COLLECTION);
  const updatedAt = new Date();
  await itemsCollection.updateMany(
    {
      _id: { $in: itemIds },
      ownerId,
      trashedAt: null,
    },
    {
      $set: {
        starred,
        updatedAt,
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

export async function findStarredItems({ ownerId }) {
  const database = getDatabase();

  return database
    .collection(ITEMS_COLLECTION)
    .find({
      ownerId,
      starred: true,
      trashedAt: null,
    })
    .sort({
      updatedAt: -1,
    })
    .toArray();
}

export async function findItemsByIds({ ownerId, itemIds }) {
  const database = getDatabase();

  return database
    .collection(ITEMS_COLLECTION)
    .find({
      _id: { $in: itemIds },
      ownerId,
      trashedAt: null,
    })
    .toArray();
}

export async function updateItemsParent({ ownerId, itemIds, parentId }) {
  const database = getDatabase();

  await database.collection(ITEMS_COLLECTION).updateMany(
    {
      _id: { $in: itemIds },
      ownerId,
      trashedAt: null,
    },
    {
      $set: {
        parentId,
        updatedAt: new Date(),
      },
    },
  );

  return findItemsByIds({
    ownerId,
    itemIds,
  });
}

export async function findFoldersByParent({
  ownerId,
  parentId = null,
}) {
  const database = getDatabase();

  return database
    .collection(ITEMS_COLLECTION)
    .find({
      ownerId,
      parentId,
      type: "folder",
      trashedAt: null,
    })
    .sort({
      name: 1,
    })
    .toArray();
}

export async function getFolderSummaryData({
  ownerId,
  parentId = null,
}) {
  const database = getDatabase();

  const [summary] = await database
    .collection(ITEMS_COLLECTION)
    .aggregate([
      {
        $match: {
          ownerId,
          parentId,
          trashedAt: null,
        },
      },
      {
        $graphLookup: {
          from: ITEMS_COLLECTION,
          startWith: "$_id",
          connectFromField: "_id",
          connectToField: "parentId",
          as: "descendants",
          restrictSearchWithMatch: { ownerId, trashedAt: null },
        },
      },
      {
        $project: {
          nodes: {
            $concatArrays: [
              [{ _id: "$_id", type: "$type", size: "$size", updatedAt: "$updatedAt" }],
              "$descendants",
            ],
          },
        },
      },
      { $unwind: "$nodes" },
      {
        $group: {
          _id: "$nodes._id",
          type: { $first: "$nodes.type" },
          size: { $first: { $ifNull: ["$nodes.size", 0] } },
          updatedAt: { $first: "$nodes.updatedAt" },
        },
      },
      {
        $group: {
          _id: null,
          count: { $sum: 1 },
          folderCount: { $sum: { $cond: [{ $eq: ["$type", "folder"] }, 1, 0] } },
          size: { $sum: "$size" },
          updatedAt: { $max: "$updatedAt" },
        },
      },
    ])
    .toArray();

  return summary ?? {
    count: 0,
    folderCount: 0,
    size: 0,
    updatedAt: null,
  };
}

export async function getFolderDescendantStats({ ownerId, folderIds }) {
  if (folderIds.length === 0) return [];

  return getDatabase()
    .collection(ITEMS_COLLECTION)
    .aggregate([
      {
        $match: {
          _id: { $in: folderIds },
          ownerId,
          type: "folder",
          trashedAt: null,
        },
      },
      {
        $graphLookup: {
          from: ITEMS_COLLECTION,
          startWith: "$_id",
          connectFromField: "_id",
          connectToField: "parentId",
          as: "descendants",
          restrictSearchWithMatch: { ownerId, trashedAt: null },
        },
      },
      {
        $project: {
          itemCount: { $size: "$descendants" },
          size: { $sum: "$descendants.size" },
        },
      },
    ])
    .toArray();
}

export async function insertFile({
  ownerId,
  name,
  parentId,
  kind,
  mimeType,
  size,
  storageKey,
}) {
  const now = new Date();
  const file = {
    ownerId,
    type: "file",
    name,
    normalizedName: name.toLowerCase(),
    parentId,
    kind,
    mimeType,
    size,
    storageKey,
    starred: false,
    trashedAt: null,
    createdAt: now,
    updatedAt: now,
    openedAt: null,
  };
  const result = await getDatabase().collection(ITEMS_COLLECTION).insertOne(file);

  return { ...file, _id: result.insertedId };
}

export async function getUserStorageUsage(ownerId) {
  const [result] = await getDatabase()
    .collection(ITEMS_COLLECTION)
    .aggregate([
      { $match: { ownerId, type: "file" } },
      { $group: { _id: null, used: { $sum: { $ifNull: ["$size", 0] } } } },
    ])
    .toArray();

  return result?.used ?? 0;
}

export async function getUserStorageSummary(ownerId) {
  const [result] = await getDatabase()
    .collection(ITEMS_COLLECTION)
    .aggregate([
      { $match: { ownerId } },
      {
        $group: {
          _id: null,
          used: {
            $sum: {
              $cond: [
                { $and: [{ $eq: ["$type", "file"] }, { $eq: ["$trashedAt", null] }] },
                { $ifNull: ["$size", 0] },
                0,
              ],
            },
          },
          trashed: {
            $sum: {
              $cond: [
                { $and: [{ $eq: ["$type", "file"] }, { $ne: ["$trashedAt", null] }] },
                { $ifNull: ["$size", 0] },
                0,
              ],
            },
          },
          fileCount: {
            $sum: {
              $cond: [
                { $and: [{ $eq: ["$type", "file"] }, { $eq: ["$trashedAt", null] }] },
                1,
                0,
              ],
            },
          },
          folderCount: {
            $sum: {
              $cond: [
                { $and: [{ $eq: ["$type", "folder"] }, { $eq: ["$trashedAt", null] }] },
                1,
                0,
              ],
            },
          },
        },
      },
    ])
    .toArray();

  return result ?? { used: 0, trashed: 0, fileCount: 0, folderCount: 0 };
}

export async function getUserStorageBreakdown(ownerId) {
  return getDatabase()
    .collection(ITEMS_COLLECTION)
    .aggregate([
      { $match: { ownerId, type: "file", trashedAt: null } },
      {
        $group: {
          _id: "$kind",
          bytes: { $sum: { $ifNull: ["$size", 0] } },
          count: { $sum: 1 },
        },
      },
      { $sort: { bytes: -1 } },
      { $project: { _id: 0, kind: "$_id", bytes: 1, count: 1 } },
    ])
    .toArray();
}

export async function findLargestUserFiles({ ownerId, limit }) {
  return getDatabase()
    .collection(ITEMS_COLLECTION)
    .find({ ownerId, type: "file", trashedAt: null })
    .sort({ size: -1, _id: 1 })
    .limit(limit)
    .toArray();
}

export async function findRecentUserItems({ ownerId, limit }) {
  return getDatabase()
    .collection(ITEMS_COLLECTION)
    .find({ ownerId })
    .sort({ updatedAt: -1, _id: -1 })
    .limit(limit)
    .toArray();
}

export async function findLargeUnusedFiles({ ownerId, minimumSize, openedBefore }) {
  return getDatabase()
    .collection(ITEMS_COLLECTION)
    .find({
      ownerId,
      type: "file",
      trashedAt: null,
      size: { $gte: minimumSize },
      $or: [{ openedAt: null }, { openedAt: { $lt: openedBefore } }],
    })
    .sort({ size: -1 })
    .limit(50)
    .toArray();
}

export async function findDuplicateFiles(ownerId) {
  const groups = await getDatabase()
    .collection(ITEMS_COLLECTION)
    .aggregate([
      { $match: { ownerId, type: "file", trashedAt: null } },
      {
        $group: {
          _id: { name: "$normalizedName", size: "$size" },
          items: { $push: "$$ROOT" },
          count: { $sum: 1 },
        },
      },
      { $match: { count: { $gt: 1 } } },
      { $sort: { "_id.size": -1 } },
      { $limit: 25 },
    ])
    .toArray();

  return groups;
}

export async function findOldTrashedItems({ ownerId, trashedBefore }) {
  return getDatabase()
    .collection(ITEMS_COLLECTION)
    .aggregate([
      { $match: { ownerId, trashedAt: { $lt: trashedBefore } } },
      { $sort: { trashedAt: 1 } },
      { $limit: 50 },
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
        $set: {
          size: {
            $cond: [
              { $eq: ["$type", "folder"] },
              { $sum: "$descendants.size" },
              { $ifNull: ["$size", 0] },
            ],
          },
        },
      },
      { $unset: "descendants" },
    ])
    .toArray();
}

export async function findEmptyFolders(ownerId) {
  return getDatabase()
    .collection(ITEMS_COLLECTION)
    .aggregate([
      { $match: { ownerId, type: "folder", trashedAt: null } },
      {
        $lookup: {
          from: ITEMS_COLLECTION,
          let: { folderId: "$_id" },
          pipeline: [
            {
              $match: {
                ownerId,
                trashedAt: null,
                $expr: { $eq: ["$parentId", "$$folderId"] },
              },
            },
            { $limit: 1 },
          ],
          as: "children",
        },
      },
      { $match: { children: { $size: 0 } } },
      { $limit: 50 },
      { $unset: "children" },
    ])
    .toArray();
}

export async function updateItemShare({ ownerId, itemId, share }) {
  return getDatabase().collection(ITEMS_COLLECTION).findOneAndUpdate(
    { _id: itemId, ownerId, trashedAt: null },
    share
      ? { $set: { share, updatedAt: new Date() } }
      : { $unset: { share: "" }, $set: { updatedAt: new Date() } },
    { returnDocument: "after" },
  );
}

export async function findPublicShareByToken(token) {
  return getDatabase().collection(ITEMS_COLLECTION).findOne({
    "share.token": token,
    "share.scope": "link",
    trashedAt: null,
    $or: [
      { "share.expiresAt": null },
      { "share.expiresAt": { $gt: new Date() } },
    ],
  });
}
