import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const headerSource = await readFile(
  new URL("../src/components/landing/site-header.jsx", import.meta.url),
  "utf8",
);

test("header pricing actions work from every marketing route", () => {
  const pricingDestinations = headerSource.match(/linkFor\("\/#pricing"\)/g) ?? [];

  assert.equal(pricingDestinations.length, 2);
  assert.doesNotMatch(headerSource, /render=\{<a href="#pricing" \/>\}/);
});
