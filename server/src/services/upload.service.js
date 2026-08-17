import { randomUUID } from "node:crypto";

import {
  DeleteObjectCommand,
  HeadObjectCommand,
  PutObjectCommand,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { ObjectId } from "mongodb";

import { s3BucketName, s3Client } from "../config/s3.js";
import {
  MAX_FILE_SIZE_BYTES,
  UPLOAD_INTENT_TTL_SECONDS,
  UPLOAD_URL_TTL_SECONDS,
  USER_STORAGE_QUOTA_BYTES,
} from "../config/storage.js";
import { AppError } from "../errors/app-error.js";
import {
  findFolderById,
  findItemByName,
  getUserStorageUsage,
  insertFile,
} from "../models/item.model.js";
import { getFileKind } from "../utils/file-kind.js";
import { invalidateItemLists } from "./item-cache.service.js";
import { deleteKey, getJSON, setJSON } from "./redis.service.js";
import { toPublicItem } from "../mappers/item.mapper.js";

function uploadIntentKey(uploadId) {
  return `datadock:upload:${uploadId}`;
}

function validateName(value) {
  if (typeof value !== "string" || !value.trim()) {
    throw new AppError("File name is required", {
      statusCode: 400,
      code: "invalid-file-name",
    });
  }

  const name = value.trim();
  if (name.length > 255) {
    throw new AppError("File name cannot exceed 255 characters", {
      statusCode: 400,
      code: "invalid-file-name",
    });
  }
  return name;
}

function validateSize(value) {
  if (!Number.isSafeInteger(value) || value <= 0) {
    throw new AppError("File size must be a positive integer", {
      statusCode: 400,
      code: "invalid-file-size",
    });
  }
  if (value > MAX_FILE_SIZE_BYTES) {
    throw new AppError("File size cannot exceed 2 GB", {
      statusCode: 413,
      code: "file-too-large",
    });
  }
  return value;
}

function normalizeMimeType(value) {
  return typeof value === "string" && value.trim()
    ? value.trim().toLowerCase().slice(0, 255)
    : "application/octet-stream";
}

async function resolveParent({ ownerId, parentId }) {
  if (parentId == null) return null;
  if (typeof parentId !== "string" || !ObjectId.isValid(parentId)) {
    throw new AppError("Invalid parent folder ID", {
      statusCode: 400,
      code: "invalid-parent-id",
    });
  }

  const folderId = new ObjectId(parentId);
  const folder = await findFolderById({ ownerId, folderId });
  if (!folder) {
    throw new AppError("Parent folder not found", {
      statusCode: 404,
      code: "parent-folder-not-found",
    });
  }
  return folderId;
}

async function assertQuota(ownerId, incomingSize) {
  const used = await getUserStorageUsage(ownerId);
  if (used + incomingSize > USER_STORAGE_QUOTA_BYTES) {
    throw new AppError("This upload would exceed your 5 GB storage limit", {
      statusCode: 409,
      code: "storage-quota-exceeded",
    });
  }
}

async function deleteObject(storageKey) {
  await s3Client.send(
    new DeleteObjectCommand({ Bucket: s3BucketName, Key: storageKey }),
  );
}

export async function createUpload({ ownerId, input }) {
  const name = validateName(input.name);
  const size = validateSize(input.size);
  const mimeType = normalizeMimeType(input.mimeType);
  const parentId = await resolveParent({ ownerId, parentId: input.parentId });

  const existing = await findItemByName({
    ownerId,
    parentId,
    normalizedName: name.toLowerCase(),
  });
  if (existing) {
    throw new AppError("An item with this name already exists in this folder", {
      statusCode: 409,
      code: "name-conflict",
    });
  }

  await assertQuota(ownerId, size);

  const uploadId = randomUUID();
  const storageKey = `users/${ownerId}/objects/${randomUUID()}`;
  const intent = {
    ownerId: ownerId.toHexString(),
    name,
    parentId: parentId?.toHexString() ?? null,
    kind: getFileKind(mimeType),
    mimeType,
    size,
    storageKey,
  };

  await setJSON(uploadIntentKey(uploadId), intent, UPLOAD_INTENT_TTL_SECONDS);

  const uploadUrl = await getSignedUrl(
    s3Client,
    new PutObjectCommand({
      Bucket: s3BucketName,
      Key: storageKey,
      ContentType: mimeType,
    }),
    { expiresIn: UPLOAD_URL_TTL_SECONDS },
  );

  return {
    uploadId,
    uploadUrl,
    headers: { "Content-Type": mimeType },
    expiresAt: new Date(Date.now() + UPLOAD_URL_TTL_SECONDS * 1000),
  };
}

export async function completeUpload({ ownerId, uploadId }) {
  if (typeof uploadId !== "string" || !uploadId) {
    throw new AppError("Upload ID is required", {
      statusCode: 400,
      code: "invalid-upload-id",
    });
  }

  const key = uploadIntentKey(uploadId);
  const intent = await getJSON(key);
  if (!intent || intent.ownerId !== ownerId.toHexString()) {
    throw new AppError("Upload was not found or has expired", {
      statusCode: 404,
      code: "upload-not-found",
    });
  }

  let object;
  try {
    object = await s3Client.send(
      new HeadObjectCommand({ Bucket: s3BucketName, Key: intent.storageKey }),
    );
  } catch (error) {
    if (error.$metadata?.httpStatusCode === 404) {
      throw new AppError("The file has not finished uploading", {
        statusCode: 409,
        code: "upload-incomplete",
      });
    }
    throw error;
  }

  if (object.ContentLength !== intent.size) {
    await deleteObject(intent.storageKey);
    await deleteKey(key);
    throw new AppError("Uploaded file size does not match the requested size", {
      statusCode: 409,
      code: "upload-size-mismatch",
    });
  }

  const parentId = intent.parentId ? new ObjectId(intent.parentId) : null;
  const existing = await findItemByName({
    ownerId,
    parentId,
    normalizedName: intent.name.toLowerCase(),
  });

  try {
    if (existing) {
      throw new AppError("An item with this name already exists in this folder", {
        statusCode: 409,
        code: "name-conflict",
      });
    }

    await assertQuota(ownerId, intent.size);

    const file = await insertFile({
      ownerId,
      name: intent.name,
      parentId,
      kind: intent.kind,
      mimeType: intent.mimeType,
      size: intent.size,
      storageKey: intent.storageKey,
    });

    await deleteKey(key);
    await invalidateItemLists(ownerId);
    return toPublicItem(file);
  } catch (error) {
    await deleteObject(intent.storageKey);
    await deleteKey(key);
    throw error;
  }
}
