"use client";

import { useEffect } from "react";

import { useWorkspace } from "@/components/workspace/workspace-context";
import { formatBytes, formatCount } from "@/lib/format";
import { cn } from "@/lib/utils";

/** How long a transient message stays before it clears itself. */
const STATUS_MS = 6000;

/**
 * The strip along the bottom.
 *
 * Two jobs, and they share a line because they are never both interesting. At
 * rest it reports what is in front of you the way Finder's status bar does —
 * how many items, how much space. After an action it carries the result, and
 * where the action can be taken back, the way to do it.
 *
 * Undo lives here rather than behind a confirmation dialog. Moving to trash is
 * already reversible, so asking "are you sure?" first interrupts the case that
 * always happens in order to guard the one that almost never does. Doing it and
 * offering to undo is both faster and more forgiving.
 */
export function StatusBar() {
  const { items, total, selection, status, setStatus } = useWorkspace();

  useEffect(() => {
    if (!status) return undefined;
    const id = window.setTimeout(() => setStatus(null), STATUS_MS);
    return () => window.clearTimeout(id);
  }, [status, setStatus]);

  const size = items.reduce((sum, item) => sum + (item.size ?? 0), 0);

  return (
    <div className="flex h-9 shrink-0 items-center gap-3 border-t border-line px-3 text-sm">
      {status ? (
        <div
          role="status"
          className={cn(
            "flex min-w-0 flex-1 animate-[dd-detail_180ms_var(--ease-standard)] items-center gap-3",
            status.tone === "error" ? "text-error" : "text-muted-foreground",
          )}
        >
          <span className="truncate">{status.text}</span>

          {status.undo ? (
            <button
              type="button"
              onClick={() => {
                status.undo();
                setStatus(null);
              }}
              className="shrink-0 rounded-xs font-medium text-brand underline underline-offset-2 transition-colors duration-150 ease-standard hover:text-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
            >
              Undo
            </button>
          ) : null}
        </div>
      ) : (
        <div className="flex min-w-0 flex-1 items-center gap-3 text-dim">
          <span className="truncate">
            {selection.count > 0
              ? `${selection.count} of ${total} selected`
              : formatCount(total)}
          </span>
          {size > 0 ? (
            <>
              <span aria-hidden="true">·</span>
              <span className="truncate">{formatBytes(size)}</span>
            </>
          ) : null}
        </div>
      )}
    </div>
  );
}
