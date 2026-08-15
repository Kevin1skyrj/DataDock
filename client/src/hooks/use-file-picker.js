"use client";

import { useCallback } from "react";

import { readPicked } from "@/lib/dropped-entries";
import { enqueue } from "@/lib/upload-store";

/**
 * The `onChange` every file input in the product shares.
 *
 * Raising a native picker needs a real `<input type="file">`, so each control
 * that starts an upload renders one, hidden, and opens it from a click. What
 * they all repeated was this: read what was chosen, hand it to the queue, clear
 * the input. That is the part worth having in one place.
 *
 *   const inputRef = useRef(null);
 *   const onPick = useFilePicker(parentId);
 *
 *   <input ref={inputRef} type="file" multiple hidden onChange={onPick} />
 *   <Button onClick={() => inputRef.current?.click()}>Upload</Button>
 *
 * The ref stays with the component rather than being returned from here. A hook
 * that hands back a ref makes every read of its result a ref read during
 * render, which `react-hooks/refs` rightly refuses — and reaching for
 * `.current` inside a click handler, where the component already has it, is
 * both allowed and clearer.
 *
 * `parentId` is a dependency rather than a captured value, so a control that
 * outlives several folder navigations — the sidebar's Upload — still drops
 * files into the folder currently on screen.
 */
export function useFilePicker(parentId) {
  return useCallback(
    (event) => {
      const entries = readPicked(event.target.files);
      if (entries.length) enqueue(entries, parentId);
      // Cleared so choosing the same file twice in a row still fires a change.
      event.target.value = "";
    },
    [parentId],
  );
}
