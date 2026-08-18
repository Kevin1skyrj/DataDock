import { apiRequest } from "./api-client";

export const DATE_RANGES = {
  any: null,
  today: 1,
  week: 7,
  month: 30,
  year: 365,
};

export const SIZE_RANGES = {
  any: [null, null],
  small: [null, 1_000_000],
  medium: [1_000_000, 100_000_000],
  large: [100_000_000, null],
};

function queryString(input) {
  const query = new URLSearchParams();
  if (input.query) query.set("q", input.query);
  if (input.kinds?.length) query.set("kinds", input.kinds.join(","));
  if (input.date && input.date !== "any") query.set("date", input.date);
  if (input.size && input.size !== "any") query.set("size", input.size);
  if (input.sharedOnly) query.set("shared", "1");
  if (input.includeTrashed) query.set("trashed", "1");
  if (input.cursor) query.set("cursor", input.cursor);
  if (input.limit) query.set("limit", input.limit);
  if (input.sort?.field) query.set("sort", input.sort.field);
  if (input.sort?.direction) query.set("direction", input.sort.direction);
  return query.toString();
}

export function searchDrive(input = {}) {
  return apiRequest(`/search?${queryString(input)}`);
}

export function quickSearch(query, limit = 5) {
  return apiRequest(`/search/quick?${queryString({ query, limit })}`);
}
