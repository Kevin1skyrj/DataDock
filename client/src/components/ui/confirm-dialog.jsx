"use client";

import { AlertDialog } from "@base-ui/react/alert-dialog";
import { TriangleAlert } from "lucide-react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

/**
 * Are you sure — asked only when the answer matters.
 *
 * This is the first confirmation in the product, and it took four milestones to
 * need one. Everything until now has been reversible, so everything until now
 * has done the thing and offered an undo. Interrupting a recoverable action
 * spends the visitor's attention on the case that always happens in order to
 * guard the one that never does.
 *
 * Permanent deletion is different: there is no undo to offer, so the only place
 * left to ask is before.
 *
 * `AlertDialog` rather than `Dialog` — it cannot be dismissed by clicking away
 * or by Escape alone landing on the destructive path, and it is announced as an
 * alert. Those are exactly the differences that matter here.
 */
export function ConfirmDialog({
  open,
  title,
  body,
  confirmLabel = "Delete",
  loading = false,
  onConfirm,
  onClose,
}) {
  return (
    <AlertDialog.Root open={open} onOpenChange={(next) => (next ? null : onClose())}>
      <AlertDialog.Portal>
        <AlertDialog.Backdrop
          className={cn(
            "fixed inset-0 z-50 bg-[color-mix(in_oklab,var(--background)_62%,transparent)] backdrop-blur-[6px]",
            "transition-opacity duration-220 ease-standard",
            "data-starting-style:opacity-0 data-ending-style:opacity-0",
          )}
        />

        <div className="pointer-events-none fixed inset-0 z-50 flex items-center justify-center p-6">
          <AlertDialog.Popup
            className={cn(
              "pointer-events-auto w-full max-w-[420px] rounded-xl border border-line-2 bg-overlay shadow-elevated",
              "transition-[opacity,transform] duration-220 ease-standard",
              "data-starting-style:scale-[0.985] data-starting-style:opacity-0",
              "data-ending-style:scale-[0.985] data-ending-style:opacity-0",
            )}
          >
            <div className="flex gap-4 p-6">
              <span className="grid size-10 shrink-0 place-items-center rounded-full bg-error/12 text-error">
                <TriangleAlert className="size-5" />
              </span>

              <div className="flex min-w-0 flex-col gap-1.5">
                <AlertDialog.Title className="text-xl font-semibold tracking-tight">
                  {title}
                </AlertDialog.Title>
                <AlertDialog.Description className="text-base leading-[1.6] text-muted-foreground">
                  {body}
                </AlertDialog.Description>
              </div>
            </div>

            <div className="flex flex-col-reverse gap-2 border-t border-line p-4 sm:flex-row sm:justify-end">
              <AlertDialog.Close render={<Button variant="ghost">Cancel</Button>} />
              <Button variant="destructive" loading={loading} onClick={onConfirm}>
                {confirmLabel}
              </Button>
            </div>
          </AlertDialog.Popup>
        </div>
      </AlertDialog.Portal>
    </AlertDialog.Root>
  );
}
