"use client";

import {
  CheckCircle2,
  ChevronDown,
  CircleAlert,
  RotateCcw,
  Upload,
  X,
} from "lucide-react";
import { useEffect, useState } from "react";

import { FileIcon } from "@/components/workspace/file-icon";
import { Button } from "@/components/ui/button";
import { kindOf } from "@/constants/file-kinds";
import { formatBytes } from "@/lib/format";
import {
  cancel,
  clearAll,
  clearFinished,
  retry,
  retryAll,
  summarise,
  useUploads,
} from "@/lib/upload-store";
import { cn } from "@/lib/utils";

const SUCCESS_DISMISS_MS = 4000;

/**
 * The upload manager.
 *
 * A background task, deliberately shaped like one: docked bottom-right, above
 * everything, and never modal. Uploads are something you start and then stop
 * thinking about, so nothing here blocks the workspace and nothing demands to
 * be dismissed before you can carry on.
 *
 * It is mounted in the shell rather than the workspace, which is what lets a
 * folder of two hundred photos keep uploading while you browse into Settings.
 * The queue itself lives in a module store for the same reason.
 *
 * Each file owns one progress bar and one combined bytes-and-percentage readout.
 * That keeps a multi-file queue understandable without repeating the same
 * progress in a second aggregate bar above it.
 */
export function UploadManager() {
  const uploads = useUploads();
  const [collapsed, setCollapsed] = useState(false);
  const { active, queued, failed, done, inFlight } = summarise(uploads);

  const busy = inFlight > 0;

  useEffect(() => {
    if (busy || done.length === 0) return undefined;

    const timeout = window.setTimeout(clearFinished, SUCCESS_DISMISS_MS);
    return () => window.clearTimeout(timeout);
  }, [busy, done.length]);

  if (uploads.length === 0) return null;

  const heading = busy
    ? `Uploading ${inFlight} ${inFlight === 1 ? "file" : "files"}`
    : failed.length
      ? `${failed.length} failed`
      : `${done.length} uploaded`;

  return (
    <section
      aria-label="Uploads"
      className={cn(
        "fixed right-4 bottom-4 z-90 w-[min(23rem,calc(100vw-2rem))]",
        "overflow-hidden rounded-xl border border-line-2 bg-overlay shadow-elevated",
        "motion-safe:animate-[dd-detail_180ms_var(--ease-standard)]",
      )}
    >
      <header className="flex h-11 items-center gap-2 border-b border-line pr-1.5 pl-3.5">
        {busy ? (
          <Upload data-motion="loop" className="size-3.5 shrink-0 animate-pulse text-brand" />
        ) : failed.length ? (
          <CircleAlert className="size-3.5 shrink-0 text-error" />
        ) : (
          <CheckCircle2 className="size-3.5 shrink-0 text-success" />
        )}

        <p aria-live="polite" className="min-w-0 flex-1 truncate text-base text-foreground">
          {heading}
        </p>

        {failed.length && !busy ? (
          <Button variant="ghost" size="sm" onClick={retryAll}>
            <RotateCcw className="size-3.5" />
            Retry
          </Button>
        ) : null}

        <Button
          variant="ghost"
          size="icon-sm"
          aria-expanded={!collapsed}
          aria-label={collapsed ? "Expand uploads" : "Collapse uploads"}
          onClick={() => setCollapsed((current) => !current)}
        >
          <ChevronDown
            className={cn(
              "transition-[rotate] duration-200 ease-standard",
              collapsed && "rotate-180",
            )}
          />
        </Button>

        <Button variant="ghost" size="icon-sm" aria-label="Dismiss uploads" onClick={clearAll}>
          <X />
        </Button>
      </header>

      {/* Collapsed with `grid-template-rows` rather than by unmounting, so the
          panel folds smoothly and the list keeps its scroll position. */}
      <div
        className={cn(
          "grid transition-[grid-template-rows] duration-200 ease-standard",
          collapsed ? "grid-rows-[0fr]" : "grid-rows-[1fr]",
        )}
      >
        <div className="min-h-0 overflow-hidden">
          <ul className="max-h-64 overflow-y-auto p-1.5">
            {[...active, ...queued, ...failed, ...done].map((item) => (
              <UploadRow key={item.id} item={item} />
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}

function UploadRow({ item }) {
  const percent = item.size > 0 ? Math.min(100, (item.loaded / item.size) * 100) : 0;
  const folder = item.path.length ? item.path.join(" / ") : null;

  return (
    <li className="group relative flex items-center gap-2.5 rounded-md px-2 py-1.5">
      <FileIcon kind={kindOf(item.mimeType)} />

      <div className="flex min-w-0 flex-1 flex-col gap-1">
        <div className="flex items-baseline gap-2">
          <span className="min-w-0 flex-1 truncate text-base text-foreground" title={item.name}>
            {item.name}
          </span>
          <span className="shrink-0 font-mono text-2xs text-dim tabular-nums">
            {item.status === "uploading"
              ? `${formatBytes(item.loaded)} / ${formatBytes(item.size)} · ${Math.round(percent)}%`
              : formatBytes(item.size)}
          </span>
        </div>

        {/* The folder an upload is going into, when it is not this one. Two
            hundred photos all called `IMG_0042.jpg` are indistinguishable
            without it. */}
        {folder ? <p className="truncate text-2xs text-dim">{folder}</p> : null}

        {item.status === "uploading" || item.status === "queued" ? (
          <div
            role="progressbar"
            aria-label={`Uploading ${item.name}`}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={Math.round(percent)}
            className="h-1 overflow-hidden rounded-full bg-surface-2"
          >
            <div
              className="h-full origin-left rounded-full bg-brand transition-transform duration-200 ease-standard"
              style={{ transform: `scaleX(${percent / 100})` }}
            />
          </div>
        ) : null}

        {item.error ? (
          <p className="truncate text-2xs text-error" title={item.error}>
            {item.error}
          </p>
        ) : null}
      </div>

      <div className="flex shrink-0 items-center gap-0.5">
        {item.status === "done" ? (
          <CheckCircle2 className="size-3.5 text-success" aria-label="Uploaded" />
        ) : null}

        {item.status === "failed" ? (
          <Button
            variant="ghost"
            size="icon-sm"
            aria-label={`Retry ${item.name}`}
            onClick={() => retry(item.id)}
          >
            <RotateCcw className="size-3.5" />
          </Button>
        ) : null}

        {item.status === "uploading" || item.status === "queued" ? (
          <Button
            variant="ghost"
            size="icon-sm"
            aria-label={`Cancel ${item.name}`}
            onClick={() => cancel(item.id)}
          >
            <X className="size-3.5" />
          </Button>
        ) : null}

        {item.status === "cancelled" ? (
          <span className="text-2xs text-dim">Cancelled</span>
        ) : null}
      </div>
    </li>
  );
}
