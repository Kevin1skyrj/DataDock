"use client";

import { useId } from "react";

import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

/**
 * A labelled text field.
 *
 * `Input` deliberately owns only the control — border, focus ring, slots — so
 * every form would otherwise re-wire the same four things: a label bound to the
 * right id, a message, `aria-describedby` pointing at it, and `aria-invalid`.
 * Getting one of those wrong is invisible on screen and total for a screen
 * reader, which is exactly the kind of thing that should be written once.
 *
 * Renders the input itself rather than accepting it as a child, so React Hook
 * Form spreads straight through:
 *
 *   <Field label="Email" error={errors.email?.message} {...register("email")} />
 */
export function Field({
  label,
  error,
  hint,
  labelSlot,
  // Anything that belongs to the control but sits under it — a strength meter,
  // a remaining-characters count. Not the input: `Field` renders that itself.
  children,
  id,
  className,
  // Pulled out by name so the window's entrance animates the whole field
  // rather than the bare `<input>` every other prop is forwarded to.
  "data-auth": marker,
  ...props
}) {
  const generated = useId();
  const fieldId = id ?? generated;
  const hintId = `${fieldId}-hint`;
  const errorId = `${fieldId}-error`;

  // The error replaces the hint rather than stacking under it — two lines of
  // guidance where one of them says you got it wrong is one line too many.
  const message = error ?? hint;
  const describedBy = message ? (error ? errorId : hintId) : undefined;

  return (
    <div data-auth={marker} className={cn("flex flex-col gap-2", className)}>
      <div className="flex items-baseline justify-between gap-3">
        <label htmlFor={fieldId} className="text-base font-medium text-muted-foreground">
          {label}
        </label>
        {labelSlot}
      </div>

      <Input
        id={fieldId}
        size="lg"
        invalid={Boolean(error)}
        aria-describedby={describedBy}
        {...props}
      />

      {children}

      {message ? (
        <p
          id={error ? errorId : hintId}
          // `alert` only on the error: it interrupts, which is right when a
          // submission has just failed and wrong for a hint that was always
          // going to be there.
          role={error ? "alert" : undefined}
          className={cn(
            "animate-[dd-detail_240ms_var(--ease-standard)] text-base",
            error ? "text-error" : "text-dim",
          )}
        >
          {message}
        </p>
      ) : null}
    </div>
  );
}
