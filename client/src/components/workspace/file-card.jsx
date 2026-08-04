"use client";

import { Link2, MoreHorizontal, Star } from "lucide-react";

import { Checkbox } from "@/components/ui/checkbox";
import { FileIcon } from "@/components/workspace/file-icon";
import { formatBytes, formatDate } from "@/lib/format";
import { cn } from "@/lib/utils";

/**
 * One item, as a card.
 *
 * The grid's counterpart to `FileRow`, and deliberately not a variant of it. A
 * row is a set of aligned columns; a card is a stacked block with a thumbnail
 * well. Forcing one component to be both would mean a `layout` prop threaded
 * through every rule inside it, which is how components turn into configuration
 * files.
 *
 * What it does share is everything that matters: the same states, the same
 * accent language, the same checkbox behaviour, the same callbacks. The
 * selection model, the actions and the keyboard do not know which of the two
 * they are driving.
 */
export function FileCard({
  item,
  selected = false,
  active = false,
  selectionActive = false,
  tabIndex = -1,
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
  const isFolder = item.type === "folder";

  return (
    <div
      ref={ref}
      role="gridcell"
      data-workspace="card"
      data-item-id={item.id}
      aria-selected={selected}
      tabIndex={tabIndex}
      data-active={active || undefined}
      draggable={draggable}
      onDragStart={(event) => onDragStart?.(item, event)}
      onDragEnd={onDragEnd}
      onClick={(event) => onSelect?.(item, event)}
      onDoubleClick={() => onOpen?.(item)}
      onContextMenu={(event) => onContextMenu?.(item, event)}
      {...dropProps}
      className={cn(
        "group relative flex cursor-default flex-col gap-2 rounded-lg border p-2.5 select-none",
        "transition-[background-color,border-color,box-shadow,opacity] duration-150 ease-standard",
        "outline-none focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-brand",
        selected
          ? "border-brand/40 bg-brand-tint"
          : "border-line bg-surface hover:border-line-2 hover:bg-surface-2",
        dropActive && "border-brand bg-brand-tint ring-2 ring-brand",
        dragging && "opacity-40",
      )}
    >
      {/* The well. Folders get the accent, files stay neutral — the same rule
          the icon follows, at a size where it reads as a container. */}
      <div
        className={cn(
          "grid aspect-4/3 place-items-center rounded-md transition-colors duration-150 ease-standard",
          isFolder ? "bg-brand-tint" : "bg-bg-deep",
        )}
      >
        <FileIcon kind={item.kind} selected={selected} className="size-8" />
      </div>

      <div className="flex min-w-0 flex-col gap-0.5">
        <span
          title={item.name}
          className="truncate text-base text-foreground"
        >
          {item.name}
        </span>

        <span className="flex items-center gap-1.5 text-xs text-dim">
          <span className="truncate">
            {isFolder ? `${item.itemCount ?? 0} items` : formatBytes(item.size)}
          </span>
          <span aria-hidden="true">·</span>
          <span className="truncate">{formatDate(item.updatedAt)}</span>
        </span>
      </div>

      {/* Controls float over the well rather than taking rows of their own, so
          a card at rest is a thumbnail and a name and nothing else. */}
      <div
        className={cn(
          "absolute top-3.5 left-3.5 transition-opacity duration-150 ease-standard",
          selected || selectionActive
            ? "opacity-100"
            : "opacity-0 group-hover:opacity-100 group-focus-within:opacity-100",
        )}
      >
        <Checkbox
          checked={selected}
          onCheckedChange={() => onToggleSelect?.(item)}
          onClick={(event) => event.stopPropagation()}
          aria-label={`Select ${item.name}`}
        />
      </div>

      <div className="absolute top-3.5 right-3.5 flex items-center gap-0.5">
        {item.share ? (
          <span className="grid size-6 place-items-center rounded-sm bg-overlay/80 text-dim">
            <Link2 aria-label="Shared with a link" className="size-3.5" />
          </span>
        ) : null}

        <button
          type="button"
          aria-label={item.starred ? `Unstar ${item.name}` : `Star ${item.name}`}
          aria-pressed={item.starred}
          onClick={(event) => {
            event.stopPropagation();
            onToggleStar?.(item);
          }}
          className={cn(
            "grid size-6 place-items-center rounded-sm bg-overlay/80",
            "transition-[opacity,color] duration-150 ease-standard",
            "focus-visible:outline-2 focus-visible:-outline-offset-1 focus-visible:outline-brand",
            item.starred
              ? "text-brand opacity-100"
              : "text-dim opacity-0 group-hover:opacity-100 group-focus-within:opacity-100 hover:text-foreground focus-visible:opacity-100",
          )}
        >
          <Star className={cn("size-3.5", item.starred && "fill-current")} />
        </button>

        <button
          type="button"
          aria-label={`Actions for ${item.name}`}
          onClick={(event) => {
            event.stopPropagation();
            onActions?.(item, event);
          }}
          className={cn(
            "grid size-6 place-items-center rounded-sm bg-overlay/80 text-dim",
            "transition-[opacity,color] duration-150 ease-standard hover:text-foreground",
            "focus-visible:outline-2 focus-visible:-outline-offset-1 focus-visible:outline-brand",
            "opacity-0 group-hover:opacity-100 group-focus-within:opacity-100 focus-visible:opacity-100",
          )}
        >
          <MoreHorizontal className="size-3.5" />
        </button>
      </div>
    </div>
  );
}

export function FileCardSkeleton() {
  return (
    <div aria-hidden="true" className="flex flex-col gap-2 rounded-lg border border-line p-2.5">
      <div className="aspect-4/3 rounded-md bg-surface-2" />
      <div className="h-3 w-3/4 rounded-full bg-surface-2" />
      <div className="h-2.5 w-1/2 rounded-full bg-surface-2" />
    </div>
  );
}
