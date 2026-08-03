"use client";

import {
  BarChart3,
  Clock,
  CornerDownLeft,
  FolderClosed,
  LayoutGrid,
  Search,
  Settings,
  Share2,
  Star,
  Trash2,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";

import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Kbd } from "@/components/ui/kbd";
import { DASHBOARD_NAV } from "@/constants/dashboard";
import { OPEN_PALETTE_EVENT } from "@/lib/palette-event";
import { cn } from "@/lib/utils";

const ICONS = {
  layout: LayoutGrid,
  folder: FolderClosed,
  clock: Clock,
  star: Star,
  share: Share2,
  trash: Trash2,
  chart: BarChart3,
  settings: Settings,
};

/** Flattened once at module scope — the destinations do not change at runtime. */
const DESTINATIONS = DASHBOARD_NAV.flatMap((group) =>
  group.items.map((item) => ({
    ...item,
    // The group it lives under is worth matching on: typing "organize" should
    // find Starred, because that is how the sidebar taught you to think of it.
    haystack: `${item.label} ${group.label}`.toLowerCase(),
  })),
);

/**
 * The command palette.
 *
 * This milestone ships the "Go to" half, and it is real: every destination in
 * the sidebar is reachable from here, by keyboard, without touching the mouse.
 * Files, actions and fuzzy matching arrive with their own milestone — but a ⌘K
 * that opens onto an apology would be worse than no ⌘K at all, so what is here
 * works completely.
 *
 * It listens on `window` rather than being wired to a trigger, which is what
 * lets the shortcut, the top bar's chip and its mobile icon all reach the same
 * palette without any of them holding a reference to it. `lib/palette-event.js`
 * is the same seam the landing page's demo uses.
 *
 * Matching is a substring test, deliberately. Fuzzy matching over eight items
 * mostly produces confident wrong answers, and the honest version is one line.
 */
export function CommandPalette() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [cursor, setCursor] = useState(0);
  const listRef = useRef(null);

  const matches = useMemo(() => {
    const needle = query.trim().toLowerCase();
    if (!needle) return DESTINATIONS;
    return DESTINATIONS.filter((item) => item.haystack.includes(needle));
  }, [query]);

  // Clamped rather than stored blindly: the list shrinks as you type, and a
  // cursor left pointing past the end would highlight nothing and open nothing.
  const active = Math.min(cursor, Math.max(0, matches.length - 1));

  useEffect(() => {
    const reveal = () => {
      setQuery("");
      setCursor(0);
      setOpen(true);
    };

    const onKeyDown = (event) => {
      if ((event.metaKey || event.ctrlKey) && event.key?.toLowerCase() === "k") {
        event.preventDefault();
        reveal();
      }
    };

    window.addEventListener("keydown", onKeyDown);
    window.addEventListener(OPEN_PALETTE_EVENT, reveal);
    return () => {
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener(OPEN_PALETTE_EVENT, reveal);
    };
  }, []);

  // Keeps the highlighted row in view when arrowing past the fold. Writing
  // `scrollTop` directly rather than calling `scrollIntoView`, which would also
  // scroll the page behind the dialog.
  useEffect(() => {
    const list = listRef.current;
    const row = list?.children[active];
    if (!list || !row) return;

    const top = row.offsetTop;
    const bottom = top + row.offsetHeight;
    if (top < list.scrollTop) list.scrollTop = top;
    else if (bottom > list.scrollTop + list.clientHeight) {
      list.scrollTop = bottom - list.clientHeight;
    }
  }, [active]);

  const go = (item) => {
    if (!item) return;
    setOpen(false);
    router.push(item.href);
  };

  const onInputKeyDown = (event) => {
    if (event.key === "ArrowDown") {
      event.preventDefault();
      setCursor(Math.min(active + 1, matches.length - 1));
      return;
    }
    if (event.key === "ArrowUp") {
      event.preventDefault();
      setCursor(Math.max(active - 1, 0));
      return;
    }
    if (event.key === "Enter") {
      event.preventDefault();
      go(matches[active]);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent size="md" position="top" showClose={false} className="overflow-hidden p-0">
        <DialogTitle className="sr-only">Search or run a command</DialogTitle>

        <div className="flex items-center gap-3 border-b border-line px-4">
          <Search className="size-4 shrink-0 text-dim" />

          <input
            autoFocus
            value={query}
            onChange={(event) => {
              setQuery(event.target.value);
              setCursor(0);
            }}
            onKeyDown={onInputKeyDown}
            placeholder="Search or run a command…"
            aria-label="Search or run a command"
            // A real combobox: the input keeps focus while the arrow keys move
            // a cursor through the list, and `aria-activedescendant` is what
            // tells a screen reader which row that cursor is on.
            role="combobox"
            aria-expanded="true"
            aria-controls="command-results"
            aria-activedescendant={matches[active] ? `command-${matches[active].id}` : undefined}
            className="h-13 min-w-0 flex-1 bg-transparent text-md text-foreground outline-none placeholder:text-dim"
          />

          <Kbd variant="inline">ESC</Kbd>
        </div>

        {matches.length ? (
          <>
            <p className="px-4 pt-3 pb-1 text-2xs tracking-widest text-dim uppercase">Go to</p>

            <div
              ref={listRef}
              id="command-results"
              role="listbox"
              aria-label="Destinations"
              className="max-h-72 overflow-y-auto p-2 pt-1"
            >
              {matches.map((item, index) => {
                const Icon = ICONS[item.icon] ?? FolderClosed;
                const highlighted = index === active;

                return (
                  <div
                    key={item.id}
                    id={`command-${item.id}`}
                    role="option"
                    aria-selected={highlighted}
                    onClick={() => go(item)}
                    onPointerMove={() => setCursor(index)}
                    className={cn(
                      "flex cursor-default items-center gap-2.5 rounded-md px-2.5 py-2 text-base",
                      "transition-colors duration-150 ease-standard",
                      highlighted
                        ? "bg-brand-tint text-foreground ring-1 ring-brand/25 ring-inset"
                        : "text-muted-foreground",
                    )}
                  >
                    <Icon className={cn("size-4 shrink-0", highlighted && "text-brand")} />
                    <span className="min-w-0 flex-1 truncate">{item.label}</span>
                    {highlighted ? <CornerDownLeft className="size-3.5 text-brand" /> : null}
                  </div>
                );
              })}
            </div>
          </>
        ) : (
          <p className="px-4 py-8 text-center text-base text-dim">
            Nothing here matches “{query.trim()}”.
          </p>
        )}

        <div className="flex items-center gap-4 border-t border-line px-4 py-2.5 text-2xs text-dim">
          <span className="flex items-center gap-1.5">
            <Kbd variant="inline">↑</Kbd>
            <Kbd variant="inline">↓</Kbd>
            navigate
          </span>
          <span className="flex items-center gap-1.5">
            <Kbd variant="inline">↵</Kbd>
            open
          </span>
          <span className="ml-auto">Files and actions coming soon</span>
        </div>
      </DialogContent>
    </Dialog>
  );
}
