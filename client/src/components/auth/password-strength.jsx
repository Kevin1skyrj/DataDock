"use client";

import { useWatch } from "react-hook-form";

import { PASSWORD_LEVELS } from "@/constants/auth";
import { cn } from "@/lib/utils";

/**
 * How strong the password is, from 1 to 4 — or 0 for "nothing typed yet".
 *
 * Length is weighted twice because it is worth more than variety: a long
 * passphrase beats a short password with a symbol jammed into it, and a meter
 * that says otherwise teaches the wrong habit.
 *
 * Anything below the minimum is pinned to "Weak" no matter how varied it is.
 * The meter and the validator have to agree — a field that reads "Good" and
 * then refuses to submit is the field's fault, not the visitor's.
 */
export function scorePassword(value) {
  if (!value) return 0;
  if (value.length < 8) return 1;

  let points = 1;
  if (value.length >= 12) points += 1;
  if (/[^A-Za-z0-9]/.test(value)) points += 1;
  if (/\d/.test(value) && /[A-Za-z]/.test(value)) points += 1;

  return Math.min(points, PASSWORD_LEVELS.length);
}

/**
 * Reads the password straight off the form rather than being handed it.
 *
 * `useWatch` re-renders only the component that calls it, so a keystroke
 * repaints four bars and a word instead of the whole form — which is what
 * `watch()` on the form itself would have cost, on every character.
 *
 * The meter keeps its space when the field is empty and fades rather than
 * appearing. Popping a 28px block into a form the moment someone starts typing
 * pushes everything below it down, which is the one thing a password field must
 * never do while a password is being typed into it.
 */
export function PasswordStrength({ control, name }) {
  const value = useWatch({ control, name }) ?? "";
  const score = scorePassword(value);
  const level = score ? PASSWORD_LEVELS[score - 1] : null;

  return (
    <div
      className={cn(
        "flex items-center gap-3 transition-opacity duration-300 ease-standard",
        level ? "opacity-100" : "opacity-0",
      )}
    >
      <div aria-hidden="true" className="flex flex-1 gap-1.5">
        {PASSWORD_LEVELS.map((_, index) => (
          <span
            key={index}
            className={cn(
              "h-1 flex-1 rounded-full transition-colors duration-300 ease-standard",
              index < score ? level.tone : "bg-surface-2",
            )}
          />
        ))}
      </div>

      {/* The bars are decoration; this is the meter. `polite` because it should
          be heard after the character that changed it, not instead of it. */}
      <span
        aria-live="polite"
        className={cn(
          "w-11 shrink-0 text-right text-sm font-medium transition-colors duration-300 ease-standard",
          level ? level.text : "text-dim",
        )}
      >
        {level?.label}
      </span>
    </div>
  );
}
