import { AppError } from "../errors/app-error.js";
import {
  findUserById,
  updateUserNotificationPreferences,
  updateUserProfile,
} from "../models/user.model.js";

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
