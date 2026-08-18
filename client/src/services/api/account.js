import { apiRequest } from "./api-client";

export function updateProfile(name) {
  return apiRequest("/auth/me", { method: "PATCH", body: { name } });
}

export function getNotificationPreferences() {
  return apiRequest("/auth/preferences");
}

export function updateNotificationPreferences(changes) {
  return apiRequest("/auth/preferences", { method: "PATCH", body: changes });
}
