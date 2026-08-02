"use client";

import { Dialog as DialogPrimitive } from "@base-ui/react/dialog";
import { cva } from "class-variance-authority";
import { X } from "lucide-react";

import { cn } from "@/lib/utils";

export const Dialog = DialogPrimitive.Root;
export const DialogTrigger = DialogPrimitive.Trigger;
export const DialogClose = DialogPrimitive.Close;

const popupVariants = cva(
  [
    "pointer-events-auto relative w-full rounded-xl border border-line-2 bg-overlay shadow-elevated",
    "transition-[opacity,transform] duration-260 ease-standard",
    // Base UI drives enter/exit through these attributes, so the closed state
    // is described once and replayed in both directions.
    "data-starting-style:opacity-0 data-starting-style:-translate-y-2.5 data-starting-style:scale-[0.985]",
    "data-ending-style:opacity-0 data-ending-style:-translate-y-2.5 data-ending-style:scale-[0.985]",
  ],
  {
    variants: {
      size: {
        sm: "max-w-[420px]",
        md: "max-w-[560px]",
        lg: "max-w-[720px]",
      },
    },
    defaultVariants: {
      size: "md",
    },
  },
);

const viewportVariants = cva(
  // Scrolls rather than clipping when the dialog is taller than the viewport,
  // and stays click-through so the backdrop still receives outside presses.
  "pointer-events-none fixed inset-0 z-50 flex justify-center overflow-y-auto p-6",
  {
    variants: {
      position: {
        center: "items-center",
        // Anchored high, the way the design places the command palette.
        top: "items-start pt-[14vh]",
      },
    },
    defaultVariants: {
      position: "center",
    },
  },
);

/**
 * The dialog surface, including its backdrop.
 *
 * Always render a `DialogTitle` inside — Base UI wires it to `aria-labelledby`,
 * and without it the dialog is announced as an unlabelled group. Use
 * `DialogTitle className="sr-only"` when the design has no visible heading.
 *
 *   <Dialog>
 *     <DialogTrigger render={<Button>Rename</Button>} />
 *     <DialogContent>
 *       <DialogHeader>
 *         <DialogTitle>Rename file</DialogTitle>
 *         <DialogDescription>Choose a new name.</DialogDescription>
 *       </DialogHeader>
 *     </DialogContent>
 *   </Dialog>
 */
export function DialogContent({ className, children, size, position, showClose = true, ...props }) {
  return (
    <DialogPrimitive.Portal>
      <DialogPrimitive.Backdrop
        className={cn(
          "fixed inset-0 z-50 bg-[color-mix(in_oklab,var(--background)_62%,transparent)] backdrop-blur-[6px]",
          "transition-opacity duration-220 ease-standard",
          "data-starting-style:opacity-0 data-ending-style:opacity-0",
        )}
      />

      <div className={viewportVariants({ position })}>
        <DialogPrimitive.Popup className={cn(popupVariants({ size }), className)} {...props}>
          {children}

          {showClose ? (
            <DialogPrimitive.Close
              aria-label="Close dialog"
              className={cn(
                "absolute top-4 right-4 inline-flex size-8 items-center justify-center rounded-md",
                "text-muted-foreground transition-colors duration-200 ease-standard",
                "hover:bg-surface-2 hover:text-foreground",
              )}
            >
              <X className="size-4" />
            </DialogPrimitive.Close>
          ) : null}
        </DialogPrimitive.Popup>
      </div>
    </DialogPrimitive.Portal>
  );
}

export function DialogHeader({ className, ...props }) {
  return <div className={cn("flex flex-col gap-1.5 p-6 pb-4", className)} {...props} />;
}

export function DialogTitle({ className, ...props }) {
  return (
    <DialogPrimitive.Title
      className={cn("text-xl font-semibold tracking-tight", className)}
      {...props}
    />
  );
}

export function DialogDescription({ className, ...props }) {
  return (
    <DialogPrimitive.Description
      className={cn("text-base text-muted-foreground", className)}
      {...props}
    />
  );
}

export function DialogBody({ className, ...props }) {
  return <div className={cn("px-6 py-2", className)} {...props} />;
}

export function DialogFooter({ className, ...props }) {
  return (
    <div
      className={cn(
        "flex flex-col-reverse gap-2 border-t border-line p-6 sm:flex-row sm:justify-end",
        className,
      )}
      {...props}
    />
  );
}
