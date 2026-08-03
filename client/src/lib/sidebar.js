import { useSyncExternalStore } from "react";

import { SIDEBAR_STORAGE_KEY } from "@/constants/dashboard";

/**
 * Whether the sidebar is collapsed to a rail.
 *
 * The state lives on `<html>` as an attribute rather than in React, and that is
 * the whole point. A preference read in an effect paints the wrong width first
 * and snaps to the right one a frame later — the same flash the theme has, and
 * far more obvious at 190px of travel. The boot script stamps the attribute
 * during HTML parsing, so the first paint is already correct and CSS alone
 * carries the layout.
 *
 * React reads it back through `useSyncExternalStore` so the toggle can label
 * itself correctly. The server has no idea what the visitor chose, so it
 * reports expanded; the client corrects that on hydration. Nothing visible
 * depends on it — the width and the labels are CSS — so that correction costs
 * one frame of a button's `aria-expanded`, not a layout jump.
 */
const COLLAPSED = "collapsed";
const listeners = new Set();

function subscribe(onStoreChange) {
  listeners.add(onStoreChange);
  return () => {
    listeners.delete(onStoreChange);
  };
}

const getSnapshot = () => document.documentElement.dataset.sidebar === COLLAPSED;
const getServerSnapshot = () => false;

export function useSidebarCollapsed() {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}

export function toggleSidebar() {
  const root = document.documentElement;
  const next = root.dataset.sidebar !== COLLAPSED;

  if (next) root.dataset.sidebar = COLLAPSED;
  else delete root.dataset.sidebar;

  // Private browsing throws on write. A preference that fails to persist is a
  // minor annoyance; one that throws is a broken button.
  try {
    localStorage.setItem(SIDEBAR_STORAGE_KEY, next ? "1" : "0");
  } catch {
    /* not persisted */
  }

  for (const listener of listeners) listener();
}
