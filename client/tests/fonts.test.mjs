import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { it } from "node:test";

const fontModule = new URL("../src/lib/fonts.js", import.meta.url);

it("keeps the app fonts local so builds do not require Google Fonts access", async () => {
  const source = await readFile(fontModule, "utf8");

  assert.match(source, /from ["']next\/font\/local["']/);
  assert.doesNotMatch(source, /next\/font\/google/);

  for (const name of ["instrument-sans-latin", "jetbrains-mono-latin"]) {
    assert.ok(source.includes(`../assets/fonts/${name}.woff2`));

    const font = await readFile(new URL(`../src/assets/fonts/${name}.woff2`, import.meta.url));
    assert.equal(font.toString("ascii", 0, 4), "wOF2");
  }
});
