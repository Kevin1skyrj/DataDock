import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import path from "node:path";
import test from "node:test";

test("dashboard requests settle into an actionable error state", async () => {
  const [dashboard, panels] = await Promise.all([
    readFile(
      path.resolve(import.meta.dirname, "../src/app/dashboard/dashboard-home.jsx"),
      "utf8",
    ),
    readFile(
      path.resolve(import.meta.dirname, "../src/components/storage/storage-panels.jsx"),
      "utf8",
    ),
  ]);

  assert.match(dashboard, /\.catch\(\(\) => \{/);
  assert.match(dashboard, /<PanelError message=\{recent\.error\} onRetry=\{recent\.retry\}/);
  assert.match(dashboard, /<PanelError message=\{summary\.error\} onRetry=\{summary\.retry\}/);
  assert.match(dashboard, /<PanelError message=\{activity\.error\} onRetry=\{activity\.retry\}/);
  assert.match(panels, /role="alert"/);
  assert.match(panels, />\s*Try again\s*</);
});
