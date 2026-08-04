"use client";

import { useEffect, useState } from "react";

import { FILE_GRID, FileRow, FileRowSkeleton } from "@/components/workspace/file-row";
import { listItems, starItems } from "@/services/files";
import { cn } from "@/lib/utils";

/**
 * A review surface for `FileRow`, not a file browser.
 *
 * It exists so every state the row can be in — resting, hovered, selected,
 * focused, starred, shared, mid-rename-length, folder, loading — can be looked
 * at side by side before the table is built on top of it. The table is a
 * separate step and this is deliberately not a draft of it: there is no sorting,
 * no range selection, no context menu.
 *
 * Rows are rendered only after mount, which is the same rule the workspace will
 * follow. `formatDate` resolves "Today" against the local clock and the local
 * timezone, so server-rendering a row means the server's day and the visitor's
 * day disagree in exactly the cases that matter. Fetching on the client also
 * happens to be what makes the skeleton real rather than decorative.
 */
export function FileRowGallery() {
  const [items, setItems] = useState(null);
  const [selection, setSelection] = useState(() => new Set());

  useEffect(() => {
    let live = true;
    listItems({ parentId: null, sort: { field: "name", direction: "asc" } }).then((page) => {
      if (live) setItems(page.items);
    });
    return () => {
      live = false;
    };
  }, []);

  const toggle = (item) =>
    setSelection((current) => {
      const next = new Set(current);
      if (next.has(item.id)) next.delete(item.id);
      else next.add(item.id);
      return next;
    });

  const star = async (item) => {
    // Optimistic, then reconciled against what the service returns — the same
    // shape every mutation in the workspace will use.
    setItems((current) =>
      current.map((row) => (row.id === item.id ? { ...row, starred: !row.starred } : row)),
    );
    const [updated] = await starItems([item.id], !item.starred);
    setItems((current) => current.map((row) => (row.id === updated.id ? updated : row)));
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-2">
        <p className="text-2xs tracking-widest text-dim uppercase">Live — from the mock service</p>
        <p className="text-sm text-dim">
          Click to select · double-click to open · hover for the star and actions · Tab to focus
        </p>
      </div>

      <div className="overflow-hidden rounded-lg border border-line bg-bg-deep p-1.5">
        {/* The row declares itself a `row`; something has to declare itself the
            grid, or the role is orphaned and the whole listing is announced as
            a pile of divs. The table will own this. */}
        <div role="grid" aria-label="Example files" aria-multiselectable="true">
          <div
            role="row"
            className={cn(
              FILE_GRID,
              "min-h-8 px-2 text-2xs tracking-widest text-dim uppercase",
            )}
          >
            <span role="columnheader" />
            <span role="columnheader">Name</span>
            <span role="columnheader" className="text-right">
              Size
            </span>
            <span role="columnheader" className="hidden sm:block">
              Modified
            </span>
            <span role="columnheader" className="hidden xl:block">
              Shared
            </span>
            <span role="columnheader" />
          </div>

          {items
            ? items.map((item) => (
                <FileRow
                  key={item.id}
                  item={item}
                  selected={selection.has(item.id)}
                  selectionActive={selection.size > 0}
                  tabIndex={0}
                  onSelect={() => setSelection(new Set([item.id]))}
                  onToggleSelect={toggle}
                  onToggleStar={star}
                  onOpen={(opened) => window.alert(`Open ${opened.name}`)}
                  onActions={(target) => window.alert(`Actions for ${target.name}`)}
                />
              ))
            : Array.from({ length: 6 }, (_, index) => (
                <FileRowSkeleton key={index} width={`${45 + ((index * 13) % 40)}%`} />
              ))}
        </div>
      </div>

      <p className="text-sm text-dim">
        {items
          ? `${selection.size} of ${items.length} selected`
          : "Loading — the skeleton holds the row's exact geometry"}
      </p>
    </div>
  );
}
