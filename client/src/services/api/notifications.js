import { apiRequest } from "./api-client";

export function getNotifications(limit = 10) {
  return apiRequest(`/notifications?limit=${encodeURIComponent(limit)}`);
}

export function markNotificationsRead() {
  return apiRequest("/notifications/read", { method: "PATCH" });
}
