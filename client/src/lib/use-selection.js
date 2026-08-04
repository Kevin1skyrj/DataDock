"use client";

import { useCallback, useMemo, useRef, useState } from "react";

/**
 * Which items are chosen.
 *
 * Headless on purpose. It holds a set of ids and an anchor, and it knows the
 * ordered list only well enough to resolve a range — it has never heard of a
 * row, a card, a checkbox or a table. That is what lets the same model drive the
 * table and the grid without either of them owning it, and what lets it be
 * reasoned about without rendering anything.
 *
 * Stale ids are filtered on read rather than pruned on change. Deleting a
 * selected file, changing the sort, navigating into a folder — each of those
 * leaves ids in the set that no longer exist, and reconciling that in an effect
 * means a second render and a rule about ordering. Deriving `items` by
 * intersecting with what is actually on screen makes the stale entries simply
 * stop counting, with no effect and no cascade.
 */
export function useSelection(items) {
  const [ids, setIds] = useState(() => new Set());

  // The last item clicked without shift. Shift-click extends from here, which
  // is what makes a range feel like a drag rather than a pair of clicks.
  const anchorRef = useRef(null);

  const selected = useMemo(() => items.filter((item) => ids.has(item.id)), [items, ids]);
  const isSelected = useCallback((id) => ids.has(id), [ids]);

  const count = selected.length;
  const all = items.length > 0 && count === items.length;
  const some = count > 0 && !all;

  const selectOnly = useCallback((item) => {
    anchorRef.current = item.id;
    setIds(new Set([item.id]));
  }, []);

  const toggle = useCallback((item) => {
    anchorRef.current = item.id;
    setIds((current) => {
      const next = new Set(current);
      if (next.has(item.id)) next.delete(item.id);
      else next.add(item.id);
      return next;
    });
  }, []);

  /**
   * Everything between the anchor and here.
   *
   * The range replaces the selection rather than adding to it, which is what
   * every file manager does: shift-clicking a third row after a range gives you
   * a range ending at that row, not two overlapping ones. With no anchor yet —
   * shift-clicking as the very first action — it degrades to selecting one.
   */
  const extendTo = useCallback(
    (item) => {
      const anchor = anchorRef.current;
      if (!anchor) {
        anchorRef.current = item.id;
        setIds(new Set([item.id]));
        return;
      }

      const from = items.findIndex((candidate) => candidate.id === anchor);
      const to = items.findIndex((candidate) => candidate.id === item.id);
      if (from === -1 || to === -1) return;

      const [start, end] = from < to ? [from, to] : [to, from];
      setIds(new Set(items.slice(start, end + 1).map((candidate) => candidate.id)));
    },
    [items],
  );

  const selectAll = useCallback(() => {
    setIds(new Set(items.map((item) => item.id)));
  }, [items]);

  const clear = useCallback(() => {
    anchorRef.current = null;
    setIds(new Set());
  }, []);

  /**
   * The one entry point a click should use.
   *
   * Modifier handling belongs here rather than in every row, card and keyboard
   * handler that can start a selection — three copies of this is three chances
   * for shift-click to mean something slightly different depending on where you
   * did it.
   */
  const handleClick = useCallback(
    (item, event) => {
      if (event?.shiftKey) extendTo(item);
      else if (event?.metaKey || event?.ctrlKey) toggle(item);
      else selectOnly(item);
    },
    [extendTo, toggle, selectOnly],
  );

  // Memoised so the workspace context does not change identity on every render
  // of an unrelated piece of state — eight consumers read this object, and a new
  // one each time would re-render all of them for nothing.
  return useMemo(
    () => ({
      ids, selected, count, all, some, isSelected,
      selectOnly, toggle, extendTo, selectAll, clear, handleClick,
    }),
    [
      ids, selected, count, all, some, isSelected,
      selectOnly, toggle, extendTo, selectAll, clear, handleClick,
    ],
  );
}
