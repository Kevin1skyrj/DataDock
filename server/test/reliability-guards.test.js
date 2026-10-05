import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import path from "node:path";
import test from "node:test";

const source = (file) => readFile(path.resolve(import.meta.dirname, "../src", file), "utf8");

test("health checks every required dependency", async () => {
  const health = await source("services/health.service.js");
  assert.match(health, /pingDatabase/);
  assert.match(health, /getRedisClient\(\)\.ping/);
  assert.match(health, /checkS3Connection/);
});

test("billing and upload finalization use per-user distributed locks", async () => {
  const [billing, upload] = await Promise.all([
    source("services/billing.service.js"),
    source("services/upload.service.js"),
  ]);
  assert.match(billing, /datadock:billing-create:/);
  assert.match(upload, /datadock:storage-lock:/);
});

test("account deletion coordinates provider and object cleanup", async () => {
  const account = await source("services/account.service.js");
  assert.match(account, /cancelSubscriptionsForAccountDeletion/);
  assert.match(account, /disconnectGoogleDrive/);
  assert.match(account, /DeleteObjectsCommand/);
  assert.match(account, /permanentlyDeleteUser/);
});

test("active names are enforced by a database unique index", async () => {
  const items = await source("models/item.model.js");
  assert.match(items, /unique_active_name_per_folder/);
  assert.match(items, /partialFilterExpression: \{ trashedAt: null \}/);
});

test("abandoned uploads use a cleanup-safe pending prefix", async () => {
  const upload = await source("services/upload.service.js");
  assert.match(upload, /\/pending\//);
  assert.match(upload, /cleanupAbandonedUploads/);
  assert.match(upload, /ListObjectsV2Command/);
});

test("folder trash records a root across its descendant tree", async () => {
  const trash = await source("models/trash.model.js");
  assert.match(trash, /trashRootId: rootId/);
  assert.match(trash, /trashRootId: \{ \$in: itemIds \}/);
});

test("imports are persisted rather than launched with setImmediate", async () => {
  const imports = await source("services/google-drive.service.js");
  assert.match(imports, /insertImportJob/);
  assert.match(imports, /claimNextImportJob/);
  assert.doesNotMatch(imports, /setImmediate/);
});
