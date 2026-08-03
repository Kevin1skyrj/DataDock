"use client";

import { useImperativeHandle, useRef } from "react";

import { OTP_LENGTH } from "@/constants/auth";
import { cn } from "@/lib/utils";

/**
 * Six boxes that behave like one field.
 *
 * The value is a plain string of digits, never an array with holes in it. That
 * single decision removes most of what makes these controls fragile: there is
 * no such thing as a filled fourth box with an empty second one, so every
 * handler is a string operation and the form gets `"418205"` or a prefix of it,
 * never something it has to reassemble.
 *
 * What it has to get right, because these are the ways people actually use it:
 *
 * - **Pasting.** Nobody retypes a code they can copy. A paste anywhere in the
 *   group fills the whole thing and submits, and non-digits are stripped rather
 *   than rejected — codes get copied with a stray space more often than not.
 * - **Backspace.** From a filled box it clears that box; from an empty one it
 *   steps back and clears the one before. Anything else means holding the key
 *   down does nothing after the first press.
 * - **Autofill.** `one-time-code` on the first box is what lets a password
 *   manager or the OS offer the code. It costs one attribute and is invisible
 *   until the moment it saves someone the trip to their inbox.
 *
 * Completion is reported rather than acted on: this control does not know it is
 * in a form, and the form is the thing entitled to decide that six digits means
 * submit.
 */
export function OtpInput({
  value = "",
  onChange,
  onComplete,
  invalid = false,
  disabled = false,
  describedBy,
  labelledBy,
  ref,
}) {
  const boxes = useRef([]);

  const focusBox = (index) => {
    const clamped = Math.max(0, Math.min(index, OTP_LENGTH - 1));
    boxes.current[clamped]?.focus();
    boxes.current[clamped]?.select();
  };

  // A rejected code is cleared and handed back to the visitor at the first box.
  // Without somewhere to put the cursor, clearing the value would leave them
  // focused on box six typing into an empty field from the wrong end.
  useImperativeHandle(ref, () => ({ focusFirst: () => focusBox(0) }), []);

  const commit = (next, caret) => {
    onChange(next);
    focusBox(caret);
    if (next.length === OTP_LENGTH) onComplete?.(next);
  };

  const handleInput = (index, raw) => {
    const incoming = raw.replace(/\D/g, "");
    if (!incoming) return;

    // Slicing past the end simply appends, so a box can never open a gap in
    // front of itself however far along the group it sits.
    const next = (
      value.slice(0, index) +
      incoming +
      value.slice(index + incoming.length)
    ).slice(0, OTP_LENGTH);

    commit(next, index + incoming.length);
  };

  const handleKeyDown = (index, event) => {
    if (event.key === "Backspace") {
      event.preventDefault();
      if (index < value.length) {
        commit(value.slice(0, index) + value.slice(index + 1), index);
      } else if (index > 0) {
        commit(value.slice(0, index - 1), index - 1);
      }
      return;
    }

    if (event.key === "ArrowLeft") {
      event.preventDefault();
      focusBox(index - 1);
      return;
    }

    if (event.key === "ArrowRight") {
      event.preventDefault();
      focusBox(index + 1);
    }
  };

  const handlePaste = (event) => {
    const pasted = event.clipboardData
      .getData("text")
      .replace(/\D/g, "")
      .slice(0, OTP_LENGTH);

    if (!pasted) return;
    event.preventDefault();
    commit(pasted, pasted.length);
  };

  return (
    <div
      role="group"
      aria-labelledby={labelledBy}
      aria-describedby={describedBy}
      onPaste={handlePaste}
      className="flex gap-2"
    >
      {Array.from({ length: OTP_LENGTH }, (_, index) => {
        const digit = value[index] ?? "";

        return (
          <input
            key={index}
            ref={(node) => {
              boxes.current[index] = node;
            }}
            type="text"
            inputMode="numeric"
            // Only the first box offers autofill — six boxes all claiming to be
            // the one-time code is what makes password managers fill the same
            // digit into every one of them.
            autoComplete={index === 0 ? "one-time-code" : "off"}
            maxLength={OTP_LENGTH}
            value={digit}
            disabled={disabled}
            aria-label={`Digit ${index + 1} of ${OTP_LENGTH}`}
            aria-invalid={invalid || undefined}
            onChange={(event) => handleInput(index, event.target.value)}
            onKeyDown={(event) => handleKeyDown(index, event)}
            onFocus={(event) => event.target.select()}
            className={cn(
              "h-12 min-w-0 flex-1 rounded-lg border text-center font-mono text-display-xs text-foreground",
              "shadow-[0_1px_0_var(--lit)_inset] transition-[border-color,background-color,box-shadow] duration-200 ease-standard",
              "outline-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand",
              "disabled:cursor-not-allowed disabled:opacity-50",
              // A filled box warms towards the accent, so how far along you are
              // is legible at a glance rather than by reading the digits.
              digit ? "border-brand/40 bg-brand-tint" : "border-line bg-surface hover:border-line-2",
              invalid && "border-error",
            )}
          />
        );
      })}
    </div>
  );
}
