import { AppError } from "../errors/app-error.js";
import bcrypt from "bcrypt";
import { DeleteObjectsCommand } from "@aws-sdk/client-s3";
import { s3BucketName, s3Client } from "../config/s3.js";
import {
  findUserById,
  permanentlyDeleteUser,
  updateUserNotificationPreferences,
  updateUserProfile,
} from "../models/user.model.js";
import { getUserStorageKeys } from "../models/item.model.js";
import { cancelSubscriptionsForAccountDeletion } from "./billing.service.js";
import { disconnectGoogleDrive } from "./google-drive.service.js";
import { deleteAllUserSessions } from "./session.service.js";

const NOTIFICATION_KEYS = new Set([
  "uploads",
  "sharing",
  "comments",
  "security",
  "storage",
  "product",
]);

export async function changeProfile({ userId, input }) {
  const name = typeof input?.name === "string" ? input.name.trim() : "";
  if (name.length < 2 || name.length > 80) {
    throw new AppError("Name must be between 2 and 80 characters", {
      statusCode: 400,
      code: "invalid-name",
    });
  }

  const user = await updateUserProfile({ userId, name });
  return publicAccount(user);
}

export async function getNotificationPreferences(userId) {
  const user = await findUserById(userId);
  return user?.notificationPreferences ?? {};
}

export async function changeNotificationPreferences({ userId, input }) {
  const preferences = {};
  for (const [key, value] of Object.entries(input ?? {})) {
    if (!NOTIFICATION_KEYS.has(key) || typeof value !== "boolean") {
      throw new AppError("Invalid notification preference", {
        statusCode: 400,
        code: "invalid-notification-preference",
      });
    }
    preferences[key] = value;
  }

  const user = await findUserById(userId);
  const updated = await updateUserNotificationPreferences({
    userId,
    preferences: { ...(user?.notificationPreferences ?? {}), ...preferences },
  });
  return updated.notificationPreferences;
}

export async function permanentlyDeleteAccount({ userId, password, requirePassword = true }) {
  const user = await findUserById(userId);
  if (!user) {
    throw new AppError("Account not found", { statusCode: 404, code: "account-not-found" });
  }
  if (user.role === "owner" && requirePassword) {
    throw new AppError("The configured owner account cannot delete itself", {
      statusCode: 409,
      code: "owner-delete-forbidden",
    });
  }
  if (requirePassword && user.passwordHash) {
    if (!password || !(await bcrypt.compare(password, user.passwordHash))) {
      throw new AppError("Your current password is incorrect", {
        statusCode: 401,
        code: "current-password-incorrect",
      });
    }
  }

  await cancelSubscriptionsForAccountDeletion(userId);
  await disconnectGoogleDrive(userId);

  const storageKeys = await getUserStorageKeys(userId);
  for (let index = 0; index < storageKeys.length; index += 1000) {
    const result = await s3Client.send(new DeleteObjectsCommand({
      Bucket: s3BucketName,
      Delete: {
        Objects: storageKeys.slice(index, index + 1000).map((Key) => ({ Key })),
        Quiet: true,
      },
    }));
    if (result.Errors?.length) {
      throw new AppError("Some stored files could not be deleted", {
        statusCode: 502,
        code: "storage-delete-failed",
      });
    }
  }

  await deleteAllUserSessions(userId);
  await permanentlyDeleteUser(userId);
  return { deleted: true };
}

export function publicAccount(user) {
  return {
    id: user._id.toString(),
    name: user.name,
    email: user.email,
    role: user.role,
    hasPassword: Boolean(user.passwordHash),
    avatarUrl: user.avatarUrl ?? null,
    googleConnected: Boolean(user.googleId),
    createdAt: user.createdAt,
  };
}
