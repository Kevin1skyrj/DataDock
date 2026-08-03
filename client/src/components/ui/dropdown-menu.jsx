"use client";

import { Menu as MenuPrimitive } from "@base-ui/react/menu";

import { cn } from "@/lib/utils";

export const DropdownMenu = MenuPrimitive.Root;
export const DropdownMenuTrigger = MenuPrimitive.Trigger;
export const DropdownMenuRadioGroup = MenuPrimitive.RadioGroup;

/**
 * The menu surface, including its positioning layer.
 *
 * Base UI splits anchoring (Positioner) from the visible panel (Popup); the
 * transition lives on the Popup so it scales out of the edge it is anchored to,
 * which `data-side` reports at runtime.
 */
export function DropdownMenuContent({
  className,
  side = "bottom",
  align = "end",
  sideOffset = 8,
  children,
  ...props
}) {
  return (
    <MenuPrimitive.Portal>
      <MenuPrimitive.Positioner
        side={side}
        align={align}
        sideOffset={sideOffset}
        className="z-50"
      >
        <MenuPrimitive.Popup
          className={cn(
            "min-w-[180px] rounded-lg border border-line-2 bg-overlay p-1 shadow-elevated",
            "origin-(--transform-origin) transition-[opacity,transform] duration-200 ease-standard",
            "data-starting-style:scale-95 data-starting-style:opacity-0",
            "data-ending-style:scale-95 data-ending-style:opacity-0",
            className,
          )}
          {...props}
        >
          {children}
        </MenuPrimitive.Popup>
      </MenuPrimitive.Positioner>
    </MenuPrimitive.Portal>
  );
}

export function DropdownMenuLabel({ className, ...props }) {
  return (
    <MenuPrimitive.GroupLabel
      className={cn("px-2 py-1.5 text-2xs tracking-widest text-dim uppercase", className)}
      {...props}
    />
  );
}

/**
 * One row, whether it is a command or a choice.
 *
 * `data-highlighted` is Base UI's, and it is set by the keyboard as well as the
 * pointer — which is why there is no `hover:` here. One rule covers a mouse and
 * an arrow key, and the two can never drift apart.
 */
const ITEM = [
  "flex cursor-default items-center gap-2.5 rounded-md px-2 py-1.5 text-base text-muted-foreground",
  "transition-colors duration-150 ease-standard outline-none select-none",
  "data-highlighted:bg-surface-2 data-highlighted:text-foreground",
  "data-disabled:pointer-events-none data-disabled:opacity-50",
];

export function DropdownMenuRadioItem({ className, children, ...props }) {
  return (
    <MenuPrimitive.RadioItem
      className={cn(ITEM, "data-checked:text-foreground", className)}
      {...props}
    >
      {children}
    </MenuPrimitive.RadioItem>
  );
}

export function DropdownMenuItem({ className, ...props }) {
  return <MenuPrimitive.Item className={cn(ITEM, className)} {...props} />;
}

export const DropdownMenuGroup = MenuPrimitive.Group;

export function DropdownMenuSeparator({ className, ...props }) {
  // Pulled out past the popup's own padding, so the rule spans the full width
  // of the surface rather than floating with a gap at each end.
  return (
    <MenuPrimitive.Separator className={cn("-mx-1 my-1 h-px bg-line", className)} {...props} />
  );
}
