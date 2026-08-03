"use client";

import { useCallback, useSyncExternalStore } from "react";

/**
 * Whether a media query currently matches, kept live as the viewport changes.
 *
 * Same shape as `usePrefersReducedMotion`, and for the same reason: subscribing
 * to the query lets a component *derive* its output from it, rather than
 * writing state inside an effect and re-rendering a frame late.
 *
 * The server cannot know the viewport, so it reports `false`. Never let
 * anything visible hang on that — layout belongs in CSS, which is correct in
 * the first paint. This is for the handful of things CSS cannot express, such
 * as `inert` on a drawer that is off screen only at some widths.
 */
export function useMediaQuery(query) {
  const subscribe = useCallback(
    (onStoreChange) => {
      const list = window.matchMedia(query);
      list.addEventListener("change", onStoreChange);
      return () => list.removeEventListener("change", onStoreChange);
    },
    [query],
  );

  const getSnapshot = useCallback(() => window.matchMedia(query).matches, [query]);

  return useSyncExternalStore(subscribe, getSnapshot, () => false);
}
