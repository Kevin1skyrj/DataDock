"use client";

import { ArrowDown, ArrowUp } from "lucide-react";
import { useCallback, useEffect, useRef } from "react";

import { Checkbox } from "@/components/ui/checkbox";
import { FILE_GRID, FileRow, FileRowSkeleton } from "@/components/workspace/file-row";
import { useWorkspace } from "@/components/workspace/workspace-context";
import { resolveListIndex, useGridKeyboard } from "@/components/workspace/use-grid-keyboard";
import { cn } from "@/lib/utils";

const COLUMN_LABEL = {
  size: "Size",
  modified: "Modified",
  shared: "Shared",
  opened: "Opened",
  deleted: "Deleted",
};

/** Which column each optional slot sorts by, or null when it is not sortable. */
const COLUMN_SORT = {
  size: "size",
  modified: "updatedAt",
  opened: "openedAt",
  deleted: "trashedAt",
  shared: null,
};

/** What `aria-sort` should read on a header cell — it belongs to the cell, not
 *  to the button inside it, which is a `button` and has no such state. */
function sortState(sort, field) {
  if (!field || sort.field !== field) return undefined;
  return sort.direction === "asc" ? "ascending" : "descending";
}

function SortButton({ field, children, className }) {
  const { sort, setSort } = useWorkspace();
  const activeSort = sort.field === field;

  if (!field) return <span className={className}>{children}</span>;

  return (
    <button
      type="button"
      // Click to sort, click again to reverse — the behaviour every desktop
      // file manager has had for thirty years and nobody needs taught.
      onClick={() =>
        setSort({
          field,
          direction: activeSort && sort.direction === "asc" ? "desc" : "asc",
        })
      }
      className={cn(
        "flex items-center gap-1 rounded-xs transition-colors duration-150 ease-standard",
        "focus-visible:outline-2 focus-visible:-outline-offset-1 focus-visible:outline-brand",
        activeSort ? "text-muted-foreground" : "hover:text-muted-foreground",
        className,
      )}
    >
      {children}
      {/* The arrow occupies its space whether or not it is shown, so the header
          label does not shift sideways when you sort by it. */}
      <span className="grid w-3 place-items-center">
        {activeSort ? (
          sort.direction === "asc" ? (
            <ArrowUp className="size-3" />
          ) : (
            <ArrowDown className="size-3" />
          )
        ) : null}
      </span>
    </button>
  );
}

/**
 * The listing, as a table.
 *
 * A real ARIA grid: `grid` → `rowgroup` → `row` → `rowheader`/`gridcell`, with a
 * roving tabindex so the whole thing is one tab stop rather than a hundred. That
 * is not pedantry — a file list where Tab walks every row is unusable with a
 * keyboard, and it is the single most common way this component is got wrong.
 *
 * It renders no business logic. Sorting asks the service, selection is a
 * headless model, actions come from the registry. What lives here is the shape
 * of the columns and the meaning of an arrow key in a list.
 */
export function FileTable() {
  const {
    view, items, loading, refreshing, sort, selection, activeId, setActiveId,
    handlers, toggleStar, drag, paste, path: trail, onNavigate,
  } = useWorkspace();

  const scrollRef = useRef(null);
  const rowRefs = useRef(new Map());

  const resolve = useCallback(
    (index, key) => resolveListIndex(index, key, items.length),
    [items.length],
  );

  const onKeyDown = useGridKeyboard({
    items, activeId, setActiveId, selection, handlers, resolve,
    // Workspace-level shortcuts the listing does not own but is the only thing
    // focused when they are pressed.
    shortcuts: {
      paste,
      up: () => onNavigate?.(trail.at(-2)?.id ?? null),
    },
  });

  // Keeps the focused row on screen when arrowing past the fold. `scrollTop`
  // rather than `scrollIntoView`, which would also scroll the page behind it.
  useEffect(() => {
    const list = scrollRef.current;
    const row = rowRefs.current.get(activeId);
    if (!list || !row) return;

    const top = row.offsetTop;
    const bottom = top + row.offsetHeight;
    if (top < list.scrollTop) list.scrollTop = top;
    else if (bottom > list.scrollTop + list.clientHeight) {
      list.scrollTop = bottom - list.clientHeight;
    }
  }, [activeId]);

  // Focus follows the active row so the keyboard model and the browser's idea
  // of focus never diverge — which is what makes shift+arrow announce correctly.
  useEffect(() => {
    const row = rowRefs.current.get(activeId);
    if (row && document.activeElement !== row && scrollRef.current?.contains(document.activeElement)) {
      row.focus();
    }
  }, [activeId]);

  const columns = view.columns;

  return (
    <div
      role="grid"
      aria-label={view.label}
      aria-multiselectable="true"
      aria-busy={loading || undefined}
      onKeyDown={onKeyDown}
      className="flex min-h-0 flex-1 flex-col"
    >
      <div role="rowgroup" className="shrink-0 border-b border-line px-1.5 pb-1.5">
        <div
          role="row"
          className={cn(FILE_GRID, "min-h-8 px-2 text-2xs tracking-widest text-dim uppercase")}
        >
          <span role="columnheader" className="flex items-center justify-center">
            <Checkbox
              checked={selection.all}
              indeterminate={selection.some}
              onCheckedChange={(checked) => (checked ? selection.selectAll() : selection.clear())}
              aria-label={selection.all ? "Deselect all" : "Select all"}
              className={cn(
                "transition-opacity duration-150 ease-standard",
                selection.count > 0 ? "opacity-100" : "opacity-0 hover:opacity-100 focus-visible:opacity-100",
              )}
            />
          </span>

          <span role="columnheader" aria-sort={sortState(sort, "name")}>
            <SortButton field="name">Name</SortButton>
          </span>

          <span
            role="columnheader"
            aria-sort={sortState(sort, COLUMN_SORT[columns[0]])}
            className="justify-self-end"
          >
            <SortButton field={COLUMN_SORT[columns[0]]}>{COLUMN_LABEL[columns[0]]}</SortButton>
          </span>

          <span
            role="columnheader"
            aria-sort={sortState(sort, COLUMN_SORT[columns[1]])}
            className="hidden sm:block"
          >
            <SortButton field={COLUMN_SORT[columns[1]]}>{COLUMN_LABEL[columns[1]]}</SortButton>
          </span>

          <span
            role="columnheader"
            aria-sort={sortState(sort, COLUMN_SORT[columns[2]])}
            className="hidden xl:block"
          >
            <SortButton field={COLUMN_SORT[columns[2]]}>
              {COLUMN_LABEL[columns[2]] ?? ""}
            </SortButton>
          </span>

          <span role="columnheader" />
        </div>
      </div>

      <div
        ref={scrollRef}
        role="rowgroup"
        className={cn(
          "min-h-0 flex-1 overflow-y-auto p-1.5",
          // A refetch dims rather than blanks: the rows you were looking at stay
          // where they are, so a sort change does not throw the list away and
          // rebuild it under your cursor.
          "transition-opacity duration-150 ease-standard",
          refreshing && "opacity-70",
        )}
      >
        {loading
          ? Array.from({ length: 8 }, (_, index) => (
              <FileRowSkeleton key={index} width={`${42 + ((index * 17) % 38)}%`} />
            ))
          : items.map((item) => (
              <FileRow
                key={item.id}
                ref={(node) => {
                  if (node) rowRefs.current.set(item.id, node);
                  else rowRefs.current.delete(item.id);
                }}
                item={item}
                selected={selection.isSelected(item.id)}
                draggable
                dragging={drag.dragging?.ids.includes(item.id) ?? false}
                dropActive={drag.dropTarget === item.id}
                // Only folders take a drop. Highlighting a file would promise
                // something the drop cannot deliver.
                dropProps={item.type === "folder" ? drag.dropProps(item.id, { spring: true }) : undefined}
                onDragStart={(dragged, event) => {
                  // Dragging something inside a selection carries the whole
                  // selection; dragging something outside one carries just it.
                  const payload = selection.isSelected(dragged.id) ? selection.selected : [dragged];
                  if (!selection.isSelected(dragged.id)) selection.selectOnly(dragged);
                  drag.startDrag(event, payload);
                }}
                onDragEnd={drag.endDrag}
                active={activeId === item.id}
                selectionActive={selection.count > 0}
                tabIndex={activeId === item.id || (!activeId && items[0]?.id === item.id) ? 0 : -1}
                columns={columns}
                onSelect={(row, event) => {
                  setActiveId(row.id);
                  selection.handleClick(row, event);
                }}
                onToggleSelect={selection.toggle}
                onOpen={handlers.open}
                onToggleStar={toggleStar}
                onActions={(row, event) => {
                  // The overflow button opens the same menu the right-click
                  // does, by synthesising the event the menu listens for. One
                  // menu, one definition, two ways in.
                  setActiveId(row.id);
                  if (!selection.isSelected(row.id)) selection.selectOnly(row);
                  event.currentTarget.dispatchEvent(
                    new MouseEvent("contextmenu", {
                      bubbles: true,
                      clientX: event.clientX,
                      clientY: event.clientY,
                    }),
                  );
                }}
              />
            ))}
      </div>
    </div>
  );
}
