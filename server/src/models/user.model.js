import { getDatabase } from "../config/db.js";

const USERS_COLLECTION = "users";

export async function findUserByEmail(email) {
  const database = getDatabase();

  return database.collection(USERS_COLLECTION).findOne({ email });
}

export async function findUserByGoogleId(googleId) {
  const database = getDatabase();

  return database.collection(USERS_COLLECTION).findOne({ googleId });
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

export async function insertGoogleUser({
  googleId,
  name,
  email,
  avatarUrl,
}) {
  const database = getDatabase();
  const now = new Date();

  const user = {
    googleId,
    name,
    email,
    avatarUrl,
    passwordHash: null,
    emailVerifiedAt: now,
    createdAt: now,
    updatedAt: now,
  };

  const result = await database.collection(USERS_COLLECTION).insertOne(user);

  return {
    ...user,
    _id: result.insertedId,
  };
}

export async function connectGoogleAccount({
  userId,
  googleId,
  avatarUrl,
}) {
  const database = getDatabase();
  const now = new Date();

  return database.collection(USERS_COLLECTION).findOneAndUpdate(
    {
      _id: userId,
      $or: [
        { googleId: { $exists: false } },
        { googleId: null },
        { googleId },
      ],
    },
    {
      $set: {
        googleId,
        avatarUrl,
        emailVerifiedAt: now,
        updatedAt: now,
      },
    },
    {
      returnDocument: "after",
    },
  );
}

export async function createUserIndexes() {
  const database = getDatabase();

  await database
    .collection(USERS_COLLECTION)
    .createIndex({ email: 1 }, { unique: true });

  await database.collection(USERS_COLLECTION).createIndex(
    { googleId: 1 },
    {
      unique: true,
      partialFilterExpression: {
        googleId: { $type: "string" },
      },
    },
  );
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

export async function findUserById(userId) {
  const database = getDatabase();

  return database.collection(USERS_COLLECTION).findOne({
    _id: userId,
  });
}
