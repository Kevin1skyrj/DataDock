import { randomBytes, randomUUID } from "node:crypto";
import { Transform } from "node:stream";

import { DeleteObjectCommand } from "@aws-sdk/client-s3";
import { Upload } from "@aws-sdk/lib-storage";
import { google } from "googleapis";
import { ObjectId } from "mongodb";

import {
  GOOGLE_DRIVE_SCOPE,
  googleDriveOAuthClient,
} from "../config/google-drive.js";
import { s3BucketName, s3Client } from "../config/s3.js";
import {
  MAX_FILE_SIZE_BYTES,
  USER_STORAGE_QUOTA_BYTES,
} from "../config/storage.js";
import { AppError } from "../errors/app-error.js";
import {
  deleteGoogleDriveConnection,
  findGoogleDriveConnection,
  saveGoogleDriveConnection,
} from "../models/google-drive.model.js";
import {
  findFolderById,
  findItemByName,
  getUserStorageUsage,
  insertFile,
  insertFolder,
} from "../models/item.model.js";
import { getFileKind } from "../utils/file-kind.js";
import { decryptSecret, encryptSecret } from "../utils/secret-box.js";
import { invalidateItemLists } from "./item-cache.service.js";
import { getJSON, setJSON } from "./redis.service.js";

const FOLDER_MIME = "application/vnd.google-apps.folder";
const EXPORTS = {
  "application/vnd.google-apps.document": {
    mimeType: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    extension: ".docx",
  },
  "application/vnd.google-apps.spreadsheet": {
    mimeType: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    extension: ".xlsx",
  },
  "application/vnd.google-apps.presentation": {
    mimeType: "application/vnd.openxmlformats-officedocument.presentationml.presentation",
    extension: ".pptx",
  },
  "application/vnd.google-apps.drawing": { mimeType: "image/png", extension: ".png" },
};

const jobKey = (jobId) => `datadock:drive-import:${jobId}`;

function driveClient(refreshToken) {
  const auth = new google.auth.OAuth2({
    clientId: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    redirectUri: process.env.GOOGLE_DRIVE_CALLBACK_URL,
  });
  auth.setCredentials({ refresh_token: refreshToken });
  return google.drive({ version: "v3", auth });
}

async function connectionFor(userId) {
  const connection = await findGoogleDriveConnection(userId);
  if (!connection) {
    throw new AppError("Google Drive is not connected", {
      statusCode: 409,
      code: "google-drive-not-connected",
    });
  }
  return { connection, refreshToken: decryptSecret(connection.refreshToken) };
}

export async function createDriveAuthorizationRequest() {
  const state = randomBytes(32).toString("hex");
  const { codeVerifier, codeChallenge } = await googleDriveOAuthClient.generateCodeVerifierAsync();
  const authorizationUrl = googleDriveOAuthClient.generateAuthUrl({
    scope: [GOOGLE_DRIVE_SCOPE],
    state,
    code_challenge: codeChallenge,
    code_challenge_method: "S256",
    access_type: "offline",
    prompt: "consent select_account",
  });
  return { authorizationUrl, state, codeVerifier };
}

export async function connectGoogleDrive({ userId, code, codeVerifier }) {
  const { tokens } = await googleDriveOAuthClient.getToken({ code, codeVerifier });
  if (!tokens.refresh_token) {
    throw new AppError("Google did not return long-term Drive access", {
      statusCode: 400,
      code: "google-drive-refresh-token-missing",
    });
  }

  const drive = driveClient(tokens.refresh_token);
  const { data } = await drive.about.get({ fields: "user(displayName,emailAddress)" });
  await saveGoogleDriveConnection({
    userId,
    email: data.user?.emailAddress,
    name: data.user?.displayName,
    refreshToken: encryptSecret(tokens.refresh_token),
  });
}

export async function getGoogleDriveAccount(userId) {
  const connection = await findGoogleDriveConnection(userId);
  return connection ? { email: connection.email, name: connection.name } : null;
}

export async function disconnectGoogleDrive(userId) {
  const connection = await findGoogleDriveConnection(userId);
  if (connection) {
    try {
      await googleDriveOAuthClient.revokeToken(decryptSecret(connection.refreshToken));
    } catch {
      // Local disconnection must still succeed if Google already revoked access.
    }
  }
  await deleteGoogleDriveConnection(userId);
}

function publicDriveItem(file, itemCount = null) {
  const folder = file.mimeType === FOLDER_MIME;
  const exported = EXPORTS[file.mimeType];
  return {
    id: file.id,
    type: folder ? "folder" : "file",
    name: exported && !file.name.endsWith(exported.extension)
      ? `${file.name}${exported.extension}`
      : file.name,
    kind: folder ? "folder" : getFileKind(exported?.mimeType ?? file.mimeType),
    mimeType: exported?.mimeType ?? file.mimeType,
    size: Number(file.size ?? 0),
    itemCount,
  };
}

export async function listGoogleDriveItems({ userId, folderId = "root" }) {
  const { refreshToken } = await connectionFor(userId);
  const drive = driveClient(refreshToken);
  const { data } = await drive.files.list({
    q: `'${folderId.replaceAll("'", "\\'")}' in parents and trashed = false`,
    fields: "files(id,name,mimeType,size)",
    orderBy: "folder,name_natural",
    pageSize: 100,
  });

  return Promise.all(
    (data.files ?? []).map(async (file) => {
      if (file.mimeType !== FOLDER_MIME) return publicDriveItem(file);
      const children = await drive.files.list({
        q: `'${file.id}' in parents and trashed = false`,
        fields: "files(id)",
        pageSize: 1000,
      });
      return publicDriveItem(file, children.data.files?.length ?? 0);
    }),
  );
}

async function resolveDestination(ownerId, parentId) {
  if (parentId == null) return null;
  if (!ObjectId.isValid(parentId)) {
    throw new AppError("Invalid destination folder", { statusCode: 400, code: "invalid-parent-id" });
  }
  const folderId = new ObjectId(parentId);
  if (!(await findFolderById({ ownerId, folderId }))) {
    throw new AppError("Destination folder not found", { statusCode: 404, code: "folder-not-found" });
  }
  return folderId;
}

async function metadata(drive, fileId) {
  const { data } = await drive.files.get({
    fileId,
    fields: "id,name,mimeType,size",
  });
  return data;
}

async function listChildren(drive, folderId) {
  const result = [];
  let pageToken;
  do {
    const { data } = await drive.files.list({
      q: `'${folderId}' in parents and trashed = false`,
      fields: "nextPageToken,files(id,name,mimeType,size)",
      pageSize: 1000,
      pageToken,
    });
    result.push(...(data.files ?? []));
    pageToken = data.nextPageToken;
  } while (pageToken);
  return result;
}

async function buildPlan(drive, rootIds) {
  const plan = [];
  const seen = new Set();
  async function visit(file, parentSourceId = null) {
    if (seen.has(file.id)) return;
    seen.add(file.id);
    plan.push({ file, parentSourceId });
    if (file.mimeType === FOLDER_MIME) {
      for (const child of await listChildren(drive, file.id)) await visit(child, file.id);
    }
  }
  for (const id of rootIds) await visit(await metadata(drive, id));
  return plan;
}

function importedName(file) {
  const format = EXPORTS[file.mimeType];
  return format && !file.name.endsWith(format.extension) ? `${file.name}${format.extension}` : file.name;
}

async function importFile({ drive, ownerId, file, parentId, remainingBytes }) {
  const format = EXPORTS[file.mimeType];
  if (file.mimeType.startsWith("application/vnd.google-apps.") && !format) {
    throw new AppError(`Google file type for ${file.name} is not supported`, {
      statusCode: 400,
      code: "unsupported-google-file",
    });
  }
  const expectedSize = Number(file.size ?? 0);
  if (expectedSize > MAX_FILE_SIZE_BYTES || expectedSize > remainingBytes) {
    throw new AppError(`${file.name} exceeds the available storage limit`, {
      statusCode: 409,
      code: "storage-quota-exceeded",
    });
  }

  const name = importedName(file);
  const mimeType = format?.mimeType ?? file.mimeType ?? "application/octet-stream";
  const response = format
    ? await drive.files.export({ fileId: file.id, mimeType }, { responseType: "stream" })
    : await drive.files.get({ fileId: file.id, alt: "media" }, { responseType: "stream" });
  let bytes = 0;
  const meter = new Transform({
    transform(chunk, encoding, callback) {
      bytes += chunk.length;
      if (bytes > MAX_FILE_SIZE_BYTES || bytes > remainingBytes) {
        callback(new Error("Imported file exceeds the storage limit"));
      } else callback(null, chunk);
    },
  });
  const storageKey = `users/${ownerId}/objects/${randomUUID()}`;

  try {
    await new Upload({
      client: s3Client,
      params: {
        Bucket: s3BucketName,
        Key: storageKey,
        Body: response.data.pipe(meter),
        ContentType: mimeType,
      },
      leavePartsOnError: false,
    }).done();
    const item = await insertFile({
      ownerId,
      name,
      parentId,
      kind: getFileKind(mimeType),
      mimeType,
      size: bytes,
      storageKey,
    });
    return item.size;
  } catch (error) {
    await s3Client.send(new DeleteObjectCommand({ Bucket: s3BucketName, Key: storageKey }));
    throw error;
  }
}

async function runImportJob({ jobId, ownerId, fileIds, parentId }) {
  const owner = ownerId.toHexString();
  const update = (value) => setJSON(jobKey(jobId), { ...value, ownerId: owner }, 24 * 60 * 60);
  try {
    const { refreshToken } = await connectionFor(ownerId);
    const drive = driveClient(refreshToken);
    const destination = await resolveDestination(ownerId, parentId);
    const plan = await buildPlan(drive, fileIds);
    const destinationBySource = new Map();
    let used = await getUserStorageUsage(ownerId);
    let completed = 0;

    await update({ status: "running", progress: 0, imported: 0, total: plan.length });

    for (const { file, parentSourceId } of plan) {
      const itemParentId = parentSourceId ? destinationBySource.get(parentSourceId) : destination;
      const name = importedName(file);
      if (await findItemByName({ ownerId, parentId: itemParentId, normalizedName: name.toLowerCase() })) {
        throw new AppError(`${name} already exists in the destination`, {
          statusCode: 409,
          code: "name-conflict",
        });
      }

      if (file.mimeType === FOLDER_MIME) {
        const folder = await insertFolder({ ownerId, name, parentId: itemParentId });
        destinationBySource.set(file.id, folder._id);
      } else {
        used += await importFile({
          drive,
          ownerId,
          file,
          parentId: itemParentId,
          remainingBytes: USER_STORAGE_QUOTA_BYTES - used,
        });
      }
      completed += 1;
      await update({
        status: "running",
        progress: completed / plan.length,
        imported: completed,
        total: plan.length,
      });
    }

    await invalidateItemLists(ownerId);
    await update({ status: "complete", progress: 1, imported: completed, total: plan.length });
  } catch (error) {
    console.error("Google Drive import failed:", error.message);
    await update({
      status: "failed",
      progress: 0,
      error: error.message ?? "Google Drive import failed",
    });
  }
}

export async function startGoogleDriveImport({ ownerId, fileIds, parentId }) {
  if (!Array.isArray(fileIds) || fileIds.length === 0 || !fileIds.every((id) => typeof id === "string" && id)) {
    throw new AppError("At least one Google Drive item is required", {
      statusCode: 400,
      code: "invalid-google-drive-items",
    });
  }
  await connectionFor(ownerId);
  await resolveDestination(ownerId, parentId);
  const jobId = randomUUID();
  await setJSON(
    jobKey(jobId),
    { status: "queued", progress: 0, ownerId: ownerId.toHexString() },
    24 * 60 * 60,
  );
  setImmediate(() => {
    runImportJob({ jobId, ownerId, fileIds: [...new Set(fileIds)], parentId });
  });
  return { jobId };
}

export async function getGoogleDriveImportJob({ ownerId, jobId }) {
  const job = await getJSON(jobKey(jobId));
  if (!job || job.ownerId !== ownerId.toHexString()) {
    throw new AppError("Import job not found", { statusCode: 404, code: "import-not-found" });
  }
  const { ownerId: ignored, ...publicJob } = job;
  return publicJob;
}
