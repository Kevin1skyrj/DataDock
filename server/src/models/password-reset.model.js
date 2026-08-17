import { getDatabase } from "../config/db.js";

const PASSWORD_RESETS_COLLECTION = "passwordResets";

export async function createPasswordResetIndexes() {
  const resets = getDatabase().collection(PASSWORD_RESETS_COLLECTION);

  await resets.createIndex({ userId: 1 }, { unique: true });
  await resets.createIndex({ tokenHash: 1 }, { unique: true });
  await resets.createIndex({ expiresAt: 1 }, { expireAfterSeconds: 0 });
}

export async function savePasswordReset({ userId, tokenHash, expiresAt }) {
  const resets = getDatabase().collection(PASSWORD_RESETS_COLLECTION);

  await resets.updateOne(
    { userId },
    {
      $set: {
        tokenHash,
        expiresAt,
        createdAt: new Date(),
      },
    },
    { upsert: true },
  );
}

export async function claimPasswordReset({ userId, tokenHash }) {
  return getDatabase().collection(PASSWORD_RESETS_COLLECTION).findOneAndDelete({
    userId,
    tokenHash,
    expiresAt: { $gt: new Date() },
  });
}
