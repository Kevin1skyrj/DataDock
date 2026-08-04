"use client";

import { Toast as ToastPrimitive } from "@base-ui/react/toast";
import { CircleAlert, X } from "lucide-react";

import { cn } from "@/lib/utils";

/**
 * Transient results, with a way to take them back.
 *
 * Created outside React so anything can raise one — the workspace context, a
 * service failure, a keyboard shortcut — without a hook, a prop or a context
 * read. `notify` is a plain function call from anywhere.
 *
 * This is the counterpart to not asking "are you sure?". Every destructive
 * action in the workspace is reversible, so the honest interaction is to do the
 * thing and offer to undo it, rather than interrupting the ninety-nine times it
 * was intended to guard the once it was not.
 */
export const toastManager = ToastPrimitive.createToastManager();

/**
 * @param {object} toast
 * @param {string} toast.title
 * @param {string} [toast.description]
 * @param {() => void} [toast.undo] renders an Undo button when supplied
 * @param {"error"} [toast.type]
 */
export function notify({ title, description, undo, type, timeout }) {
  return toastManager.add({
    title,
    description,
    type,
    // Undo needs long enough to notice and decide. Errors stay until dismissed,
    // because a message you missed is a message that never happened.
    timeout: timeout ?? (type === "error" ? 0 : undo ? 8000 : 4000),
    priority: type === "error" ? "high" : "low",
    data: { undo },
  });
}

export function ToastProvider({ children }) {
  return (
    <ToastPrimitive.Provider toastManager={toastManager} limit={3}>
      {children}
      <ToastViewport />
    </ToastPrimitive.Provider>
  );
}

function ToastViewport() {
  return (
    <ToastPrimitive.Portal>
      <ToastPrimitive.Viewport
        className={cn(
          "fixed right-4 bottom-4 z-100 flex w-[min(24rem,calc(100vw-2rem))] flex-col",
          // The stack is anchored bottom-right rather than centred: a message
          // about something you just did should not cross the thing you did it
          // to. Toasts sit clear of the listing and clear of the status bar.
          "outline-none",
        )}
      >
        <ToastList />
      </ToastPrimitive.Viewport>
    </ToastPrimitive.Portal>
  );
}

function ToastList() {
  const { toasts } = ToastPrimitive.useToastManager();

  return toasts.map((toast, index) => (
    <ToastPrimitive.Root
      key={toast.id}
      toast={toast}
      style={{
        // Base UI stacks them at the same point; these are what turn that into
        // a deck. Both are transforms, so the whole stack composites.
        "--toast-index": index,
        zIndex: toasts.length - index,
      }}
      className={cn(
        "absolute right-0 bottom-0 w-full",
        "rounded-lg border border-line-2 bg-overlay p-3.5 shadow-elevated",
        "transition-[translate,scale,opacity] duration-220 ease-standard",
        "translate-y-[calc(var(--toast-index)*-0.6rem)] scale-[calc(1-var(--toast-index)*0.04)]",
        "data-expanded:translate-y-(--toast-offset-y) data-expanded:scale-100",
        "data-starting-style:translate-y-4 data-starting-style:opacity-0",
        "data-ending-style:translate-y-4 data-ending-style:opacity-0",
        "select-none",
      )}
    >
      <div className="flex items-start gap-3">
        {toast.type === "error" ? (
          <CircleAlert className="mt-0.5 size-4 shrink-0 text-error" />
        ) : null}

        <div className="flex min-w-0 flex-1 flex-col gap-0.5">
          <ToastPrimitive.Title
            className={cn(
              "text-base font-medium",
              toast.type === "error" ? "text-error" : "text-foreground",
            )}
          />
          {toast.description ? (
            <ToastPrimitive.Description className="text-sm text-dim" />
          ) : null}
        </div>

        {toast.data?.undo ? (
          <ToastPrimitive.Close
            onClick={toast.data.undo}
            className={cn(
              "shrink-0 rounded-md px-2 py-1 text-base font-medium text-brand",
              "transition-colors duration-150 ease-standard hover:bg-brand-tint",
              "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand",
            )}
          >
            Undo
          </ToastPrimitive.Close>
        ) : null}

        <ToastPrimitive.Close
          aria-label="Dismiss"
          className={cn(
            "grid size-6 shrink-0 place-items-center rounded-md text-dim",
            "transition-colors duration-150 ease-standard hover:bg-surface-2 hover:text-foreground",
            "focus-visible:outline-2 focus-visible:-outline-offset-1 focus-visible:outline-brand",
          )}
        >
          <X className="size-3.5" />
        </ToastPrimitive.Close>
      </div>
    </ToastPrimitive.Root>
  ));
}
