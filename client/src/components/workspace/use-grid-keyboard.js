"use client";

import { useCallback } from "react";

/**
 * The keyboard, for both layouts.
 *
 * The table and the grid differ in exactly one respect — what "the next item
 * down" means. In a list it is the next index; in a grid it is the item below,
 * which depends on how many columns happen to fit. Everything else (extending a
 * range with shift, opening with Enter, previewing with Space, select-all,
 * escape, delete) is identical, so it is written once and each layout supplies
 * only its own `resolve`.
 *
 * The grid resolves geometrically rather than by counting columns, because the
 * count changes with the viewport and any number stored in JavaScript is a
 * number that can be wrong. Asking the DOM where things actually are cannot be.
 */
export function useGridKeyboard({ items, activeId, setActiveId, selection, handlers, resolve, shortcuts }) {
  return useCallback(
    (event) => {
      const index = items.findIndex((item) => item.id === activeId);
      const current = index === -1 ? null : items[index];

      const mod = event.metaKey || event.ctrlKey;

      if (mod) {
        // The desktop clipboard, because ⌘X ⌘V is how a drive actually gets
        // reorganised: pick things up here, walk to where they belong, put them
        // down. No dialog expresses "somewhere I will recognise when I see it".
        switch (event.key?.toLowerCase()) {
          case "a":
            event.preventDefault();
            selection.selectAll();
            return;
          case "c":
            if (!selection.count) return;
            event.preventDefault();
            handlers.copyToClipboard(selection.selected);
            return;
          case "v":
            event.preventDefault();
            shortcuts?.paste?.();
            return;
          case "d":
            if (!selection.count) return;
            event.preventDefault();
            handlers.duplicate(selection.selected);
            return;
          case "arrowup":
            event.preventDefault();
            shortcuts?.up?.();
            return;
          default:
        }
      }

      switch (event.key) {
        case "ArrowDown":
        case "ArrowUp":
        case "ArrowLeft":
        case "ArrowRight": {
          const nextIndex = resolve(index, event.key);
          if (nextIndex == null || nextIndex === index) return;
          event.preventDefault();

          const next = items[nextIndex];
          setActiveId(next.id);

          // Shift extends from the anchor the way it does with the mouse.
          // Without it, arrowing selects one at a time and the keyboard is a
          // second-class way to work — which is the opposite of the argument
          // this product makes.
          if (event.shiftKey) selection.extendTo(next);
          else selection.selectOnly(next);
          return;
        }

        case "Enter": {
          if (!current) return;
          event.preventDefault();
          handlers.open(current);
          return;
        }

        case " ": {
          if (!current) return;
          // Quick Look. The single most-loved thing in Finder, almost never on
          // the web, and free.
          event.preventDefault();
          handlers.preview(current);
          return;
        }

        case "Escape": {
          if (selection.count === 0) return;
          event.preventDefault();
          selection.clear();
          return;
        }

        case "Delete":
        case "Backspace": {
          if (selection.count === 0) return;
          event.preventDefault();
          handlers.trash(selection.selected);
          return;
        }

        case "F2": {
          if (!current) return;
          event.preventDefault();
          handlers.rename(current);
          return;
        }

        default:
      }
    },
    [items, activeId, setActiveId, selection, handlers, resolve, shortcuts],
  );
}

/** A list: the next item is the next index. */
export function resolveListIndex(index, key, length) {
  if (key === "ArrowUp" || key === "ArrowLeft") {
    return index <= 0 ? 0 : index - 1;
  }
  if (key === "ArrowDown" || key === "ArrowRight") {
    if (index === -1) return 0;
    return Math.min(index + 1, length - 1);
  }
  return null;
}

/**
 * A grid: left and right are neighbours, up and down are geometry.
 *
 * Finds the nearest item on the row above or below by comparing offsets, so it
 * is correct at any column count and stays correct while the window is being
 * resized — no measuring, no stored column count to fall out of date.
 */
export function resolveGridIndex(index, key, elements) {
  if (key === "ArrowLeft") return index <= 0 ? 0 : index - 1;
  if (key === "ArrowRight") {
    if (index === -1) return 0;
    return Math.min(index + 1, elements.length - 1);
  }
  if (index === -1) return 0;

  const from = elements[index];
  if (!from) return null;

  const down = key === "ArrowDown";
  const rowStep = down ? 1 : -1;
  let best = null;
  let bestDistance = Infinity;

  for (let i = index + rowStep; down ? i < elements.length : i >= 0; i += rowStep) {
    const candidate = elements[i];
    if (!candidate) continue;
    if (candidate.offsetTop === from.offsetTop) continue;

    // Only consider the first row we reach in that direction.
    if (best !== null && candidate.offsetTop !== elements[best].offsetTop) break;

    const distance = Math.abs(candidate.offsetLeft - from.offsetLeft);
    if (distance < bestDistance) {
      bestDistance = distance;
      best = i;
    }
  }

  return best;
}
