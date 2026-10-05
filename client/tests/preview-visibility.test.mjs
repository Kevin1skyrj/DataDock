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

test("image Quick Look fits the complete image inside one fixed viewport", async () => {
  const [dialog, renderers] = await Promise.all([
    readFile(
      path.resolve(import.meta.dirname, "../src/components/preview/preview-dialog.jsx"),
      "utf8",
    ),
    readFile(
      path.resolve(import.meta.dirname, "../src/components/preview/preview-renderers.jsx"),
      "utf8",
    ),
  ]);

  assert.match(dialog, /viewportClassName="overflow-hidden"/);
  assert.match(dialog, /relative min-h-0 min-w-0 flex-1 overflow-hidden/);
  assert.match(
    renderers,
    /flex h-full min-h-0 w-full min-w-0 items-center justify-center overflow-hidden/,
  );
  assert.match(
    renderers,
    /h-full min-h-0 w-full min-w-0 rounded-lg object-contain/,
  );
  assert.doesNotMatch(renderers, /place-items-center overflow-auto/);
});
