import assert from "node:assert/strict";
import test from "node:test";

import { itemListQuerySchema } from "../src/validators/item.validator.js";

test("item listing accepts a bounded server-side limit", () => {
  const parsed = itemListQuerySchema.parse({ view: "recent", limit: "6" });
  assert.equal(parsed.limit, 6);

  assert.equal(itemListQuerySchema.safeParse({ limit: "0" }).success, false);
  assert.equal(itemListQuerySchema.safeParse({ limit: "101" }).success, false);
});

test("item listing accepts only numeric pagination cursors", () => {
  assert.equal(itemListQuerySchema.parse({ cursor: "100" }).cursor, "100");
  assert.equal(itemListQuerySchema.safeParse({ cursor: "next-page" }).success, false);
});
