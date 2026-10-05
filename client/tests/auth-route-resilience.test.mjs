import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const sessionSource = await readFile(
  new URL("../src/services/session.js", import.meta.url),
  "utf8",
);
const apiClientSource = await readFile(
  new URL("../src/services/api/api-client.js", import.meta.url),
  "utf8",
);
const nextConfigSource = await readFile(
  new URL("../next.config.mjs", import.meta.url),
  "utf8",
);

test("public auth routes survive a failed existing-session probe", () => {
  assert.match(
    sessionSource,
    /export async function getExistingSession\(\)[\s\S]*?catch \{\s*\/\/[\s\S]*?return null;/,
  );
});

test("dashboard authentication does not depend on billing availability", () => {
  assert.match(
    sessionSource,
    /const account = await apiRequest\("\/auth\/me"/,
  );
  assert.match(
    sessionSource,
    /catch \{\s*return \{ \.\.\.account, plan: account\.plan \?\? "Free" \};\s*\}/,
  );
  assert.doesNotMatch(sessionSource, /Promise\.all\(\[/);
});

test("API transport and invalid response failures become handled ApiErrors", () => {
  assert.match(apiClientSource, /code: "api-unavailable"/);
  assert.match(apiClientSource, /code: "invalid-api-response"/);
});

test("development and production builds cannot overwrite each other's chunks", () => {
  assert.match(
    nextConfigSource,
    /distDir: process\.env\.NODE_ENV === "development" \? "\.next-dev" : "\.next"/,
  );
});
