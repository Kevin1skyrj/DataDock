"use client";

import { cn } from "@/lib/utils";

/**
 * The shape every settings page is made of.
 *
 * A card per topic, a row per setting, label on the left and control on the
 * right. It is the least surprising layout there is, which on a settings page
 * is the point: nobody arrives here to be delighted, they arrive to change one
 * thing and leave.
 *
 * Rows are a definition list rather than a table. A table would promise columns
 * that line up across sections, and they do not — each control is a different
 * width and forcing them into a grid makes short rows look broken.
 */
export function SettingsCard({ title, description, children, footer, className }) {
  return (
    <section
      className={cn("overflow-hidden rounded-xl border border-line bg-overlay", className)}
    >
      {title ? (
        <header className="flex flex-col gap-1 border-b border-line px-5 py-4">
          <h2 className="text-md font-medium text-foreground">{title}</h2>
          {description ? (
            <p className="text-base leading-[1.6] text-muted-foreground">{description}</p>
          ) : null}
        </header>
      ) : null}

      <div className="divide-y divide-line/60">{children}</div>

      {footer ? (
        <footer className="flex items-center justify-end gap-2 border-t border-line bg-surface px-5 py-3">
          {footer}
        </footer>
      ) : null}
    </section>
  );
}

export function SettingRow({ label, hint, control, children, htmlFor, className }) {
  return (
    <div
      className={cn(
        "flex flex-col gap-3 px-5 py-4",
        // Stacked on a phone, side by side from `sm`. A label and a control
        // squeezed onto one line at 360px is how settings pages end up with
        // three-word labels wrapping under a switch.
        "sm:flex-row sm:items-center sm:justify-between sm:gap-6",
        className,
      )}
    >
      <div className="flex min-w-0 flex-col gap-0.5">
        {/* A real `<label>` when the control can take one, so the whole row
            text is a hit target for it. */}
        {htmlFor ? (
          <label htmlFor={htmlFor} className="text-base font-medium text-foreground">
            {label}
          </label>
        ) : (
          <span className="text-base font-medium text-foreground">{label}</span>
        )}
        {hint ? <p className="text-sm leading-[1.6] text-dim">{hint}</p> : null}
      </div>

      {control ? <div className="shrink-0">{control}</div> : null}
      {children}
    </div>
  );
}

/**
 * A choice of two or three, shown all at once.
 *
 * A dropdown hides the options behind a click and gives no sense of how many
 * there are. For a set this small, showing them is faster to read and faster to
 * use — and it makes the current choice legible without opening anything.
 */
export function SegmentedControl({ value, options, onChange, label, className }) {
  return (
    <div
      role="radiogroup"
      aria-label={label}
      className={cn(
        "flex w-full items-center rounded-md border border-line bg-surface p-0.5 sm:w-auto",
        className,
      )}
    >
      {options.map((option) => (
        <button
          key={option.id}
          type="button"
          role="radio"
          aria-checked={value === option.id}
          title={option.hint}
          onClick={() => onChange(option.id)}
          className={cn(
            "flex-1 rounded-sm px-3 py-1.5 text-base whitespace-nowrap sm:flex-none",
            "transition-colors duration-150 ease-standard",
            "focus-visible:outline-2 focus-visible:-outline-offset-1 focus-visible:outline-brand",
            value === option.id
              ? "bg-surface-2 text-foreground shadow-[0_1px_0_var(--lit)_inset]"
              : "text-dim hover:text-foreground",
          )}
        >
          {option.label}
        </button>
      ))}
    </div>
  );
}

/** The page's own heading. Distinct from the card titles beneath it. */
export function SettingsHeading({ title, description }) {
  return (
    <header className="flex flex-col gap-1.5">
      <h1 className="text-display-xs font-semibold tracking-tight text-foreground">{title}</h1>
      {description ? (
        <p className="max-w-prose text-base leading-[1.6] text-muted-foreground">{description}</p>
      ) : null}
    </header>
  );
}
