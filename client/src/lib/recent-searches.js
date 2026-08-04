import { useSyncExternalStore } from "react";

/**
 * What has been searched for lately.
 *
 * Local, and deliberately so. A search history is the single most revealing
 * thing a file product holds — it is a list of what someone was looking for and
 * could not find — and there is no feature here that needs it on a server.
 * When there is one, this module is the only thing that changes.
 *
 * Newest first, de-duplicated case-insensitively, capped. A history that grows
 * without limit becomes a list nobody scrolls.
 */
const KEY = "datadock:recent-searches";
const LIMIT = 8;

let cache = null;
const listeners = new Set();

function read() {
  if (cache) return cache;
  try {
    const parsed = JSON.parse(localStorage.getItem(KEY) ?? "[]");
    cache = Array.isArray(parsed) ? parsed.slice(0, LIMIT) : [];
  } catch {
    cache = [];
  }
  return cache;
}

function write(next) {
  cache = next;
  try {
    localStorage.setItem(KEY, JSON.stringify(next));
  } catch {
    /* private mode — kept for the session, not beyond it */
  }
  for (const listener of listeners) listener();
}

function subscribe(onStoreChange) {
  listeners.add(onStoreChange);
  return () => {
    listeners.delete(onStoreChange);
  };
}

const EMPTY = [];

export function useRecentSearches() {
  return useSyncExternalStore(subscribe, read, () => EMPTY);
}

export function rememberSearch(query) {
  const trimmed = query.trim();
  if (trimmed.length < 2) return;

  const existing = read().filter((entry) => entry.toLowerCase() !== trimmed.toLowerCase());
  write([trimmed, ...existing].slice(0, LIMIT));
}

export function forgetSearch(query) {
  write(read().filter((entry) => entry !== query));
}

export function clearSearches() {
  write([]);
}
