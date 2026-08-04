import { useSyncExternalStore } from "react";

import { DETAILS_STORAGE_KEY, VIEW_MODE_STORAGE_KEY } from "@/constants/workspace";

/**
 * The two things about the workspace that outlive a visit.
 *
 * Both are the sidebar's pattern, for the sidebar's reason: a preference read in
 * an effect paints the wrong layout first. The details panel is stamped onto
 * `<html>` by the boot script so its column is the right width in the first
 * frame — that one is 320px of visible correction if it is not.
 *
 * The view mode is not in the boot script, and the difference is worth stating.
 * Which component renders is React's decision, and no attribute can make React
 * render a grid before it has hydrated. What that would cost is a table
 * skeleton flicking to a grid skeleton, inside the time it takes the listing to
 * arrive — invisible, and not worth an inline script to avoid.
 */

const listeners = new Set();

function subscribe(onStoreChange) {
  listeners.add(onStoreChange);
  return () => {
    listeners.delete(onStoreChange);
  };
}

function announce() {
  for (const listener of listeners) listener();
}

const read = (key, fallback) => {
  try {
    return localStorage.getItem(key) ?? fallback;
  } catch {
    return fallback;
  }
};

const write = (key, value) => {
  try {
    localStorage.setItem(key, value);
  } catch {
    /* private mode — not persisted, still applied for this session */
  }
};

/* ------------------------------------------------------ details panel -- */

const detailsSnapshot = () => document.documentElement.dataset.details === "open";
const detailsServerSnapshot = () => false;

export function useDetailsOpen() {
  return useSyncExternalStore(subscribe, detailsSnapshot, detailsServerSnapshot);
}

export function setDetailsOpen(open) {
  const root = document.documentElement;
  if (open) root.dataset.details = "open";
  else delete root.dataset.details;

  write(DETAILS_STORAGE_KEY, open ? "1" : "0");
  announce();
}

/* ---------------------------------------------------------- view mode -- */

const viewSnapshot = () => (read(VIEW_MODE_STORAGE_KEY, "table") === "grid" ? "grid" : "table");
const viewServerSnapshot = () => "table";

export function useViewMode() {
  return useSyncExternalStore(subscribe, viewSnapshot, viewServerSnapshot);
}

export function setViewMode(mode) {
  write(VIEW_MODE_STORAGE_KEY, mode);
  announce();
}
