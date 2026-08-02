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

export function DropdownMenuRadioItem({ className, children, ...props }) {
  return (
    <MenuPrimitive.RadioItem
      className={cn(
        "flex cursor-default items-center gap-2.5 rounded-md px-2 py-1.5 text-base text-muted-foreground",
        "transition-colors duration-150 ease-standard outline-none select-none",
        // Base UI drives this with the keyboard as well as the pointer, so one
        // rule covers hover and arrow-key navigation.
        "data-highlighted:bg-surface-2 data-highlighted:text-foreground",
        "data-checked:text-foreground",
        "data-disabled:pointer-events-none data-disabled:opacity-50",
        className,
      )}
      {...props}
    >
      {children}
    </MenuPrimitive.RadioItem>
  );
}
