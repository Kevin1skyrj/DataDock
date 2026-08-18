import { apiRequest } from "@/services/api/api-client";

export async function listItems({
  parentId = null,
  filter = {},
} = {}) {
  if (filter.starred) {
    return apiRequest("/items/starred");
  }

  if (filter.trashed) {
    return apiRequest("/trash");
  }

  const query = new URLSearchParams();

  if (parentId) {
    query.set("parentId", parentId);
  }

  const queryString = query.toString();

  return apiRequest(`/items${queryString ? `?${queryString}` : ""}`);
}

export async function getItem(itemId) {
  return apiRequest(`/items/${encodeURIComponent(itemId)}`);
}

export async function getPath(folderId) {
  if (!folderId) {
    return [];
  }

  return apiRequest(`/items/folders/${encodeURIComponent(folderId)}/path`);
}

export function getDownloadUrl(itemId) {
  return apiRequest(`/items/${encodeURIComponent(itemId)}/download`);
}

export function getPreview(item) {
  return apiRequest(`/items/${encodeURIComponent(item.id)}/preview`);
}

export function getStorageSummary() {
  return apiRequest("/storage/summary");
}

export function getStorageBreakdown() {
  return apiRequest("/storage/breakdown");
}

export function getLargestFiles(limit = 8) {
  return apiRequest(`/storage/largest?limit=${encodeURIComponent(limit)}`);
}

export function getStorageActivity(limit = 12) {
  return apiRequest(`/storage/activity?limit=${encodeURIComponent(limit)}`);
}

export function getCleanupSuggestions() {
  return apiRequest("/storage/cleanup");
}

export async function getFolderSummary(parentId = null) {
  const query = new URLSearchParams();

  if (parentId) {
    query.set("parentId", parentId);
  }

  const queryString = query.toString();

  return apiRequest(`/items/summary${queryString ? `?${queryString}` : ""}`);
}

export async function listFolders(parentId = null) {
  const query = new URLSearchParams();

  if (parentId) {
    query.set("parentId", parentId);
  }

  const queryString = query.toString();

  return apiRequest(`/items/folders${queryString ? `?${queryString}` : ""}`);
}

export async function createFolder({
  parentId = null,
  name,
}) {
  return apiRequest("/items/folders", {
    method: "POST",
    body: {
      parentId,
      name,
    },
  });
}

export async function renameItem(itemId, name) {
  return apiRequest(
    `/items/${encodeURIComponent(itemId)}`,
    {
      method: "PATCH",
      body: {
        name,
      },
    },
  );
}

export async function moveItems(itemIds, parentId) {
  return apiRequest("/items/move", {
    method: "PATCH",
    body: {
      itemIds,
      parentId,
    },
  });
}

export async function starItems(itemIds, starred) {
  return apiRequest("/items/starred", {
    method: "PATCH",
    body: {
      itemIds,
      starred,
    },
  });
}

export async function trashItems(itemIds) {
  return apiRequest("/trash", {
    method: "PATCH",
    body: {
      itemIds,
    },
  });
}

export async function restoreItems(itemIds) {
  return apiRequest("/trash/restore", {
    method: "PATCH",
    body: {
      itemIds,
    },
  });
}

export function deleteItems(itemIds) {
  return apiRequest("/trash", {
    method: "DELETE",
    body: { itemIds },
  });
}

export async function ensureFolder({ parentId = null, name }) {
  const folders = await listFolders(parentId);
  const existing = folders.find(
    (folder) => folder.name.toLowerCase() === name.trim().toLowerCase(),
  );

  return existing ?? createFolder({ parentId, name });
}

export function createShare(itemId) {
  return apiRequest(`/items/${encodeURIComponent(itemId)}/share`, { method: "POST" });
}

export function updateShare(itemId, changes) {
  return apiRequest(`/items/${encodeURIComponent(itemId)}/share`, {
    method: "PATCH",
    body: changes,
  });
}

export function revokeShare(itemId) {
  return apiRequest(`/items/${encodeURIComponent(itemId)}/share`, { method: "DELETE" });
}
