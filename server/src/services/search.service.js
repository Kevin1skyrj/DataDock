import { AppError } from "../errors/app-error.js";
import { toPublicItem } from "../mappers/item.mapper.js";
import { searchUserItems } from "../models/search.model.js";
import { addFolderStats } from "./item.service.js";

const DATE_DAYS = { any: null, today: 1, week: 7, month: 30, year: 365 };
const SIZE_RANGES = {
  any: [null, null],
  small: [null, 1_000_000],
  medium: [1_000_000, 100_000_000],
  large: [100_000_000, null],
};

function escapedPattern(value) {
  const query = typeof value === "string" ? value.trim().toLowerCase() : "";
  if (query.length > 200) {
    throw new AppError("Search query is too long", {
      statusCode: 400,
      code: "invalid-search-query",
    });
  }
  return query.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

export async function searchDrive({ ownerId, input, quick = false }) {
  const namePattern = escapedPattern(input.query);
  if (quick && !namePattern) return [];

  const dateDays = DATE_DAYS[input.date] ?? null;
  const [minSize, maxSize] = SIZE_RANGES[input.size] ?? SIZE_RANGES.any;
  const limit = Math.min(quick ? 10 : 100, Math.max(1, Number(input.limit) || (quick ? 5 : 100)));
  const skip = quick ? 0 : Math.max(0, Number.parseInt(input.cursor, 10) || 0);
  const allowedSorts = new Set(["name", "kind", "size", "updatedAt", "createdAt"]);
  const sortField = allowedSorts.has(input.sortField) ? input.sortField : null;
  const sortDirection = input.sortDirection === "desc" ? -1 : 1;
  const result = await searchUserItems({
    ownerId,
    namePattern,
    filters: {
      kinds: Array.isArray(input.kinds) ? input.kinds.filter(Boolean).slice(0, 20) : [],
      sharedOnly: input.sharedOnly === true,
      includeTrashed: input.includeTrashed === true,
      updatedAfter: dateDays ? new Date(Date.now() - dateDays * 24 * 60 * 60 * 1000) : null,
      minSize,
      maxSize,
    },
    skip,
    limit,
    sortField,
    sortDirection,
  });
  const enriched = await addFolderStats(ownerId, result.items);
  const items = enriched.map(toPublicItem);
  if (quick) return items;

  return {
    items,
    total: result.total,
    nextCursor: skip + limit < result.total ? String(skip + limit) : null,
    facets: { kinds: result.kinds },
  };
}
