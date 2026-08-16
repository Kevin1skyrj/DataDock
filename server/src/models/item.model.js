import { getDatabase } from "../config/db.js";

const ITEMS_COLLECTION = "items";

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
