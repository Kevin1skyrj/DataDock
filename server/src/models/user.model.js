import { getDatabase } from "../config/db.js";

const USERS_COLLECTION = "users";

export async function findUserByEmail(email) {
  const database = getDatabase();

  return database.collection(USERS_COLLECTION).findOne({ email });
}

export async function insertUser({ name, email, passwordHash }) {
  const database = getDatabase();
  const now = new Date();

  const user = {
    name,
    email,
    passwordHash,
    emailVerifiedAt: null,
    createdAt: now,
    updatedAt: now,
  };

  const result = await database.collection(USERS_COLLECTION).insertOne(user);

  return {
    ...user,
    _id: result.insertedId,
  };
}

export async function createUserIndexes() {
  const database = getDatabase();

  await database
    .collection(USERS_COLLECTION)
    .createIndex({ email: 1 }, { unique: true });
}

export async function markUserEmailVerified(userId) {
  const database = getDatabase();
  const now = new Date();

  return database.collection(USERS_COLLECTION).findOneAndUpdate(
    {
      _id: userId,
      emailVerifiedAt: null,
    },
    {
      $set: {
        emailVerifiedAt: now,
        updatedAt: now,
      },
    },
    {
      returnDocument: "after",
    },
  );
}