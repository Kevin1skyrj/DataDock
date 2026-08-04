import { useSyncExternalStore } from "react";

/**
 * The commands run most recently.
 *
 * Raycast's most useful habit: the thing you did last time is almost always the
 * thing you want now, so an empty palette should not be an empty list. Ids
 * only — a command's label and icon come from the registry, so remembering the
 * whole descriptor would mean a stale copy of every command that has been
 * renamed since.
 */
const KEY = "datadock:recent-commands";
const LIMIT = 5;

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

function subscribe(onStoreChange) {
  listeners.add(onStoreChange);
  return () => {
    listeners.delete(onStoreChange);
  };
}

const EMPTY = [];

export function useRecentCommands() {
  return useSyncExternalStore(subscribe, read, () => EMPTY);
}

export function rememberCommand(id) {
  const next = [id, ...read().filter((entry) => entry !== id)].slice(0, LIMIT);
  cache = next;
  try {
    localStorage.setItem(KEY, JSON.stringify(next));
  } catch {
    /* not persisted */
  }
  for (const listener of listeners) listener();
}
