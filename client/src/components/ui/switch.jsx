"use client";

import { Switch as SwitchPrimitive } from "@base-ui/react/switch";

import { cn } from "@/lib/utils";

/**
 * A switch.
 *
 * A switch, not a checkbox, and the difference is when the change takes effect.
 * A checkbox is a value you are about to submit; a switch is something that
 * happens the moment you flip it. Everything this is used for — a theme, a
 * notification, two-factor — takes effect immediately, so a switch is the
 * honest control and there is no Save button anywhere near it.
 */
export function Switch({ className, ...props }) {
  return (
    <SwitchPrimitive.Root
      className={cn(
        "relative inline-flex h-5 w-9 shrink-0 items-center rounded-full p-0.5",
        "bg-surface-2 transition-colors duration-200 ease-standard",
        "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand",
        "data-checked:bg-brand",
        "data-disabled:pointer-events-none data-disabled:opacity-50",
        className,
      )}
      {...props}
    >
      <SwitchPrimitive.Thumb
        className={cn(
          "size-4 rounded-full bg-overlay shadow-[0_1px_2px_rgba(0,0,0,0.28)]",
          // `translate` rather than `left`, so the travel composites instead of
          // laying out — the one thing a switch has to get right.
          "transition-[translate] duration-200 ease-standard",
          "data-checked:translate-x-4",
        )}
      />
    </SwitchPrimitive.Root>
  );
}
