"use client";

import { Checkbox as CheckboxPrimitive } from "@base-ui/react/checkbox";
import { Check, Minus } from "lucide-react";

import { cn } from "@/lib/utils";

/**
 * A checkbox.
 *
 * Indeterminate is a first-class state rather than an afterthought, because the
 * first thing that will use this is a table header whose job is to say "some of
 * these are selected" — and a header checkbox that can only be on or off lies
 * about the most common case.
 *
 * Base UI reports state through `data-checked` / `data-indeterminate`, which it
 * sets for the pointer and the keyboard alike, so the styling below never needs
 * a `:hover` twin or a JavaScript branch.
 *
 * Focus is left to the global `:focus-visible` outline in `globals.css`, with
 * one exception: the offset is negative, because inside a dense row an outward
 * ring would sit on top of the row above.
 */
export function Checkbox({ className, indicatorClassName, ...props }) {
  return (
    <CheckboxPrimitive.Root
      className={cn(
        "grid size-4 shrink-0 place-items-center rounded-xs border border-line-2 bg-surface",
        "transition-[background-color,border-color,color] duration-150 ease-standard",
        "hover:border-brand/50",
        "focus-visible:outline-2 focus-visible:-outline-offset-1 focus-visible:outline-brand",
        "data-checked:border-brand data-checked:bg-brand data-checked:text-brand-contrast",
        "data-indeterminate:border-brand data-indeterminate:bg-brand data-indeterminate:text-brand-contrast",
        "data-disabled:pointer-events-none data-disabled:opacity-50",
        className,
      )}
      {...props}
    >
      <CheckboxPrimitive.Indicator
        className={cn("flex", indicatorClassName)}
        // Rendered even when unchecked so the glyph can cross-fade rather than
        // pop, and so the box never changes size as it fills.
        keepMounted
      >
        {props.indeterminate ? (
          <Minus className="size-3" strokeWidth={3} />
        ) : (
          <Check className="size-3" strokeWidth={3} />
        )}
      </CheckboxPrimitive.Indicator>
    </CheckboxPrimitive.Root>
  );
}
