"use client";

import { Dialog as DialogPrimitive } from "@base-ui/react/dialog";
import { cva } from "class-variance-authority";
import { X } from "lucide-react";

import { cn } from "@/lib/utils";

export const Sheet = DialogPrimitive.Root;
export const SheetTrigger = DialogPrimitive.Trigger;
export const SheetClose = DialogPrimitive.Close;

/**
 * A panel that arrives from an edge.
 *
 * Built on the same Base UI dialog as `ui/dialog`, and a separate component
 * rather than a variant of it because the two differ in every dimension that
 * matters: a dialog is centred, sized to its content and enters on Y; a sheet is
 * pinned to an edge, full-bleed on one axis and enters on X. Folding both into
 * one set of variants produces a component where half the options are invalid
 * for the other half.
 *
 * What it inherits from the primitive is the part that is genuinely hard and
 * genuinely shared: the focus trap, the scroll lock, Escape to dismiss, the
 * click-outside, and returning focus to whatever opened it. None of that is
 * worth hand-rolling twice, and hand-rolled versions are where mobile navigation
 * accessibility usually goes wrong.
 *
 * Critically, it renders through a portal. The panel it replaces was an in-flow
 * element inside a sticky header, so opening it grew the header and pushed the
 * page down; a portalled, fixed panel cannot move anything.
 */

const panelVariants = cva(
  [
    "pointer-events-auto fixed inset-y-0 z-50 flex w-full flex-col bg-overlay",
    // Enter and exit are the same declaration played in both directions, so the
    // sheet leaves the way it came instead of vanishing.
    "transition-[transform,opacity] duration-320 ease-out-expo",
  ],
  {
    variants: {
      side: {
        right: [
          "right-0 border-l border-line",
          "data-starting-style:translate-x-full data-ending-style:translate-x-full",
        ],
        left: [
          "left-0 border-r border-line",
          "data-starting-style:-translate-x-full data-ending-style:-translate-x-full",
        ],
      },
      size: {
        /** Edge to edge — a takeover, for navigation on a small screen. */
        full: "max-w-none",
        /** A column beside the page, for filters and detail. */
        panel: "max-w-sm",
      },
    },
    defaultVariants: {
      side: "right",
      size: "full",
    },
  },
);

export function SheetContent({ className, children, side, size, showClose = true, ...props }) {
  return (
    <DialogPrimitive.Portal>
      <DialogPrimitive.Backdrop
        className={cn(
          "fixed inset-0 z-50 bg-[color-mix(in_oklab,var(--background)_62%,transparent)] backdrop-blur-[6px]",
          "transition-opacity duration-260 ease-standard",
          "data-starting-style:opacity-0 data-ending-style:opacity-0",
        )}
      />

      <DialogPrimitive.Popup
        className={cn(panelVariants({ side, size }), className)}
        {...props}
      >
        {children}

        {showClose ? (
          <DialogPrimitive.Close
            aria-label="Close menu"
            className={cn(
              "absolute top-5 right-5 inline-flex size-9 items-center justify-center rounded-md",
              "text-muted-foreground transition-colors duration-200 ease-standard",
              "hover:bg-surface-2 hover:text-foreground",
            )}
          >
            <X className="size-4" />
          </DialogPrimitive.Close>
        ) : null}
      </DialogPrimitive.Popup>
    </DialogPrimitive.Portal>
  );
}

export function SheetTitle({ className, ...props }) {
  return (
    <DialogPrimitive.Title
      className={cn("text-xl font-semibold tracking-tight", className)}
      {...props}
    />
  );
}

export function SheetDescription({ className, ...props }) {
  return (
    <DialogPrimitive.Description
      className={cn("text-base text-muted-foreground", className)}
      {...props}
    />
  );
}
