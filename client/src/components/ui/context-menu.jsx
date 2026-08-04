"use client";

import { ContextMenu as ContextMenuPrimitive } from "@base-ui/react/context-menu";

import { cn } from "@/lib/utils";

/**
 * A right-click menu.
 *
 * Styled to match `DropdownMenu` exactly rather than sharing its parts, because
 * Base UI models them as separate primitives — a context menu is positioned at
 * a point, a dropdown at an anchor element — and forcing one to render the other
 * would mean fighting both. They agree on appearance, which is what matters, and
 * the item classes below are the same set of rules.
 */
export const ContextMenu = ContextMenuPrimitive.Root;
export const ContextMenuTrigger = ContextMenuPrimitive.Trigger;
export const ContextMenuGroup = ContextMenuPrimitive.Group;

const ITEM = [
  "flex cursor-default items-center gap-2.5 rounded-md px-2 py-1.5 text-base text-muted-foreground",
  "transition-colors duration-150 ease-standard outline-none select-none",
  // Base UI sets this for the keyboard as well as the pointer, so one rule
  // covers hover and arrow-key navigation and they cannot drift apart.
  "data-highlighted:bg-surface-2 data-highlighted:text-foreground",
  "data-disabled:pointer-events-none data-disabled:opacity-50",
];

export function ContextMenuContent({ className, children, ...props }) {
  return (
    <ContextMenuPrimitive.Portal>
      <ContextMenuPrimitive.Positioner className="z-50">
        <ContextMenuPrimitive.Popup
          className={cn(
            "min-w-52 rounded-lg border border-line-2 bg-overlay p-1 shadow-elevated",
            "origin-(--transform-origin) transition-[opacity,transform] duration-150 ease-standard",
            "data-starting-style:scale-95 data-starting-style:opacity-0",
            "data-ending-style:scale-95 data-ending-style:opacity-0",
            className,
          )}
          {...props}
        >
          {children}
        </ContextMenuPrimitive.Popup>
      </ContextMenuPrimitive.Positioner>
    </ContextMenuPrimitive.Portal>
  );
}

export function ContextMenuItem({ className, danger = false, ...props }) {
  return (
    <ContextMenuPrimitive.Item
      className={cn(ITEM, danger && "text-error data-highlighted:text-error", className)}
      {...props}
    />
  );
}

export function ContextMenuSeparator({ className, ...props }) {
  return (
    <ContextMenuPrimitive.Separator
      className={cn("-mx-1 my-1 h-px bg-line", className)}
      {...props}
    />
  );
}

export function ContextMenuLabel({ className, ...props }) {
  return (
    <ContextMenuPrimitive.GroupLabel
      className={cn("truncate px-2 py-1.5 text-2xs tracking-widest text-dim uppercase", className)}
      {...props}
    />
  );
}
