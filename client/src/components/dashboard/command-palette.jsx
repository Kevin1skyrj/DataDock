"use client";

import {
  ArrowRight,
  BarChart3,
  Clock,
  CornerDownLeft,
  FolderClosed,
  FolderPlus,
  LayoutGrid,
  Moon,
  Palette,
  Search,
  Settings,
  Share2,
  Star,
  Sun,
  Trash2,
  Upload,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useTheme } from "next-themes";
import { useEffect, useMemo, useRef, useState } from "react";

import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Kbd } from "@/components/ui/kbd";
import { FileIcon } from "@/components/workspace/file-icon";
import { ACCENTS } from "@/constants/accents";
import { DASHBOARD_NAV } from "@/constants/dashboard";
import { formatBytes } from "@/lib/format";
import { OPEN_PALETTE_EVENT } from "@/lib/palette-event";
import { useShortcut } from "@/hooks/use-platform";
import { rememberCommand, useRecentCommands } from "@/lib/recent-commands";
import { useWorkspaceCommands } from "@/lib/workspace-commands";
import { quickSearch } from "@/services/files";
import { useAccent } from "@/providers/accent-provider";
import { cn } from "@/lib/utils";

const NAV_ICONS = {
  layout: LayoutGrid,
  folder: FolderClosed,
  clock: Clock,
  star: Star,
  share: Share2,
  trash: Trash2,
  chart: BarChart3,
  settings: Settings,
};

const GROUP_ORDER = ["Recent", "Files", "Actions", "Go to", "Preferences"];

/**
 * The command palette.
 *
 * One field, four kinds of answer: what you did last, files that match, things
 * you can do to what is selected, and places you can go. That mix is what makes
 * this a hub rather than a search box — and it is why matching is over a
 * `keywords` string rather than a label, so "dark" finds the theme toggle and
 * "bin" finds Trash.
 *
 * Three sources feed it and none of them know about each other:
 *
 * - Static commands, defined below.
 * - File results, fetched from the service as you type and debounced, because
 *   this is the one part that is a request rather than a filter.
 * - Workspace actions, published by whatever listing is open. On Settings there
 *   is no workspace, so Rename and Share are simply not offered — a command
 *   that cannot run should not be in the list.
 */
export function CommandPalette() {
  const router = useRouter();
  const { setTheme, resolvedTheme } = useTheme();
  const { setAccent } = useAccent();
  const shortcut = useShortcut("K");

  const workspace = useWorkspaceCommands();
  const recentIds = useRecentCommands();

  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [cursor, setCursor] = useState(0);
  const [files, setFiles] = useState({ key: "", items: [] });
  const listRef = useRef(null);

  /* ------------------------------------------------------ the commands -- */

  const commands = useMemo(() => {
    const list = [];

    list.push({
      id: "upload",
      group: "Actions",
      icon: Upload,
      label: "Upload files",
      keywords: "upload add import new file",
      run: () => router.push("/dashboard/files"),
    });

    if (workspace.handlers) {
      list.push({
        id: "new-folder",
        group: "Actions",
        icon: FolderPlus,
        label: "New folder",
        keywords: "create folder directory new",
        run: () => workspace.handlers.newFolder?.(),
      });
    }

    // Whatever applies to the current selection, named so the list says what it
    // will act on. "Rename" with four files selected would be a lie the
    // registry already knows how to avoid.
    for (const action of workspace.actions) {
      const scope =
        workspace.selection.length === 1
          ? workspace.selection[0].name
          : `${workspace.selection.length} items`;

      list.push({
        id: `action-${action.id}`,
        group: "Actions",
        icon: action.icon,
        label: `${action.label}`,
        hint: scope,
        keywords: `${action.label} ${scope}`,
        run: () => action.run(workspace.selection, workspace.handlers),
      });
    }

    for (const group of DASHBOARD_NAV) {
      for (const item of group.items) {
        list.push({
          id: `go-${item.id}`,
          group: "Go to",
          icon: NAV_ICONS[item.icon] ?? FolderClosed,
          label: item.label,
          keywords: `${item.label} ${group.label} go navigate`,
          run: () => router.push(item.href),
        });
      }
    }

    list.push({
      id: "go-search",
      group: "Go to",
      icon: Search,
      label: "Search",
      keywords: "search find filter query",
      run: () => router.push("/dashboard/search"),
    });

    list.push({
      id: "toggle-theme",
      group: "Preferences",
      icon: resolvedTheme === "dark" ? Sun : Moon,
      label: `Switch to ${resolvedTheme === "dark" ? "light" : "dark"} theme`,
      keywords: "theme dark light appearance toggle",
      run: () => setTheme(resolvedTheme === "dark" ? "light" : "dark"),
    });

    for (const accent of ACCENTS) {
      list.push({
        id: `accent-${accent.id}`,
        group: "Preferences",
        icon: Palette,
        label: `Accent — ${accent.label}`,
        keywords: `accent colour color theme ${accent.label}`,
        swatch: accent.swatch,
        run: () => setAccent(accent.id),
      });
    }

    return list;
  }, [router, setTheme, resolvedTheme, setAccent, workspace]);

  /* --------------------------------------------------------- searching -- */

  const needle = query.trim().toLowerCase();

  // Debounced, because this one is a request. Filtering the static commands is
  // free and happens on every keystroke; asking the service is not.
  useEffect(() => {
    if (!open || needle.length < 2) return undefined;

    const id = window.setTimeout(() => {
      quickSearch(needle).then((items) => setFiles({ key: needle, items }));
    }, 140);

    return () => window.clearTimeout(id);
  }, [open, needle]);

  const results = useMemo(() => {
    const matches = needle
      ? commands.filter((command) => command.keywords.toLowerCase().includes(needle))
      : // Empty field: what you did last, then where you can go. Never nothing.
        [
          ...recentIds
            .map((id) => commands.find((command) => command.id === id))
            .filter(Boolean)
            .map((command) => ({ ...command, group: "Recent" })),
          ...commands.filter((command) => command.group !== "Preferences"),
        ];

    const fileMatches =
      needle.length >= 2 && files.key === needle
        ? files.items.map((item) => ({
            id: `file-${item.id}`,
            group: "Files",
            item,
            label: item.name,
            hint: item.type === "folder" ? "Folder" : formatBytes(item.size),
            run: () =>
              router.push(
                item.type === "folder"
                  ? `/dashboard/files?folder=${encodeURIComponent(item.id)}`
                  : `/dashboard/search?q=${encodeURIComponent(item.name)}`,
              ),
          }))
        : [];

    const all = [...fileMatches, ...matches];

    // De-duplicated, because an empty field lists recents *and* the commands
    // they came from.
    const seen = new Set();
    const unique = all.filter((entry) => {
      const key = `${entry.group}:${entry.id}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });

    return GROUP_ORDER.flatMap((group) => unique.filter((entry) => entry.group === group));
  }, [needle, commands, recentIds, files, router]);

  const active = Math.min(cursor, Math.max(0, results.length - 1));

  /* ------------------------------------------------------------ opening -- */

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

  useEffect(() => {
    const list = listRef.current;
    const row = list?.querySelector(`[data-index="${active}"]`);
    if (!list || !row) return;

    const top = row.offsetTop;
    const bottom = top + row.offsetHeight;
    if (top < list.scrollTop) list.scrollTop = top;
    else if (bottom > list.scrollTop + list.clientHeight) {
      list.scrollTop = bottom - list.clientHeight;
    }
  }, [active]);

  const run = (entry) => {
    if (!entry) return;
    setOpen(false);
    // Files are not commands and should not crowd the recents list.
    if (!entry.id.startsWith("file-")) rememberCommand(entry.id);
    entry.run();
  };

  const onInputKeyDown = (event) => {
    if (event.key === "ArrowDown") {
      event.preventDefault();
      setCursor(Math.min(active + 1, results.length - 1));
      return;
    }
    if (event.key === "ArrowUp") {
      event.preventDefault();
      setCursor(Math.max(active - 1, 0));
      return;
    }
    if (event.key === "Tab" && results[active]) {
      // Tab completes rather than moving focus — the field is the only thing
      // focusable here, so the browser's default would leave the palette.
      event.preventDefault();
      setQuery(results[active].label);
      return;
    }
    if (event.key === "Enter") {
      event.preventDefault();
      run(results[active]);
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
            placeholder="Search files, run a command, jump anywhere…"
            aria-label="Search or run a command"
            role="combobox"
            aria-expanded="true"
            aria-controls="command-results"
            aria-activedescendant={results[active] ? `command-${results[active].id}` : undefined}
            className="h-13 min-w-0 flex-1 bg-transparent text-md text-foreground outline-none placeholder:text-dim"
          />

          <Kbd variant="inline">ESC</Kbd>
        </div>

        {results.length ? (
          <div
            ref={listRef}
            id="command-results"
            role="listbox"
            aria-label="Commands"
            className="max-h-80 overflow-y-auto p-2"
          >
            {results.map((entry, index) => {
              // Derived from the previous entry rather than a variable carried
              // across the loop — the list is already grouped, so the neighbour
              // is the only thing that needs consulting, and nothing mutates
              // during render.
              const heading =
                index === 0 || results[index - 1].group !== entry.group ? entry.group : null;
              const highlighted = index === active;

              return (
                <div key={`${entry.group}-${entry.id}`}>
                  {heading ? (
                    <p className="px-2.5 pt-2 pb-1 text-2xs tracking-widest text-dim uppercase">
                      {heading}
                    </p>
                  ) : null}

                  <div
                    id={`command-${entry.id}`}
                    data-index={index}
                    role="option"
                    aria-selected={highlighted}
                    onClick={() => run(entry)}
                    onPointerMove={() => setCursor(index)}
                    className={cn(
                      "flex cursor-default items-center gap-2.5 rounded-md px-2.5 py-2 text-base",
                      "transition-colors duration-150 ease-standard",
                      highlighted
                        ? "bg-brand-tint text-foreground ring-1 ring-brand/25 ring-inset"
                        : "text-muted-foreground",
                    )}
                  >
                    {entry.item ? (
                      <FileIcon kind={entry.item.kind} selected={highlighted} />
                    ) : entry.swatch ? (
                      <span
                        aria-hidden="true"
                        className="size-3.5 shrink-0 rounded-full ring-1 ring-line-2"
                        style={{ background: entry.swatch }}
                      />
                    ) : (
                      <entry.icon
                        className={cn("size-4 shrink-0", highlighted ? "text-brand" : "text-dim")}
                      />
                    )}

                    <span className="min-w-0 flex-1 truncate">{entry.label}</span>

                    {entry.hint ? (
                      <span className="shrink-0 truncate text-xs text-dim">{entry.hint}</span>
                    ) : null}

                    {highlighted ? (
                      <CornerDownLeft className="size-3.5 shrink-0 text-brand" />
                    ) : null}
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="flex flex-col items-center gap-2 px-4 py-10 text-center">
            <p className="text-base text-muted-foreground">
              Nothing matches “{query.trim()}”.
            </p>
            <button
              type="button"
              onClick={() => {
                setOpen(false);
                router.push(`/dashboard/search?q=${encodeURIComponent(query.trim())}`);
              }}
              className="flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-base text-brand transition-colors duration-150 ease-standard hover:bg-brand-tint"
            >
              Search everything
              <ArrowRight className="size-3.5" />
            </button>
          </div>
        )}

        <div className="flex items-center gap-4 border-t border-line px-4 py-2.5 text-2xs text-dim">
          <span className="flex items-center gap-1.5">
            <Kbd variant="inline">↑</Kbd>
            <Kbd variant="inline">↓</Kbd>
            navigate
          </span>
          <span className="flex items-center gap-1.5">
            <Kbd variant="inline">↵</Kbd>
            run
          </span>
          <span className="flex items-center gap-1.5">
            <Kbd variant="inline">⇥</Kbd>
            complete
          </span>
          <span className="ml-auto">{shortcut}</span>
        </div>
      </DialogContent>
    </Dialog>
  );
}
