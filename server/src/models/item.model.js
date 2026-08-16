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
export async function insertFolder({ ownerId, name, parentId = null }) {
  const database = getDatabase();
  const itemsCollection = database.collection(ITEMS_COLLECTION);
  const now = new Date();
  const folder = {
    ownerId,
    type: "folder",
    name,
    parentId,
    starred: false,
    trashedAt: null,
    createdAt: now,
    updatedAt: now,
  };
  const result = await itemsCollection.insertOne(folder);
  return{
    ...folder,
    _id: result.insertedId,
  };
}
