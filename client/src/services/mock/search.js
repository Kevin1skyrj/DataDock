import { __driveSnapshot } from "@/services/mock/files";

/**
 * Finding things.
 *
 * A separate module from `listItems` because search and listing are different
 * queries against different indexes, and pretending otherwise is what makes
 * search slow later. A listing is `parentId` plus a sort — one compound index.
 * Search is a text match across the whole drive with facets on top, which in
 * Mongo is an Atlas Search index and in a bigger deployment is a search cluster
 * of its own. Same shape out, entirely different machinery behind it.
 *
 * Facet counts come back with the results, because they have to be computed
 * from the *matched* set. Counting them in the browser would mean downloading
 * every match in order to count it, which defeats the paging the results
 * already use.
 */

const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
const DAY = 86_400_000;

/** How the date filter's options map to a cutoff. */
export const DATE_RANGES = {
  any: null,
  today: 1,
  week: 7,
  month: 30,
  year: 365,
};

/** Size bands, in bytes. `null` means unbounded on that side. */
export const SIZE_RANGES = {
  any: [null, null],
  small: [null, 1_000_000],
  medium: [1_000_000, 100_000_000],
  large: [100_000_000, null],
};

/**
 * Scores a match so the best answer is first.
 *
 * A name that *starts* with the query is almost always what was meant; a name
 * that merely contains it is a maybe. Without this, searching "logo" puts
 * "company-logo-archive-2019.zip" above "logo.svg" because the drive happens to
 * list it first, and the feature feels broken even though it is correct.
 */
function score(item, needle) {
  const name = item.name.toLowerCase();
  if (name === needle) return 100;
  if (name.startsWith(needle)) return 80;

  const wordStart = new RegExp(`\\b${needle.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}`);
  if (wordStart.test(name)) return 60;
  if (name.includes(needle)) return 40;
  return 0;
}

/**
 * @param {object} options
 * @param {string} options.query
 * @param {string[]} [options.kinds]
 * @param {"any"|"today"|"week"|"month"|"year"} [options.date]
 * @param {"any"|"small"|"medium"|"large"} [options.size]
 * @param {"anyone"|"me"} [options.owner]
 * @param {boolean} [options.sharedOnly]
 * @param {boolean} [options.includeTrashed]
 * @returns {Promise<{items: object[], total: number, nextCursor: null, facets: object}>}
 */
export async function searchDrive({
  query = "",
  kinds = [],
  date = "any",
  size = "any",
  owner = "anyone",
  sharedOnly = false,
  includeTrashed = false,
  cursor = null,
  limit = 100,
} = {}) {
  await wait(280);

  const needle = query.trim().toLowerCase();
  const days = DATE_RANGES[date];
  const [minSize, maxSize] = SIZE_RANGES[size] ?? SIZE_RANGES.any;

  const scored = [];
  // Facets are counted over everything the *text* matched, before the other
  // filters narrow it — otherwise ticking "Images" would drop every other
  // facet to zero and there would be no way back.
  const kindFacet = new Map();

  for (const item of __driveSnapshot()) {
    if (!includeTrashed && item.trashedAt) continue;
    if (includeTrashed && !item.trashedAt) continue;

    const relevance = needle ? score(item, needle) : 1;
    if (relevance === 0) continue;

    kindFacet.set(item.kind, (kindFacet.get(item.kind) ?? 0) + 1);

    if (kinds.length && !kinds.includes(item.kind)) continue;
    if (sharedOnly && !item.share) continue;
    if (owner === "me" && item.ownerId !== "usr_mock") continue;
    if (days != null && Date.now() - new Date(item.updatedAt).getTime() > days * DAY) continue;
    // Folders have no size, so a size filter cannot mean anything for them.
    if ((minSize != null || maxSize != null) && item.type === "folder") continue;
    if (minSize != null && (item.size ?? 0) < minSize) continue;
    if (maxSize != null && (item.size ?? 0) > maxSize) continue;

    scored.push({ item, relevance });
  }

  const matched = scored
    .sort(
      (a, b) =>
        b.relevance - a.relevance ||
        // Ties break on recency, so the freshest of two equally good matches
        // wins rather than whichever the collection happened to yield first.
        b.item.updatedAt.localeCompare(a.item.updatedAt),
    )
    .map(({ item }) => ({ ...item }));

  const start = cursor ? Number.parseInt(cursor, 10) || 0 : 0;

  return {
    items: matched.slice(start, start + limit),
    nextCursor: start + limit < matched.length ? String(start + limit) : null,
    total: matched.length,
    facets: {
      kinds: [...kindFacet.entries()]
        .map(([kind, count]) => ({ kind, count }))
        .sort((a, b) => b.count - a.count),
    },
  };
}

/**
 * The short list the command palette shows while you type.
 *
 * Deliberately a different call from `searchDrive`: the palette wants a handful
 * of best guesses in under a frame, not a paginated result set with facets. In
 * a real deployment this is the one that gets a Redis cache in front of it.
 */
export async function quickSearch(query, limit = 5) {
  await wait(90);

  const needle = query.trim().toLowerCase();
  if (!needle) return [];

  return __driveSnapshot()
    .filter((item) => !item.trashedAt)
    .map((item) => ({ item, relevance: score(item, needle) }))
    .filter(({ relevance }) => relevance > 0)
    .sort((a, b) => b.relevance - a.relevance)
    .slice(0, limit)
    .map(({ item }) => ({ ...item }));
}
