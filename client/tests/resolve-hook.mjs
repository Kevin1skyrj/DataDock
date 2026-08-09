import { existsSync } from "node:fs";
import path from "node:path";
import { pathToFileURL } from "node:url";

/**
 * Teaches Node the `@/` alias that jsconfig gives the bundler.
 *
 * The tests import the real modules, unmodified — no shim, no re-export, no
 * second copy of the logic under test. That is the whole point: a test that
 * imports a rewritten version of a function is a test of the rewrite.
 *
 * Node's ESM resolver also wants extensions, which the source omits, so the
 * usual candidates are tried in the order a bundler would.
 */
const SRC = path.resolve(import.meta.dirname, "..", "src");

const CANDIDATES = ["", ".js", ".jsx", "/index.js", "/index.jsx"];

export async function resolve(specifier, context, next) {
  if (!specifier.startsWith("@/")) return next(specifier, context);

  const base = path.join(SRC, specifier.slice(2));

  for (const suffix of CANDIDATES) {
    const candidate = base + suffix;
    if (existsSync(candidate) && !candidate.endsWith("/")) {
      return next(pathToFileURL(candidate).href, context);
    }
  }

  return next(specifier, context);
}
