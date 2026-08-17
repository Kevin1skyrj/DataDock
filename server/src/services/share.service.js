import { randomBytes } from "node:crypto";
import { ObjectId } from "mongodb";

import { AppError } from "../errors/app-error.js";
import {
  findItemById,
  findPublicShareByToken,
  updateItemShare,
} from "../models/item.model.js";

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
  return share;
}

export async function stopPublicShare({ ownerId, itemId: value }) {
  const id = itemId(value);
  const item = await updateItemShare({ ownerId, itemId: id, share: null });
  if (!item) throw notFound();
  return { revoked: true };
}

export async function getPublicShare(token) {
  if (typeof token !== "string" || !/^[A-Za-z0-9_-]{32}$/.test(token)) throw notFound();
  const item = await findPublicShareByToken(token);
  if (!item) throw notFound();
  return {
    name: item.name,
    type: item.type,
    size: item.size ?? null,
    access: item.share.access,
    expiresAt: item.share.expiresAt,
  };
}

function notFound() {
  return new AppError("Share link not found or expired", { statusCode: 404, code: "share-not-found" });
}
