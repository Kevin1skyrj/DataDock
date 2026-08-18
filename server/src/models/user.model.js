import { getDatabase } from "../config/db.js";
import { USER_ROLES } from "../config/roles.js";

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
    role: USER_ROLES.USER,
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
    role: USER_ROLES.USER,
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

export async function updateUserPassword({ userId, passwordHash }) {
  const database = getDatabase();

  return database.collection(USERS_COLLECTION).findOneAndUpdate(
    { _id: userId },
    {
      $set: {
        passwordHash,
        updatedAt: new Date(),
      },
    },
    { returnDocument: "after" },
  );
}

export async function updateUserProfile({ userId, name }) {
  return getDatabase().collection(USERS_COLLECTION).findOneAndUpdate(
    { _id: userId, deletedAt: { $exists: false } },
    { $set: { name, updatedAt: new Date() } },
    { returnDocument: "after" },
  );
}

export async function updateUserNotificationPreferences({ userId, preferences }) {
  return getDatabase().collection(USERS_COLLECTION).findOneAndUpdate(
    { _id: userId, deletedAt: { $exists: false } },
    { $set: { notificationPreferences: preferences, updatedAt: new Date() } },
    { returnDocument: "after" },
  );
}

export async function migrateUserRoles() {
  const database = getDatabase();

  await database.collection(USERS_COLLECTION).updateMany(
    { role: { $exists: false } },
    { $set: { role: USER_ROLES.USER } },
  );
}

export async function syncConfiguredOwner() {
  const ownerEmail = process.env.OWNER_EMAIL?.trim().toLowerCase();

  if (!ownerEmail) {
    throw new Error("OWNER_EMAIL is missing from environment variables");
  }

  const users = getDatabase().collection(USERS_COLLECTION);
  const owner = await users.findOne({ email: ownerEmail });

  if (!owner) {
    throw new Error(`OWNER_EMAIL does not match an existing user: ${ownerEmail}`);
  }

  await users.updateMany(
    { role: USER_ROLES.OWNER, _id: { $ne: owner._id } },
    { $set: { role: USER_ROLES.ADMIN, updatedAt: new Date() } },
  );

  await users.updateOne(
    { _id: owner._id },
    { $set: { role: USER_ROLES.OWNER, updatedAt: new Date() } },
  );
}

export async function listUsers({ query, skip, limit }) {
  const users = getDatabase().collection(USERS_COLLECTION);

  const [items, total] = await Promise.all([
    users
      .find(query)
      .sort({ createdAt: -1, _id: -1 })
      .skip(skip)
      .limit(limit)
      .project({
        name: 1,
        email: 1,
        role: 1,
        emailVerifiedAt: 1,
        deletedAt: 1,
        createdAt: 1,
      })
      .toArray(),
    users.countDocuments(query),
  ]);

  return { items, total };
}

export async function updateUserRole({ userId, role }) {
  return getDatabase().collection(USERS_COLLECTION).findOneAndUpdate(
    { _id: userId, deletedAt: { $exists: false } },
    { $set: { role, updatedAt: new Date() } },
    { returnDocument: "after" },
  );
}

export async function softDeleteUser({ userId, deletedBy }) {
  const now = new Date();

  return getDatabase().collection(USERS_COLLECTION).findOneAndUpdate(
    { _id: userId, deletedAt: { $exists: false } },
    {
      $set: {
        deletedAt: now,
        deletedBy,
        updatedAt: now,
      },
    },
    { returnDocument: "after" },
  );
}

export async function unblockUserById(userId) {
  return getDatabase().collection(USERS_COLLECTION).findOneAndUpdate(
    { _id: userId, deletedAt: { $exists: true } },
    {
      $unset: { deletedAt: "", deletedBy: "" },
      $set: { updatedAt: new Date() },
    },
    { returnDocument: "after" },
  );
}

export async function permanentlyDeleteUser(userId) {
  const database = getDatabase();

  await Promise.all([
    database.collection("sessions").deleteMany({ userId }),
    database.collection("otps").deleteMany({ userId }),
    database.collection("passwordResets").deleteMany({ userId }),
    database.collection("items").deleteMany({ ownerId: userId }),
  ]);

  return database.collection(USERS_COLLECTION).deleteOne({ _id: userId });
}
