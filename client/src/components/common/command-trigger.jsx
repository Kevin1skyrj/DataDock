"use client";

import { Search } from "lucide-react";

import { Kbd } from "@/components/ui/kbd";
import { useShortcut } from "@/hooks/use-platform";
import { requestPalette } from "@/lib/palette-event";
import { cn } from "@/lib/utils";

/**
 * The way into the command palette.
 *
 * Reads as a command bar, not a text field. That is deliberate and it is the
 * whole design: a fixed width so it never looks like it wants typing, the
 * shortcut carried inside it so the keyboard route is advertised rather than
 * hidden, and the accent surfacing on hover to signal that it opens something
 * instead of accepting input.
 *
 * It is one control for search *and* commands because they are one thing. A
 * separate search field beside a separate palette button would be two doors to
 * the same room, and it would contradict the argument the landing page spends a
 * whole section making. The label says so out loud.
 *
 * It does not own the palette — it asks for it. `requestPalette` dispatches on
 * `window`, so the marketing page's demo and the application's real palette can
 * both answer without this knowing which one is listening.
 */
export function CommandTrigger({ label, className }) {
  const shortcut = useShortcut("K");

  return (
    <button
      type="button"
      onClick={requestPalette}
      aria-label={`${label} (${shortcut})`}
      className={cn(
        "group flex items-center gap-2 rounded-md border border-line bg-surface py-1.5 pr-1.5 pl-3",
        "shadow-[0_1px_0_var(--lit)_inset] transition-[border-color,background-color,box-shadow] duration-200 ease-standard",
        "hover:border-brand/40 hover:bg-surface-2 hover:shadow-[0_1px_0_var(--lit)_inset,0_0_0_3px_var(--brand-soft)]",
        className,
      )}
    >
      <Search className="size-4 shrink-0 text-dim transition-colors duration-200 ease-standard group-hover:text-brand" />

      <span className="flex-1 truncate text-left text-base text-muted-foreground">{label}</span>

      <Kbd className="transition-colors duration-200 ease-standard group-hover:border-brand/40 group-hover:text-brand">
        {shortcut}
      </Kbd>
    </button>
  );
}
