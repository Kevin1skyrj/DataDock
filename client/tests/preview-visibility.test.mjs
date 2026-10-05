import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import path from "node:path";
import test from "node:test";

test("preview entrance styles stay inside the landing mockup", async () => {
  const css = await readFile(
    path.resolve(import.meta.dirname, "../src/app/globals.css"),
    "utf8",
  );

  assert.match(css, /\[data-motion="ready"\] \[data-preview="frame"\] \[data-preview\] \{/);
  assert.doesNotMatch(css, /\[data-motion="ready"\] \[data-preview\] \{/);
});
