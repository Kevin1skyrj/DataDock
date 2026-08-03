import { useLayoutEffect, useSyncExternalStore } from "react";

/**
 * Lets a screen tell the window its contents changed without the route changing.
 *
 * Almost every move through authentication is a navigation, and the window
 * picks those up from the pathname. The success states are the exception: a
 * form becomes a confirmation in place, at the same URL, and the window has no
 * way to notice — React re-renders the child, not the shell above it.
 *
 * Left unhandled that costs twice. The success panel drops in at a different
 * height with no transition, and the height the window remembered is now the
 * form's rather than the confirmation's, so the *next* move jumps too.
 *
 * A counter rather than an event, so the signal arrives as a value the window
 * can list among its dependencies. `useSyncExternalStore` puts the re-render on
 * React's own path instead of an effect chasing a listener, which is what keeps
 * the whole thing happening before paint.
 */
let version = 0;
const listeners = new Set();

function subscribe(onStoreChange) {
  listeners.add(onStoreChange);
  return () => {
    listeners.delete(onStoreChange);
  };
}

const getSnapshot = () => version;
const getServerSnapshot = () => 0;

/** Read by the window. Changes whenever a screen announces itself. */
export function useAuthScreen() {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}

/**
 * Called by a screen that replaced another one in place.
 *
 * A layout effect, not an ordinary one: the window has to measure and start
 * animating in the same frame the swap happened, and `useEffect` would run
 * after the browser had already painted the jump we are trying to avoid.
 */
export function useAnnounceScreen() {
  useLayoutEffect(() => {
    version += 1;
    for (const listener of listeners) listener();
  }, []);
}
