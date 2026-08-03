"use client";

import {
  BarChart3,
  Braces,
  Clock,
  Download,
  FileText,
  FolderClosed,
  Image as ImageIcon,
  LayoutGrid,
  Settings,
  Share2,
  Star,
  Trash2,
  Video,
} from "lucide-react";

import { Kbd } from "@/components/ui/kbd";
import { PREVIEW_NAV, PREVIEW_STORAGE } from "@/constants/preview-data";
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

const FILE_ICONS = {
  pdf: FileText,
  image: ImageIcon,
  video: Video,
  code: Braces,
  doc: FileText,
};

/* -------------------------------------------------------------- sidebar -- */

export function PreviewSidebar({ storage }) {
  return (
    <aside className="hidden min-w-0 flex-col justify-between border-r border-line/70 p-3.5 lg:flex xl:p-4">
      <div className="flex flex-col gap-5">
        {PREVIEW_NAV.map((group) => (
          <div key={group.label} className="flex flex-col gap-0.5">
            <p
              data-preview="item"
              className="px-2.5 pb-1.5 text-xs tracking-widest text-dim uppercase"
            >
              {group.label}
            </p>

            {group.items.map((item) => {
              const Icon = NAV_ICONS[item.icon];
              return (
                <div
                  key={item.id}
                  data-preview="item"
                  className={cn(
                    "flex items-center gap-2.5 rounded-md px-2.5 py-2 text-sm transition-colors duration-200 ease-standard",
                    // Selection and hover both read in the live accent, so the
                    // preview responds to the palette switch rather than
                    // staying a neutral grey regardless of it.
                    item.active
                      ? "bg-brand-tint text-foreground ring-1 ring-brand/25 ring-inset"
                      : "text-muted-foreground hover:bg-brand-tint/55 hover:text-foreground",
                  )}
                >
                  <Icon className={cn("size-4 shrink-0", item.active && "text-brand")} />
                  <span className="flex-1 truncate">{item.label}</span>
                  {item.count ? <span className="text-xs text-dim">{item.count}</span> : null}
                </div>
              );
            })}
          </div>
        ))}
      </div>

      <StorageMeter value={storage} />
    </aside>
  );
}

/**
 * Mounted twice on purpose — in the sidebar above `lg`, and inline under the
 * file list below it, where there is no sidebar to hold it. One component, two
 * slots, so the storage beat in the entrance has something to animate at every
 * width rather than playing to an empty room on phones.
 *
 * By default it renders empty and waits to be filled: the hero's timeline finds
 * it through `data-storage-*` and counts it up. Pass `value` where there is no
 * timeline — the authentication backdrop, say — and it renders at rest instead,
 * dropping the animator's hooks so nothing can later claim it.
 */
export function StorageMeter({ className, value }) {
  const atRest = value != null;

  return (
    <div
      data-preview="item"
      className={cn("rounded-lg border border-line/70 bg-surface p-3.5", className)}
    >
      <div className="flex items-center justify-between text-xs">
        <span className="text-muted-foreground">Storage</span>
        <span data-storage-pct={atRest ? undefined : ""} className="font-mono text-brand">
          {atRest ? `${Math.round(value)}%` : "0%"}
        </span>
      </div>

      <div className="mt-2.5 h-2 overflow-hidden rounded-full bg-surface-2">
        {/* scaleX rather than width: the design animates width for 1.5s, which
            is layout on every frame. This composites on the GPU instead. */}
        <div
          data-storage-bar={atRest ? undefined : ""}
          className="h-full origin-left rounded-full bg-brand"
          style={{ transform: `scaleX(${atRest ? value / 100 : 0})` }}
        />
      </div>

      <p data-storage-label className="mt-2.5 text-xs text-dim">
        {PREVIEW_STORAGE.used} of {PREVIEW_STORAGE.total} used
      </p>
    </div>
  );
}

/* ---------------------------------------------------------------- files -- */

export function PreviewFileRow({ file, active, dimmed, onActivate }) {
  const Icon = FILE_ICONS[file.kind] ?? FileText;

  return (
    <button
      type="button"
      data-preview="row"
      onMouseEnter={onActivate}
      onFocus={onActivate}
      className={cn(
        "relative grid w-full grid-cols-[minmax(0,1fr)_76px] items-center gap-3 rounded-md px-2.5 py-2.5 text-left",
        "transition-[background-color,opacity,transform] duration-220 ease-standard",
        // The Shared column defers to xl now that the details panel appears at
        // lg: three panes plus four columns is more than 1024px can carry.
        "sm:grid-cols-[minmax(0,1fr)_84px_108px] sm:py-3 xl:grid-cols-[minmax(0,1fr)_84px_108px_64px]",
        // The selected row is the hovered row — hover just sets `active`. Both
        // land in the live accent so the table answers the palette switch;
        // the CSS hover is the fallback before state commits, and for touch.
        active
          ? "bg-brand-tint ring-1 ring-brand/25 ring-inset"
          : "hover:bg-brand-tint/55",
        dimmed && "opacity-25",
      )}
    >
      {/* A rail in the accent, so the selection is legible without leaning on
          a fill light enough to disappear on a bright display. */}
      <span
        aria-hidden="true"
        className={cn(
          "absolute inset-y-1.5 left-0 w-0.5 rounded-full bg-brand transition-opacity duration-220 ease-standard",
          active ? "opacity-100" : "opacity-0",
        )}
      />

      <span className="flex min-w-0 items-center gap-2.5">
        <Icon className={cn("size-4 shrink-0", active ? "text-brand" : "text-dim")} />
        <span className="truncate text-sm text-foreground">{file.name}</span>
      </span>

      <span className="text-right font-mono text-xs text-dim sm:text-left">{file.size}</span>
      <span className="hidden text-xs text-dim sm:block">{file.modified}</span>
      <span className="hidden text-xs xl:block">
        {file.shared ? <span className="text-brand">{file.shared}</span> : <span className="text-dim">—</span>}
      </span>
    </button>
  );
}

export function PreviewFileHeader() {
  return (
    <div
      data-preview="item"
      className={cn(
        "grid grid-cols-[minmax(0,1fr)_76px] gap-3 border-b border-line/70 px-2.5 pb-2.5 text-xs tracking-wide text-dim uppercase",
        "sm:grid-cols-[minmax(0,1fr)_84px_108px] xl:grid-cols-[minmax(0,1fr)_84px_108px_64px]",
      )}
    >
      <span>Name</span>
      <span className="text-right sm:text-left">Size</span>
      <span className="hidden sm:block">Modified</span>
      <span className="hidden xl:block">Shared</span>
    </div>
  );
}

/* -------------------------------------------------------------- details -- */

export function PreviewDetails({ file }) {
  const Icon = FILE_ICONS[file.kind] ?? FileText;

  return (
    // Visible from lg, not xl. This panel is the preview's proof that the
    // product is alive — hovering a row moves it — so it is the last thing that
    // should be dropped as the frame narrows, not the first.
    <aside className="hidden min-w-0 flex-col gap-4 border-l border-line/70 p-4 lg:flex xl:gap-5 xl:p-5">
      <p className="text-xs tracking-widest text-dim uppercase">Details</p>

      <div className="flex aspect-4/3 items-center justify-center rounded-lg border border-line/70 bg-surface">
        <Icon className="size-8 text-dim xl:size-9" />
      </div>

      <div className="flex flex-col gap-1">
        {/* Keyed on the file so the panel cross-fades as the selection moves,
            rather than swapping text abruptly. */}
        <p key={`${file.id}-name`} className="animate-[dd-detail_260ms_ease-out] truncate text-sm font-medium text-foreground">
          {file.name}
        </p>
        <p key={`${file.id}-meta`} className="animate-[dd-detail_260ms_ease-out] text-xs text-dim">
          {file.meta}
        </p>
      </div>

      <dl key={`${file.id}-fields`} className="flex animate-[dd-detail_260ms_ease-out] flex-col gap-2.5 text-xs">
        {[
          ["Modified", file.modified],
          ["Owner", file.owner],
          ["Shared link", file.link],
          ["Expires", file.expires],
        ].map(([label, value]) => (
          <div key={label} className="flex items-center justify-between gap-3">
            <dt className="text-dim">{label}</dt>
            <dd
              className={cn(
                "truncate text-muted-foreground",
                value === "Active" && "text-success",
              )}
            >
              {value}
            </dd>
          </div>
        ))}
      </dl>

      <div className="mt-auto flex gap-2">
        {[
          ["Download", Download],
          ["Share", Share2],
        ].map(([label, Glyph]) => (
          <span
            key={label}
            className="flex flex-1 items-center justify-center gap-1.5 rounded-md border border-line/70 bg-surface py-2 text-xs text-muted-foreground"
          >
            <Glyph className="size-3.5" />
            {label}
          </span>
        ))}
      </div>
    </aside>
  );
}

/* --------------------------------------------------------------- chrome -- */

export function PreviewChrome() {
  return (
    <div
      data-preview="item"
      className="flex items-center gap-3.5 border-b border-line/70 px-4 py-3"
    >
      <span className="flex gap-2">
        {["bg-error/50", "bg-warning/50", "bg-success/50"].map((tone) => (
          <span key={tone} className={cn("size-3 rounded-full", tone)} />
        ))}
      </span>

      <span className="hidden items-center gap-1.5 sm:flex">
        <span className="rounded-md bg-brand-tint px-2.5 py-1.5 text-xs text-foreground ring-1 ring-brand/25 ring-inset">
          Client work
        </span>
        <span className="rounded-md px-2.5 py-1.5 text-xs text-dim transition-colors duration-200 ease-standard hover:bg-brand-tint/55 hover:text-foreground">
          Invoices 2026
        </span>
      </span>

      <span className="ml-auto flex items-center gap-2 rounded-md border border-line/70 bg-surface px-3 py-1.5">
        <span className="font-mono text-xs text-dim">datadock.app</span>
        <Kbd variant="bare" className="text-dim">
          ⌘K
        </Kbd>
      </span>
    </div>
  );
}
