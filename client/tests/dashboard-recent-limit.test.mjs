import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import path from "node:path";
import test from "node:test";

test("dashboard recent-file limit reaches the API query", async () => {
  const service = await readFile(
    path.resolve(import.meta.dirname, "../src/services/api/files.js"),
    "utf8",
  );

  assert.match(service, /if \(limit\) query\.set\("limit", String\(limit\)\)/);
});
