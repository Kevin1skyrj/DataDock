import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import path from "node:path";
import test from "node:test";

test("workspace exposes pagination without replacing loaded items", async () => {
  const [service, workspace] = await Promise.all([
    readFile(path.resolve(import.meta.dirname, "../src/services/api/files.js"), "utf8"),
    readFile(path.resolve(import.meta.dirname, "../src/components/workspace/workspace-context.jsx"), "utf8"),
  ]);
  assert.match(service, /query\.set\("cursor", cursor\)/);
  assert.match(workspace, /items: \[\.\.\.current\.items, \.\.\.page\.items\]/);
  assert.match(workspace, /hasMore: Boolean\(data\.nextCursor\)/);
});
