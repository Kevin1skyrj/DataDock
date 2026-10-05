import { insertNotification, listNotifications, markNotificationsRead } from "../models/notification.model.js";
import { logError } from "../utils/log-error.js";
import { findUserById } from "../models/user.model.js";

const PREFERENCE_BY_TYPE = {
  uploaded: "uploads",
  imported: "uploads",
  viewed: "sharing",
  security: "security",
  storage: "storage",
};

export async function recordNotification(input) {
  try {
    const preference = PREFERENCE_BY_TYPE[input.type];
    if (preference) {
      const user = await findUserById(input.userId);
      if (user?.notificationPreferences?.[preference] === false) return;
    }
    await insertNotification(input);
  } catch (error) {
    logError("Notification could not be recorded", error);
  }
}

export async function getNotifications({ userId, cursor, limit }) {
  const skip = Math.max(0, Number.parseInt(cursor, 10) || 0);
  const pageSize = Math.min(50, Math.max(1, Number(limit) || 10));
  const result = await listNotifications({ userId, skip, limit: pageSize });
  return {
    items: result.items.map((item) => ({
      id: item._id.toHexString(),
      type: item.type,
      at: item.createdAt,
      read: Boolean(item.readAt),
      item: { id: item.itemId?.toHexString?.() ?? null, name: item.itemName },
    })),
    total: result.total,
    unread: result.unread,
    nextCursor: skip + pageSize < result.total ? String(skip + pageSize) : null,
  };
}

export async function readAllNotifications(userId) {
  await markNotificationsRead(userId);
  return { read: true };
}
