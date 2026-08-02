"use client";

import { useSyncExternalStore } from "react";

const subscribe = () => () => {};
const getSnapshot = () => true;
const getServerSnapshot = () => false;

/**
 * True only after hydration. Use it to gate anything whose value differs
 * between server and client — resolved theme, locale-formatted dates, media
 * queries — so the first client render still matches the server HTML.
 *
 * Implemented with useSyncExternalStore rather than useState + useEffect:
 * React uses the server snapshot during hydration, so there is no mismatch
 * and no cascading render on mount.
 */
export function useMounted() {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}
