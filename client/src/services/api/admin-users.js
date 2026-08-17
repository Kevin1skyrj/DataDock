import { apiRequest } from "./api-client";

export function listAdminUsers({ page = 1, search = "", status = "active" } = {}) {
  const query = new URLSearchParams({ page: String(page), status });

  if (search.trim()) {
    query.set("search", search.trim());
  }

  return apiRequest(`/admin/users?${query}`);
}

export function changeAdminUserRole(userId, role) {
  return apiRequest(`/admin/users/${userId}/role`, {
    method: "PATCH",
    body: { role },
  });
}

export function logoutAdminUser(userId) {
  return apiRequest(`/admin/users/${userId}/sessions`, {
    method: "DELETE",
  });
}

export function deleteAdminUser(userId) {
  return apiRequest(`/admin/users/${userId}`, {
    method: "DELETE",
  });
}

export function unblockAdminUser(userId) {
  return apiRequest(`/admin/users/${userId}/unblock`, { method: "POST" });
}

export function permanentlyDeleteAdminUser(userId) {
  return apiRequest(`/admin/users/${userId}/permanent`, { method: "DELETE" });
}
