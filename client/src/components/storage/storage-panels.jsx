"use client";

import {
  ArrowRight,
  Copy,
  FolderX,
  HardDrive,
  Share2,
  Sparkles,
  Trash2,
  Upload,
  Pencil,
} from "lucide-react";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import { FileIcon } from "@/components/workspace/file-icon";
import { FILE_KINDS } from "@/constants/file-kinds";
import { formatBytes, formatCount, formatDate } from "@/lib/format";
import { cn } from "@/lib/utils";

/**
 * The storage page's parts.
 *
 * All presentational — every number arrives already computed from the service,
 * because each of these is an aggregate a database should be answering rather
 * than something assembled in the browser from a listing it had to download.
 */

export function Panel({ title, action, children, className }) {
  return (
    <section
      className={cn(
        "flex min-w-0 flex-col rounded-xl border border-line bg-overlay",
        className,
      )}
    >
      <header className="flex h-12 shrink-0 items-center gap-3 border-b border-line px-4">
        <h2 className="min-w-0 flex-1 truncate text-md font-medium text-foreground">{title}</h2>
        {action}
      </header>
      <div className="min-h-0 flex-1">{children}</div>
    </section>
  );
}

export function PanelSkeleton({ rows = 4 }) {
  return (
    <div aria-hidden="true" className="flex flex-col gap-2.5 p-4">
      {Array.from({ length: rows }, (_, index) => (
        <div
          key={index}
          className="h-4 rounded-full bg-surface-2"
          style={{ width: `${45 + ((index * 19) % 45)}%` }}
        />
      ))}
    </div>
  );
}

/* -------------------------------------------------------------- overview -- */

export function StorageOverview({ summary }) {
  const usedPercent = (summary.used / summary.quota) * 100;
  const trashPercent = (summary.trashed / summary.quota) * 100;

  return (
    <div className="flex flex-col gap-5 p-5">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div className="flex flex-col gap-1">
          <p className="text-display-sm font-semibold tracking-tight text-foreground">
            {formatBytes(summary.used)}
            <span className="ml-2 text-xl font-normal text-dim">
              of {formatBytes(summary.quota)}
            </span>
          </p>
          <p className="text-base text-muted-foreground">
            {formatBytes(summary.available)} available ·{" "}
            {formatCount(summary.fileCount, "file")} ·{" "}
            {formatCount(summary.folderCount, "folder")}
          </p>
        </div>

        <div className="flex items-center gap-3">
          <span className="rounded-md bg-brand-tint px-2.5 py-1 text-base font-medium text-brand ring-1 ring-brand/25 ring-inset">
            {summary.plan.name}
          </span>
          <Button variant="secondary" size="sm" render={<Link href="/dashboard/settings/billing" />}>
            Change plan
          </Button>
        </div>
      </div>

      {/* Trash is drawn as part of the bar rather than left out of it. Space the
          bin is holding is space you do not have, and a meter that says
          otherwise is why nobody can find their missing gigabytes. */}
      <div className="flex h-2.5 overflow-hidden rounded-full bg-surface-2">
        <div
          className="bg-brand transition-[width] duration-300 ease-standard"
          style={{ width: `${usedPercent}%` }}
          title={`Files — ${formatBytes(summary.used)}`}
        />
        <div
          className="bg-brand/30 transition-[width] duration-300 ease-standard"
          style={{ width: `${trashPercent}%` }}
          title={`Trash — ${formatBytes(summary.trashed)}`}
        />
      </div>

      <div className="flex flex-wrap items-center gap-x-5 gap-y-2 text-sm">
        <Legend tone="bg-brand" label="Files" value={formatBytes(summary.used)} />
        <Legend tone="bg-brand/30" label="Trash" value={formatBytes(summary.trashed)} />
        <Legend tone="bg-surface-2" label="Free" value={formatBytes(summary.available)} />
        <span className="ml-auto font-mono text-dim tabular-nums">
          {usedPercent.toFixed(1)}% used
        </span>
      </div>
    </div>
  );
}

function Legend({ tone, label, value }) {
  return (
    <span className="flex items-center gap-2">
      <span aria-hidden="true" className={cn("size-2.5 rounded-full", tone)} />
      <span className="text-muted-foreground">{label}</span>
      <span className="font-mono text-dim tabular-nums">{value}</span>
    </span>
  );
}

/* ------------------------------------------------------------- breakdown -- */

/**
 * One family of tints rather than six unrelated hues.
 *
 * The design system has an accent and three status colours, and none of the
 * three mean "video". Borrowing them would say a category succeeded or failed.
 * Ordering by opacity reads as one measurement split into parts, which is what
 * it is — and the legend carries the number, so colour is never the only thing
 * distinguishing a row.
 */
const SHADES = ["bg-brand", "bg-brand/72", "bg-brand/54", "bg-brand/40", "bg-brand/28", "bg-brand/18"];

export function StorageBreakdown({ breakdown }) {
  const total = breakdown.reduce((sum, slice) => sum + slice.bytes, 0);
  if (total === 0) {
    return <p className="p-5 text-base text-dim">Nothing stored yet.</p>;
  }

  return (
    <div className="flex flex-col gap-4 p-5">
      <div
        role="img"
        aria-label={breakdown
          .map((slice) => `${FILE_KINDS[slice.kind]?.label ?? slice.kind}: ${formatBytes(slice.bytes)}`)
          .join(", ")}
        className="flex h-3 overflow-hidden rounded-full bg-surface-2"
      >
        {breakdown.map((slice, index) => (
          <div
            key={slice.kind}
            className={cn(SHADES[index] ?? SHADES.at(-1), "transition-[width] duration-300 ease-standard")}
            style={{ width: `${(slice.bytes / total) * 100}%` }}
            title={`${FILE_KINDS[slice.kind]?.label ?? slice.kind} — ${formatBytes(slice.bytes)}`}
          />
        ))}
      </div>

      <ul className="flex flex-col gap-2.5">
        {breakdown.map((slice, index) => (
          <li key={slice.kind} className="flex items-center gap-3 text-base">
            <span
              aria-hidden="true"
              className={cn("size-2.5 shrink-0 rounded-full", SHADES[index] ?? SHADES.at(-1))}
            />
            <FileIcon kind={slice.kind} />
            <span className="min-w-0 flex-1 truncate text-muted-foreground">
              {FILE_KINDS[slice.kind]?.label ?? slice.kind}
            </span>
            <span className="shrink-0 text-xs text-dim">{formatCount(slice.count, "file")}</span>
            <span className="w-20 shrink-0 text-right font-mono text-xs text-foreground tabular-nums">
              {formatBytes(slice.bytes)}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}

/* ----------------------------------------------------------- large files -- */

export function LargestFiles({ files, onPreview, onShare, onTrash }) {
  if (!files.length) return <p className="p-5 text-base text-dim">No files yet.</p>;

  const biggest = files[0]?.size ?? 1;

  return (
    <ul className="flex flex-col p-1.5">
      {files.map((file) => (
        <li
          key={file.id}
          className="group relative flex items-center gap-2.5 rounded-md px-2.5 py-2 transition-colors duration-150 ease-standard hover:bg-surface"
        >
          <FileIcon kind={file.kind} />

          <div className="flex min-w-0 flex-1 flex-col gap-1">
            <span className="truncate text-base text-foreground" title={file.name}>
              {file.name}
            </span>
            {/* Relative to the largest, so the column reads as a comparison
                rather than as a set of numbers to be mentally divided. */}
            <div className="h-1 overflow-hidden rounded-full bg-surface-2">
              <div
                className="h-full origin-left rounded-full bg-brand/60"
                style={{ transform: `scaleX(${file.size / biggest})` }}
              />
            </div>
          </div>

          <span className="shrink-0 font-mono text-xs text-dim tabular-nums">
            {formatBytes(file.size)}
          </span>

          <span className="flex shrink-0 items-center opacity-0 transition-opacity duration-150 ease-standard group-hover:opacity-100 group-focus-within:opacity-100">
            <Button variant="ghost" size="icon-sm" aria-label={`Preview ${file.name}`} onClick={() => onPreview(file)}>
              <ArrowRight className="size-3.5" />
            </Button>
            <Button variant="ghost" size="icon-sm" aria-label={`Share ${file.name}`} onClick={() => onShare(file)}>
              <Share2 className="size-3.5" />
            </Button>
            <Button variant="ghost" size="icon-sm" aria-label={`Move ${file.name} to trash`} onClick={() => onTrash(file)}>
              <Trash2 className="size-3.5" />
            </Button>
          </span>
        </li>
      ))}
    </ul>
  );
}

/* -------------------------------------------------------------- activity -- */

const ACTIVITY = {
  uploaded: { Icon: Upload, label: "Uploaded" },
  created: { Icon: FolderX, label: "Created" },
  modified: { Icon: Pencil, label: "Modified" },
  shared: { Icon: Share2, label: "Shared" },
  deleted: { Icon: Trash2, label: "Moved to trash" },
};

export function StorageActivity({ events }) {
  if (!events.length) return <p className="p-5 text-base text-dim">Nothing has happened yet.</p>;

  return (
    <ol className="flex flex-col p-1.5">
      {events.map((event) => {
        const { Icon, label } = ACTIVITY[event.type] ?? ACTIVITY.modified;

        return (
          <li key={event.id} className="flex items-center gap-3 rounded-md px-2.5 py-2">
            <span
              className={cn(
                "grid size-7 shrink-0 place-items-center rounded-md",
                event.type === "deleted" ? "bg-error/12 text-error" : "bg-surface-2 text-dim",
              )}
            >
              <Icon className="size-3.5" />
            </span>

            <span className="flex min-w-0 flex-1 flex-col">
              <span className="truncate text-base text-foreground">{event.item.name}</span>
              <span className="truncate text-xs text-dim">{label}</span>
            </span>

            <span className="shrink-0 text-xs text-dim">{formatDate(event.at)}</span>
          </li>
        );
      })}
    </ol>
  );
}

/* ------------------------------------------------------------- cleanup -- */

const CLEANUP_ICON = {
  "large-unused": HardDrive,
  duplicates: Copy,
  "old-trash": Trash2,
  "empty-folders": FolderX,
};

/**
 * The assistant, not the warning.
 *
 * Each entry names something specific, says what it would give back, and links
 * to the files so the decision is yours. A storage page that opens with a red
 * bar and the word "full" is a page people close.
 */
export function CleanupSuggestions({ suggestions, onReview }) {
  if (!suggestions.length) {
    return (
      <div className="flex flex-col items-center gap-3 p-8 text-center">
        <span className="grid size-10 place-items-center rounded-xl bg-brand-tint text-brand">
          <Sparkles className="size-4" />
        </span>
        <p className="text-base text-muted-foreground">
          Nothing to tidy. The drive is in good shape.
        </p>
      </div>
    );
  }

  return (
    <ul className="flex flex-col gap-2 p-3">
      {suggestions.map((suggestion) => {
        const Icon = CLEANUP_ICON[suggestion.id] ?? Sparkles;

        return (
          <li
            key={suggestion.id}
            className="flex items-start gap-3 rounded-lg border border-line bg-surface p-3"
          >
            <span className="grid size-8 shrink-0 place-items-center rounded-md bg-brand-tint text-brand">
              <Icon className="size-4" />
            </span>

            <div className="flex min-w-0 flex-1 flex-col gap-0.5">
              <p className="text-base font-medium text-foreground">{suggestion.title}</p>
              <p className="text-sm text-dim">{suggestion.body}</p>
              <p className="mt-1 text-sm text-muted-foreground">
                {formatCount(suggestion.items.length, "item")}
                {suggestion.reclaimable > 0
                  ? ` · frees ${formatBytes(suggestion.reclaimable)}`
                  : null}
              </p>
            </div>

            <Button
              variant="secondary"
              size="sm"
              className="shrink-0"
              onClick={() => onReview(suggestion)}
            >
              Review
            </Button>
          </li>
        );
      })}
    </ul>
  );
}
