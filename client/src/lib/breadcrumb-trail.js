import { useSyncExternalStore } from "react";

/**
 * The folder trail, published by whatever is showing folders.
 *
 * The shell's breadcrumb is derived from the route, and it has to be — it works
 * on every page, before any of them have loaded anything. But a folder is not a
 * route segment here, and even if it were, the segment would be `fld_9k2m4x`
 * and the breadcrumb would render that. Only the workspace knows the folder is
 * called "Brand refresh", and only after it has asked.
 *
 * So the workspace publishes what it knows and the shell appends it. One
 * breadcrumb, in the one place a breadcrumb belongs, without the shell having to
 * import anything from the workspace or the workspace having to render a second
 * trail of its own beneath the first.
 *
 * A store rather than a context because the two live on opposite sides of the
 * layout boundary: the shell renders the top bar, the page renders the
 * workspace, and neither is an ancestor of the other.
 */
let trail = [];
const listeners = new Set();

function subscribe(onStoreChange) {
  listeners.add(onStoreChange);
  return () => {
    listeners.delete(onStoreChange);
  };
}

const getSnapshot = () => trail;
const getServerSnapshot = () => EMPTY;

/** Stable identity, so the server snapshot never looks like a change. */
const EMPTY = [];

export function useBreadcrumbTrail() {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}

/**
 * @param {{id: string, name: string, href: string}[]} next
 *
 * Compared before publishing. The workspace re-renders often and this would
 * otherwise re-render the entire top bar on every keystroke in the filter box.
 */
export function publishTrail(next) {
  const same =
    trail.length === next.length &&
    trail.every((rung, index) => rung.id === next[index].id && rung.name === next[index].name);

  if (same) return;

  trail = next;
  for (const listener of listeners) listener();
}
