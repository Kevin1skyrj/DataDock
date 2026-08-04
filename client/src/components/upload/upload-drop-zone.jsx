"use client";

import { Upload } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";

import { isExternalFileDrag, readDropped } from "@/lib/dropped-entries";
import { enqueue } from "@/lib/upload-store";
import { cn } from "@/lib/utils";

/**
 * Dropping files in from the desktop.
 *
 * Listens on the window rather than on a bordered rectangle, because a drop
 * zone you have to aim at is a drop zone people miss. The whole workspace is
 * the target; the overlay only appears once files are actually over it.
 *
 * It never fires for an internal drag. `isExternalFileDrag` rejects anything
 * carrying our own MIME type, so moving a file between two folders and dragging
 * one in off the desktop stay completely separate gestures — which is the one
 * requirement most implementations of this get wrong.
 *
 * The counter is not decoration. `dragenter` and `dragleave` fire for every
 * element the pointer crosses, so tracking a boolean makes the overlay strobe
 * as the cursor moves over rows. Counting entries against exits is the only
 * version that stays steady, and the reset on `drop` is what stops a count that
 * drifted from leaving the overlay stuck on.
 */
export function UploadDropZone({ parentId }) {
  const [over, setOver] = useState(false);
  const depth = useRef(0);

  const reset = useCallback(() => {
    depth.current = 0;
    setOver(false);
  }, []);

  useEffect(() => {
    const onDragEnter = (event) => {
      if (!isExternalFileDrag(event.dataTransfer)) return;
      depth.current += 1;
      setOver(true);
    };

    const onDragOver = (event) => {
      if (!isExternalFileDrag(event.dataTransfer)) return;
      // Without this the browser navigates to the file instead of letting the
      // page have it — the single most common way this feature silently fails.
      event.preventDefault();
      event.dataTransfer.dropEffect = "copy";
    };

    const onDragLeave = (event) => {
      if (!isExternalFileDrag(event.dataTransfer)) return;
      depth.current = Math.max(0, depth.current - 1);
      if (depth.current === 0) setOver(false);
    };

    const onDrop = async (event) => {
      if (!isExternalFileDrag(event.dataTransfer)) return;
      event.preventDefault();
      reset();

      const entries = await readDropped(event.dataTransfer);
      if (entries.length) enqueue(entries, parentId);
    };

    window.addEventListener("dragenter", onDragEnter);
    window.addEventListener("dragover", onDragOver);
    window.addEventListener("dragleave", onDragLeave);
    window.addEventListener("drop", onDrop);

    return () => {
      window.removeEventListener("dragenter", onDragEnter);
      window.removeEventListener("dragover", onDragOver);
      window.removeEventListener("dragleave", onDragLeave);
      window.removeEventListener("drop", onDrop);
    };
  }, [parentId, reset]);

  return (
    <div
      aria-hidden="true"
      className={cn(
        "pointer-events-none absolute inset-2 z-30 grid place-items-center rounded-xl",
        "border-2 border-dashed border-brand bg-[color-mix(in_oklab,var(--overlay)_86%,transparent)]",
        "backdrop-blur-[2px] transition-opacity duration-150 ease-standard",
        over ? "opacity-100" : "opacity-0",
      )}
    >
      <div
        className={cn(
          "flex flex-col items-center gap-3 transition-[scale] duration-200 ease-standard",
          over ? "scale-100" : "scale-95",
        )}
      >
        <span className="grid size-12 place-items-center rounded-xl bg-brand-tint text-brand">
          <Upload className="size-5" />
        </span>
        <p className="text-md font-medium text-foreground">Drop to upload</p>
        <p className="text-base text-dim">Folders keep their structure.</p>
      </div>
    </div>
  );
}
