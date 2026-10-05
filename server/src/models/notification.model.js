import { getDatabase } from "../config/db.js";

const COLLECTION = "notifications";

export async function createNotificationIndexes() {
  const notifications = getDatabase().collection(COLLECTION);
  await notifications.createIndex({ userId: 1, createdAt: -1 });
  await notifications.createIndex({ expiresAt: 1 }, { expireAfterSeconds: 0 });
}

export function insertNotification({ userId, type, itemId, itemName }) {
  const now = new Date();
  return getDatabase().collection(COLLECTION).insertOne({
    userId,
    type,
    itemId,
    itemName,
    readAt: null,
    createdAt: now,
    expiresAt: new Date(now.getTime() + 90 * 24 * 60 * 60 * 1000),
  });
}

export async function listNotifications({ userId, skip, limit }) {
  const collection = getDatabase().collection(COLLECTION);
  const [items, total, unread] = await Promise.all([
    collection.find({ userId }).sort({ createdAt: -1 }).skip(skip).limit(limit).toArray(),
    collection.countDocuments({ userId }),
    collection.countDocuments({ userId, readAt: null }),
  ]);
  return { items, total, unread };
}

export function markNotificationsRead(userId) {
  return getDatabase().collection(COLLECTION).updateMany(
    { userId, readAt: null },
    { $set: { readAt: new Date() } },
  );
}
