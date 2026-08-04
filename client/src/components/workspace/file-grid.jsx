"use client";

import { useCallback, useEffect, useRef } from "react";

import { FileCard, FileCardSkeleton } from "@/components/workspace/file-card";
import { useWorkspace } from "@/components/workspace/workspace-context";
import { resolveGridIndex, useGridKeyboard } from "@/components/workspace/use-grid-keyboard";
import { cn } from "@/lib/utils";

/**
 * The listing, as a grid.
 *
 * Presentation only. It shares the selection model, the action registry, the
 * context menu, the toolbar and the details panel with the table — the entire
 * difference between the two views is this file and `FileCard`. That was the
 * point of putting state in the provider and behaviour in `lib/`: adding a
 * second layout should cost a layout, not a second application.
 *
 * `auto-fill` rather than a fixed column count, so the grid answers the window
 * instead of a breakpoint, and the keyboard resolves up and down from where the
 * cards actually are rather than from a number that would have to be kept in
 * step with the CSS.
 */
export function FileGrid() {
  const {
    view, items, loading, refreshing, selection, activeId, setActiveId,
    handlers, toggleStar, drag, paste, path: trail, onNavigate,
  } = useWorkspace();

  const scrollRef = useRef(null);
  const cardRefs = useRef(new Map());

  const resolve = useCallback(
    (index, key) => {
      const elements = items.map((item) => cardRefs.current.get(item.id));
      return resolveGridIndex(index, key, elements);
    },
    [items],
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

  useEffect(() => {
    const list = scrollRef.current;
    const card = cardRefs.current.get(activeId);
    if (!list || !card) return;

    const top = card.offsetTop;
    const bottom = top + card.offsetHeight;
    if (top < list.scrollTop) list.scrollTop = top;
    else if (bottom > list.scrollTop + list.clientHeight) {
      list.scrollTop = bottom - list.clientHeight;
    }
  }, [activeId]);

  useEffect(() => {
    const card = cardRefs.current.get(activeId);
    if (card && document.activeElement !== card && scrollRef.current?.contains(document.activeElement)) {
      card.focus();
    }
  }, [activeId]);

  return (
    <div
      ref={scrollRef}
      role="grid"
      aria-label={view.label}
      aria-multiselectable="true"
      aria-busy={loading || undefined}
      onKeyDown={onKeyDown}
      className={cn(
        "min-h-0 flex-1 overflow-y-auto p-3",
        "transition-opacity duration-150 ease-standard",
        refreshing && "opacity-70",
      )}
    >
      <div
        role="row"
        className="grid gap-3 [grid-template-columns:repeat(auto-fill,minmax(9.5rem,1fr))]"
      >
        {loading
          ? Array.from({ length: 12 }, (_, index) => <FileCardSkeleton key={index} />)
          : items.map((item) => (
              <FileCard
                key={item.id}
                ref={(node) => {
                  if (node) cardRefs.current.set(item.id, node);
                  else cardRefs.current.delete(item.id);
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
                onSelect={(card, event) => {
                  setActiveId(card.id);
                  selection.handleClick(card, event);
                }}
                onToggleSelect={selection.toggle}
                onOpen={handlers.open}
                onToggleStar={toggleStar}
                onActions={(card, event) => {
                  setActiveId(card.id);
                  if (!selection.isSelected(card.id)) selection.selectOnly(card);
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
