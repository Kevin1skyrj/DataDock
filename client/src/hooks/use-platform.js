"use client";

import { useSyncExternalStore } from "react";

const subscribe = () => () => {};

const getSnapshot = () =>
  /mac|iphone|ipad|ipod/i.test(navigator.userAgentData?.platform ?? navigator.platform ?? "");

// Apple until proven otherwise, so the server and the first client render agree.
// Getting it wrong for one frame changes a glyph; getting it wrong permanently
// tells a Windows user to press a key their keyboard does not have.
const getServerSnapshot = () => true;

/**
 * A keyboard shortcut, written the way this keyboard would write it.
 *
 * The product advertises its shortcuts everywhere — the command trigger, the
 * sidebar toggle, the palette — and a hint naming the wrong key is worse than
 * no hint, because it is confidently wrong. The spacing differs too: `⌘K` is a
 * single glyph pair, `Ctrl K` needs the gap to stay readable.
 */
export function useShortcut(key) {
  const apple = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
  return apple ? `⌘${key}` : `Ctrl ${key}`;
}
