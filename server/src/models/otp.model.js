import { getDatabase } from "../config/db.js";

const OTPS_COLLECTION = "otps";

export async function createOtpIndexes() {
  const database = getDatabase();
  const otps = database.collection(OTPS_COLLECTION);

  await otps.createIndex({ userId: 1, purpose: 1 }, { unique: true });

  await otps.createIndex({ expiresAt: 1 }, { expireAfterSeconds: 0 });
}

export async function saveOtp({
  userId,
  purpose,
  codeHash,
  expiresAt,
  attemptsRemaining,
}) {
  const database = getDatabase();

  await database.collection(OTPS_COLLECTION).updateOne(
    {
      userId,
      purpose,
    },
    {
      $set: {
        codeHash,
        expiresAt,
        attemptsRemaining,
        createdAt: new Date(),
      },
    },
    {
      upsert: true,
    },
  );
}
export async function claimOtpAttempt({ userId, purpose }) {
  const database = getDatabase();

  return database.collection(OTPS_COLLECTION).findOneAndUpdate(
    {
      userId,
      purpose,
      expiresAt: { $gt: new Date() },
      attemptsRemaining: { $gt: 0 },
    },
    {
      $inc: {
        attemptsRemaining: -1,
      },
    },
    {
      returnDocument: "before",
    },
  );
}

export async function deleteOtp({ userId, purpose }) {
  const database = getDatabase();

  await database.collection(OTPS_COLLECTION).deleteOne({
    userId,
    purpose,
  });
}

export async function findOtp({ userId, purpose }) {
  const database = getDatabase();

  return database.collection(OTPS_COLLECTION).findOne({
    userId,
    purpose,
  });
}
