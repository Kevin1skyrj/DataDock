"use client";

import { Link2, MoreHorizontal, Star } from "lucide-react";

import { FileIcon } from "@/components/workspace/file-icon";
import { Checkbox } from "@/components/ui/checkbox";
import { formatBytes, formatDate, formatDateFull } from "@/lib/format";
import { cn } from "@/lib/utils";

/**
 * The column template, shared by the row and the header that will sit above it.
 *
 * Exported rather than written twice, because a header and its rows disagreeing
 * about a column width is the classic table bug and it is invisible until the
 * one screen size where it isn't. Whatever renders the header imports this.
 *
 * Columns are dropped from the outside in as the viewport narrows: the extra
 * column first, then Modified, leaving name and size — the two facts you cannot
 * identify a file without.
 */
export const FILE_GRID = cn(
  "grid items-center gap-3",
  "grid-cols-[2.25rem_minmax(0,1fr)_5rem_2.25rem]",
  "sm:grid-cols-[2.25rem_minmax(0,1fr)_5.5rem_8.5rem_2.25rem]",
  "xl:grid-cols-[2.25rem_minmax(0,1fr)_5.5rem_8.5rem_6.5rem_2.25rem]",
);

/**
 * What each optional column shows.
 *
 * Exported so the header, the row and the details panel all read the same
 * definition. Recent shows when you opened something, Trash shows when you
 * deleted it, All files shows whether it is shared — one row component, three
 * views, no branching inside it.
 */
export const COLUMN_RENDER = {
  size: (item) => (item.type === "folder" ? "—" : formatBytes(item.size)),
  modified: (item) => formatDate(item.updatedAt),
  opened: (item) => formatDate(item.openedAt),
  deleted: (item) => formatDate(item.trashedAt),
  shared: (item) =>
    item.share ? <span className="text-brand">Link</span> : <span className="text-dim">—</span>,
};

/**
 * Splits a filename so the extension can be protected from truncation.
 *
 * `truncate` on the whole name gives you `very-long-quarterly-repor…`, which
 * has thrown away the one part that tells you what the file *is*. Letting the
 * stem truncate while the extension holds its ground gives
 * `very-long-quarterly-rep….pdf` — middle truncation, in pure CSS, with no
 * measurement and no layout thrash.
 */
function splitName(name, type) {
  if (type === "folder") return [name, ""];
  const dot = name.lastIndexOf(".");
  // A leading dot is the whole name (`.env`), not an extension.
  if (dot <= 0 || dot === name.length - 1) return [name, ""];
  return [name.slice(0, dot), name.slice(dot)];
}

/**
 * One item in a listing.
 *
 * This is the component every view in the workspace is built from — All files,
 * Recent, Starred, Shared, Trash, search results — so it takes its differences
 * as props rather than knowing about any of them. It renders no route, calls no
 * service and holds no state; everything it does, it reports.
 *
 * It is a `role="row"` and not a `<button>`, and that is not a detail: a row
 * contains a checkbox, a star and an actions menu, and interactive elements
 * cannot nest inside a button. The row is focusable through a roving tabindex
 * the list owns, which is why `tabIndex` arrives as a prop and defaults to -1.
 *
 * Three states have to stay tellable apart at a glance, so each uses a
 * different channel rather than three shades of the same one:
 *
 *   hover     a neutral lift — "the pointer is here"
 *   selected  accent fill, inset accent ring, accent rail — "this is chosen"
 *   focused   an inset accent outline — "the keyboard is here"
 *
 * Selected and focused can be true at once and must still read as two things,
 * which is why one is a fill and the other is a line.
 */
export function FileRow({
  item,
  selected = false,
  active = false,
  selectionActive = false,
  tabIndex = -1,
  columns = ["size", "modified", "shared"],
  draggable = false,
  dropActive = false,
  dragging = false,
  dropProps,
  onDragStart,
  onDragEnd,
  onSelect,
  onToggleSelect,
  onOpen,
  onToggleStar,
  onContextMenu,
  onActions,
  ref,
}) {
  const [stem, extension] = splitName(item.name, item.type);
  const isFolder = item.type === "folder";
  const shared = Boolean(item.share);

  // The checkbox column is always reserved, never conditionally rendered — a
  // list that reflows the moment you touch it feels broken. Only the control's
  // opacity changes. Once anything in the list is selected, every box shows,
  // because at that point you are picking, not browsing.
  const showCheckbox = selected || selectionActive;

  return (
    <div
      ref={ref}
      role="row"
      aria-selected={selected}
      tabIndex={tabIndex}
      data-file-row
      data-item-id={item.id}
      data-active={active || undefined}
      draggable={draggable}
      onDragStart={(event) => onDragStart?.(item, event)}
      onDragEnd={onDragEnd}
      onClick={(event) => onSelect?.(item, event)}
      onDoubleClick={() => onOpen?.(item)}
      onContextMenu={(event) => onContextMenu?.(item, event)}
      {...dropProps}
      className={cn(
        FILE_GRID,
        "group relative min-h-10 cursor-default rounded-md px-2 select-none",
        "transition-[background-color,box-shadow,opacity] duration-150 ease-standard",
        // Inset, because an outward ring in a dense list draws on the row above.
        "outline-none focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-brand",
        selected
          ? "bg-brand-tint ring-1 ring-brand/25 ring-inset hover:bg-brand-tint"
          : "hover:bg-surface",
        // A live drop target reads louder than a selection, because during a
        // drag it is the only thing being asked about.
        dropActive && "bg-brand-tint ring-2 ring-brand ring-inset",
        // What is in flight fades where it was, so the row does not look like it
        // is both here and being carried away.
        dragging && "opacity-40",
      )}
    >
      {/* Reads in the accent, the same rail the sidebar and the preview use, so
          "selected" means one thing everywhere in the product. */}
      <span
        aria-hidden="true"
        className={cn(
          "absolute inset-y-1.5 left-0 w-0.5 rounded-full bg-brand transition-opacity duration-150 ease-standard",
          selected ? "opacity-100" : "opacity-0",
        )}
      />

      {/* -------------------------------------------------------- select -- */}
      <div role="gridcell" className="flex items-center justify-center">
        <Checkbox
          checked={selected}
          onCheckedChange={() => onToggleSelect?.(item)}
          // Stops the row's own click from running and collapsing a multi
          // selection down to this one item.
          onClick={(event) => event.stopPropagation()}
          aria-label={`Select ${item.name}`}
          className={cn(
            "transition-opacity duration-150 ease-standard",
            showCheckbox
              ? "opacity-100"
              : "opacity-0 group-hover:opacity-100 group-focus-within:opacity-100",
          )}
        />
      </div>

      {/* ---------------------------------------------------------- name -- */}
      {/* `rowheader`, not `gridcell`: this is what names the row, and it is what
          a screen reader announces when you arrive on it. */}
      <div role="rowheader" className="flex min-w-0 items-center gap-2.5">
        <FileIcon kind={item.kind} selected={selected} />

        <span
          title={item.name}
          className={cn(
            "flex min-w-0 items-baseline text-md",
            selected ? "text-foreground" : "text-foreground",
          )}
        >
          <span className="truncate">{stem}</span>
          {extension ? <span className="shrink-0 text-dim">{extension}</span> : null}
        </span>

        {/* Status travels with the name rather than living in a column,
            because the columns are the first thing a narrow window takes away
            and "this is shared" should survive that. */}
        <span className="flex shrink-0 items-center gap-0.5">
          {/* The indicator and the toggle are one control, not a badge with a
              button hiding somewhere else. Starred rows show it at rest;
              unstarred rows reveal it on approach, so a list nobody is
              pointing at is a list of names rather than a field of controls. */}
          {onToggleStar ? (
            <button
              type="button"
              aria-label={item.starred ? `Unstar ${item.name}` : `Star ${item.name}`}
              aria-pressed={item.starred}
              onClick={(event) => {
                event.stopPropagation();
                onToggleStar(item);
              }}
              className={cn(
                "grid size-6 place-items-center rounded-sm",
                "transition-[opacity,color,background-color] duration-150 ease-standard",
                "hover:bg-surface-2 focus-visible:outline-2 focus-visible:-outline-offset-1 focus-visible:outline-brand",
                item.starred
                  ? "text-brand opacity-100"
                  : "text-dim opacity-0 group-hover:opacity-100 group-focus-within:opacity-100 hover:text-foreground focus-visible:opacity-100",
              )}
            >
              <Star className={cn("size-3.5", item.starred && "fill-current")} />
            </button>
          ) : (
            item.starred && (
              <Star aria-label="Starred" className="size-3.5 fill-current text-brand" strokeWidth={0} />
            )
          )}

          {shared ? (
            <Link2 aria-label="Shared with a link" className="size-3.5 text-dim" />
          ) : null}
        </span>
      </div>

      {/* ------------------------------------------------------- columns -- */}
      {/* Right-aligned and tabular where it is a size: those are read by
          comparing down the column, and ragged left edges make that
          impossible. Everything else reads left. */}
      <div
        role="gridcell"
        className={cn(
          "truncate text-xs text-dim",
          columns[0] === "size" ? "text-right font-mono tabular-nums" : "text-sm",
        )}
      >
        {COLUMN_RENDER[columns[0]]?.(item)}
      </div>

      <div
        role="gridcell"
        title={columns[1] === "modified" ? formatDateFull(item.updatedAt) : undefined}
        className="hidden truncate text-sm text-dim sm:block"
      >
        {COLUMN_RENDER[columns[1]]?.(item)}
      </div>

      <div role="gridcell" className="hidden truncate text-sm text-dim xl:block">
        {COLUMN_RENDER[columns[2]]?.(item)}
      </div>

      {/* ------------------------------------------------------- actions -- */}
      <div role="gridcell" className="flex items-center justify-end">
        <button
          type="button"
          aria-label={`Actions for ${item.name}`}
          onClick={(event) => {
            event.stopPropagation();
            onActions?.(item, event);
          }}
          className={cn(
            "grid size-7 place-items-center rounded-md text-dim",
            "transition-[opacity,background-color,color] duration-150 ease-standard",
            "hover:bg-surface-2 hover:text-foreground",
            "focus-visible:outline-2 focus-visible:-outline-offset-1 focus-visible:outline-brand",
            // Always reachable by keyboard even while invisible: `opacity-0` is
            // not `display:none`, so the tab order is unbroken and focus brings
            // it back into view.
            "opacity-0 group-hover:opacity-100 group-focus-within:opacity-100 focus-visible:opacity-100",
          )}
        >
          <MoreHorizontal className="size-4" />
        </button>
      </div>

    </div>
  );
}

/**
 * The row's shape, with nothing in it.
 *
 * Built from `FILE_GRID` rather than approximated, so the skeleton and the real
 * thing occupy identical space and the list does not jump when the data lands.
 * A loading state that shifts the layout is worse than no loading state — it
 * moves the row out from under a cursor that was already going somewhere.
 */
export function FileRowSkeleton({ width = "60%" }) {
  const bar = "h-3 rounded-full bg-surface-2";

  return (
    <div aria-hidden="true" className={cn(FILE_GRID, "min-h-10 px-2")}>
      <div />
      <div className="flex min-w-0 items-center gap-2.5">
        <div className="size-4 shrink-0 rounded-xs bg-surface-2" />
        <div className={bar} style={{ width }} />
      </div>
      <div className={cn(bar, "justify-self-end")} style={{ width: "2.5rem" }} />
      <div className={cn(bar, "hidden sm:block")} style={{ width: "4.5rem" }} />
      <div className={cn(bar, "hidden xl:block")} style={{ width: "2.5rem" }} />
      <div />
    </div>
  );
}
