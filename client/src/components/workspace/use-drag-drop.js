"use client";

import { useCallback, useRef, useState } from "react";

/** Our own type, so a drag from another tab or the desktop is never mistaken
 *  for one of ours. Upload drag-and-drop is a later milestone and must not be
 *  swallowed by this one. */
export const DRAG_TYPE = "application/x-datadock-items";

/** How long a folder must be hovered before the drag opens it. */
const SPRING_MS = 800;

/**
 * Moving things by dragging them.
 *
 * Native HTML5 drag-and-drop rather than pointer events, and the reason is
 * scope: the platform already provides the drag image, the cursor states, the
 * escape-to-cancel and — most importantly — the distinction between a drag that
 * started inside the page and one that came from the operating system. The
 * upload milestone will need exactly that distinction, and rebuilding it on
 * pointer events would mean owning it forever.
 *
 * Three rules the drop targets enforce, in order of how badly each one bites:
 *
 * 1. A folder cannot be dropped into itself or into anything inside it. The
 *    service refuses too, but by then the item has already appeared to move.
 * 2. Nothing can be dropped into the folder it already lives in — a no-op that
 *    still costs a request and a re-render.
 * 3. Only folders and breadcrumb rungs are targets. Dropping onto a file means
 *    nothing, so a file must not light up as though it did.
 *
 * Spring-loading is the one piece of genuine Finder behaviour here: rest on a
 * folder for a moment mid-drag and it opens, so a file can be carried several
 * levels down in one gesture. The timer is cancelled by leaving, by dropping and
 * by the drag ending, because a folder that opens after you have let go is a
 * navigation nobody asked for.
 */
export function useDragDrop({ onMove, onSpringOpen, isForbidden }) {
  const [dragging, setDragging] = useState(null);
  const [dropTarget, setDropTarget] = useState(null);
  const springRef = useRef(null);

  const cancelSpring = useCallback(() => {
    if (springRef.current) {
      window.clearTimeout(springRef.current);
      springRef.current = null;
    }
  }, []);

  const end = useCallback(() => {
    cancelSpring();
    setDragging(null);
    setDropTarget(null);
  }, [cancelSpring]);

  /**
   * @param {object[]} items what is being dragged — the selection if the item
   *   is part of one, otherwise just the item
   */
  const startDrag = useCallback((event, items) => {
    const ids = items.map((item) => item.id);

    event.dataTransfer.effectAllowed = "move";
    event.dataTransfer.setData(DRAG_TYPE, JSON.stringify(ids));
    // Some browsers refuse a drag with no `text/plain`; it is also what makes
    // the payload legible if it ever escapes into another surface.
    event.dataTransfer.setData("text/plain", items.map((item) => item.name).join(", "));

    setDragging({ ids, items });
  }, []);

  const canDrop = useCallback(
    (targetId) => {
      if (!dragging) return false;
      if (dragging.ids.includes(targetId)) return false;
      if (isForbidden?.(targetId, dragging.ids)) return false;
      return true;
    },
    [dragging, isForbidden],
  );

  /**
   * @param {string|null} targetId the folder under the pointer, `null` for the
   *   root — which is what a breadcrumb's first rung means
   * @param {boolean} spring whether resting here should open it
   */
  const dropProps = useCallback(
    (targetId, { spring = false } = {}) => ({
      onDragOver: (event) => {
        if (!canDrop(targetId)) return;
        event.preventDefault();
        event.dataTransfer.dropEffect = "move";

        if (dropTarget === targetId) return;
        setDropTarget(targetId);

        cancelSpring();
        if (spring && targetId) {
          springRef.current = window.setTimeout(() => {
            springRef.current = null;
            onSpringOpen?.(targetId);
          }, SPRING_MS);
        }
      },

      onDragLeave: (event) => {
        // Moving between a row's own children fires leave; only a departure
        // that actually exits the element counts.
        if (event.currentTarget.contains(event.relatedTarget)) return;
        cancelSpring();
        setDropTarget((current) => (current === targetId ? null : current));
      },

      onDrop: (event) => {
        if (!canDrop(targetId)) return;
        event.preventDefault();
        event.stopPropagation();
        cancelSpring();

        const raw = event.dataTransfer.getData(DRAG_TYPE);
        setDropTarget(null);
        setDragging(null);
        if (!raw) return;

        try {
          const ids = JSON.parse(raw);
          if (Array.isArray(ids) && ids.length) onMove?.(ids, targetId);
        } catch {
          /* not ours */
        }
      },
    }),
    [canDrop, dropTarget, cancelSpring, onSpringOpen, onMove],
  );

  return {
    dragging,
    dropTarget,
    isDragging: Boolean(dragging),
    startDrag,
    endDrag: end,
    canDrop,
    dropProps,
  };
}
