import { getDatabase } from "../config/db.js";

const COLLECTION = "googleDriveConnections";

export function findGoogleDriveConnection(userId) {
  return getDatabase().collection(COLLECTION).findOne({ userId });
}

export async function saveGoogleDriveConnection({ userId, email, name, refreshToken }) {
  const now = new Date();
  return getDatabase().collection(COLLECTION).findOneAndUpdate(
    { userId },
    {
      $set: { email, name, refreshToken, updatedAt: now },
      $setOnInsert: { createdAt: now },
    },
    { upsert: true, returnDocument: "after" },
  );
}

export function deleteGoogleDriveConnection(userId) {
  return getDatabase().collection(COLLECTION).deleteOne({ userId });
}

export async function createGoogleDriveIndexes() {
  await getDatabase().collection(COLLECTION).createIndex({ userId: 1 }, { unique: true });
}
