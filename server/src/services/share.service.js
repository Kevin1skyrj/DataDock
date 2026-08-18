import { randomBytes } from "node:crypto";
import { ObjectId } from "mongodb";

import { AppError } from "../errors/app-error.js";
import {
  findItemById,
  findItemsByParent,
  findPublicShareByToken,
  incrementPublicShareViews,
  updateItemShare,
} from "../models/item.model.js";
import { invalidateItemLists } from "./item-cache.service.js";
import { addFolderStats, createFileDownload, createFilePreview } from "./item.service.js";

const ACCESS = new Set(["view", "comment", "edit"]);

function itemId(value) {
  if (!ObjectId.isValid(value)) {
    throw new AppError("Invalid item ID", { statusCode: 400, code: "invalid-item-id" });
  }
  return new ObjectId(value);
}

function expiry(value) {
  if (value == null) return null;
  const date = new Date(value);
  const latest = Date.now() + 365 * 24 * 60 * 60 * 1000;
  if (Number.isNaN(date.getTime()) || date <= new Date() || date.getTime() > latest) {
    throw new AppError("Expiry must be within the next 365 days", {
      statusCode: 400,
      code: "invalid-share-expiry",
    });
  }
  return date;
}

export async function createPublicShare({ ownerId, itemId: value }) {
  const id = itemId(value);
  const item = await findItemById({ ownerId, itemId: id });
  if (!item || item.trashedAt) throw notFound();
  if (item.share) return item.share;

  const share = {
    token: randomBytes(24).toString("base64url"),
    scope: "link",
    access: "view",
    expiresAt: null,
    viewCount: 0,
    createdAt: new Date(),
  };
  await updateItemShare({ ownerId, itemId: id, share });
  await invalidateItemLists(ownerId);
  return share;
}

export async function changePublicShare({ ownerId, itemId: value, changes }) {
  const id = itemId(value);
  const item = await findItemById({ ownerId, itemId: id });
  if (!item?.share || item.trashedAt) throw notFound();

  const share = { ...item.share };
  if (changes.access !== undefined) {
    if (!ACCESS.has(changes.access)) {
      throw new AppError("Invalid share permission", { statusCode: 400, code: "invalid-share-access" });
    }
    share.access = changes.access;
  }
  if (changes.scope !== undefined) {
    if (!["link", "private"].includes(changes.scope)) {
      throw new AppError("Invalid share scope", { statusCode: 400, code: "invalid-share-scope" });
    }
    share.scope = changes.scope;
  }
  if (changes.expiresAt !== undefined) share.expiresAt = expiry(changes.expiresAt);

  await updateItemShare({ ownerId, itemId: id, share });
  await invalidateItemLists(ownerId);
  return share;
}

export async function stopPublicShare({ ownerId, itemId: value }) {
  const id = itemId(value);
  const item = await updateItemShare({ ownerId, itemId: id, share: null });
  if (!item) throw notFound();
  await invalidateItemLists(ownerId);
  return { revoked: true };
}

export async function getPublicShare(token) {
  const item = await resolvePublicShare(token);
  await incrementPublicShareViews(item._id);
  await invalidateItemLists(item.ownerId);
  return {
    id: item._id.toHexString(),
    name: item.name,
    type: item.type,
    size: item.size ?? null,
    access: item.share.access,
    expiresAt: item.share.expiresAt,
  };
}

export async function getPublicSharePreview(token) {
  const item = await resolvePublicFile(token);
  return createFilePreview(item);
}

export async function getPublicShareDownload(token) {
  const item = await resolvePublicFile(token);
  return createFileDownload(item);
}

export async function listPublicShareItems({ token, parentId }) {
  const root = await resolvePublicFolder(token);
  const folder = parentId ? await resolveSharedItem(root, parentId, "folder") : root;
  const items = await findItemsByParent({ ownerId: root.ownerId, parentId: folder._id });
  const itemsWithStats = await addFolderStats(root.ownerId, items);

  return {
    folder: { id: folder._id.toHexString(), name: folder.name },
    items: itemsWithStats.map(publicChild),
  };
}

export async function getPublicChildPreview({ token, itemId: value }) {
  const root = await resolvePublicFolder(token);
  return createFilePreview(await resolveSharedItem(root, value, "file"));
}

export async function getPublicChildDownload({ token, itemId: value }) {
  const root = await resolvePublicFolder(token);
  return createFileDownload(await resolveSharedItem(root, value, "file"));
}

async function resolvePublicShare(token) {
  if (typeof token !== "string" || !/^[A-Za-z0-9_-]{32}$/.test(token)) throw notFound();
  const item = await findPublicShareByToken(token);
  if (!item) throw notFound();
  return item;
}

async function resolvePublicFile(token) {
  const item = await resolvePublicShare(token);
  if (item.type !== "file" || !item.storageKey) {
    throw new AppError("This shared item is not a downloadable file", {
      statusCode: 400,
      code: "shared-item-not-file",
    });
  }
  return item;
}

async function resolvePublicFolder(token) {
  const item = await resolvePublicShare(token);
  if (item.type !== "folder") {
    throw new AppError("This shared item is not a folder", {
      statusCode: 400,
      code: "shared-item-not-folder",
    });
  }
  return item;
}

async function resolveSharedItem(root, value, expectedType) {
  if (!ObjectId.isValid(value)) throw notFound();
  const item = await findItemById({ ownerId: root.ownerId, itemId: new ObjectId(value) });
  if (!item || item.trashedAt || item.type !== expectedType) throw notFound();

  let parentId = item.parentId;
  for (let depth = 0; parentId && depth < 100; depth += 1) {
    if (parentId.equals(root._id)) return item;
    const parent = await findItemById({ ownerId: root.ownerId, itemId: parentId });
    if (!parent || parent.trashedAt) break;
    parentId = parent.parentId;
  }
  throw notFound();
}

function publicChild(item) {
  return {
    id: item._id.toHexString(),
    type: item.type,
    name: item.name,
    kind: item.type === "folder" ? "folder" : item.kind,
    size: item.size ?? null,
    itemCount: item.itemCount ?? null,
    updatedAt: item.updatedAt,
  };
}

function notFound() {
  return new AppError("Share link not found or expired", { statusCode: 404, code: "share-not-found" });
}
