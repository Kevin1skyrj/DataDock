"use client";

import { ChevronLeft, ChevronRight, Info, X } from "lucide-react";
import { useEffect, useState } from "react";

import { PREVIEW_RENDERERS } from "@/components/preview/preview-renderers";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Kbd } from "@/components/ui/kbd";
import { FileIcon } from "@/components/workspace/file-icon";
import { formatBytes, formatDate, formatDateFull } from "@/lib/format";
import { getPreview } from "@/services/files";
import { cn } from "@/lib/utils";

/**
 * Quick Look.
 *
 * Space opens it, Space closes it, and the arrow keys walk the listing without
 * closing anything — which is the whole reason Finder's version is the feature
 * people miss most on the web. It is a viewer, not a destination: nothing here
 * navigates, and everything it can do comes from the action registry the
 * context menu and the toolbar already share.
 *
 * `items` is the listing it was opened from, so Previous and Next follow the
 * order on screen — the sort you chose, the filter you applied. A preview that
 * walked the folder in its own order would be a different listing wearing this
 * one's clothes.
 */
export function PreviewDialog({ open, items, index, actions, onClose, onIndex }) {
  const item = items[index] ?? null;
  const [preview, setPreview] = useState(null);
  const [showInfo, setShowInfo] = useState(true);

  // Tagged with the file it describes, so a slow preview cannot land over a
  // file you have already arrowed past — the same rule the listing follows.
  const loading = preview?.id !== item?.id;

  useEffect(() => {
    if (!open || !item) return undefined;
    let cancelled = false;
    getPreview(item)
      .then((result) => {
        if (!cancelled) setPreview({ id: item.id, ...result });
      })
      .catch(() => {
        if (!cancelled) {
          setPreview({
            id: item.id,
            kind: "unsupported",
            reason: "The preview could not be loaded.",
          });
        }
      });
    return () => {
      cancelled = true;
    };
  }, [open, item]);

  useEffect(() => {
    if (!open) return undefined;

    const onKeyDown = (event) => {
      // Space is what opened this, so Space closes it. Anything else would make
      // the gesture one-way and send people hunting for the exit.
      if (event.key === " ") {
        event.preventDefault();
        onClose();
        return;
      }
      if (event.key === "ArrowRight") {
        event.preventDefault();
        onIndex(Math.min(index + 1, items.length - 1));
        return;
      }
      if (event.key === "ArrowLeft") {
        event.preventDefault();
        onIndex(Math.max(index - 1, 0));
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open, index, items.length, onClose, onIndex]);

  if (!item) return null;

  const Renderer = PREVIEW_RENDERERS[preview?.kind] ?? PREVIEW_RENDERERS.unsupported;

  return (
    <Dialog open={open} onOpenChange={(next) => (next ? null : onClose())}>
      <DialogContent
        size="lg"
        showClose={false}
        className="flex h-[min(46rem,calc(100dvh-3rem))] max-w-[min(72rem,calc(100vw-3rem))] flex-col overflow-hidden p-0"
      >
        <DialogTitle className="sr-only">{item.name}</DialogTitle>

        <header className="flex h-13 shrink-0 items-center gap-3 border-b border-line px-3">
          <FileIcon kind={item.kind} />

          <div className="flex min-w-0 flex-1 items-baseline gap-2">
            <span className="truncate text-md text-foreground">{item.name}</span>
            <span className="shrink-0 font-mono text-xs text-dim">
              {formatBytes(item.size)}
            </span>
          </div>

          <span className="hidden shrink-0 text-xs text-dim sm:inline">
            {index + 1} of {items.length}
          </span>

          <div className="flex shrink-0 items-center">
            <Button
              variant="ghost"
              size="icon-sm"
              aria-label="Previous file"
              disabled={index === 0}
              onClick={() => onIndex(index - 1)}
            >
              <ChevronLeft />
            </Button>
            <Button
              variant="ghost"
              size="icon-sm"
              aria-label="Next file"
              disabled={index === items.length - 1}
              onClick={() => onIndex(index + 1)}
            >
              <ChevronRight />
            </Button>
          </div>

          <Button
            variant="ghost"
            size="icon-sm"
            aria-label="Details"
            aria-pressed={showInfo}
            onClick={() => setShowInfo((current) => !current)}
            className={cn("hidden lg:inline-flex", showInfo && "bg-surface-2 text-foreground")}
          >
            <Info />
          </Button>

          <Button variant="ghost" size="icon-sm" aria-label="Close preview" onClick={onClose}>
            <X />
          </Button>
        </header>

        <div className="flex min-h-0 flex-1">
          <div className="relative min-w-0 flex-1">
            {loading ? (
              <div aria-hidden="true" className="grid h-full place-items-center bg-bg-deep">
                <div className="h-40 w-64 rounded-lg bg-surface-2" />
              </div>
            ) : (
              <Renderer preview={preview} item={item} />
            )}
          </div>

          {showInfo ? (
            <aside
              aria-label="File details"
              className="hidden w-64 shrink-0 flex-col overflow-y-auto border-l border-line p-4 lg:flex"
            >
              <dl className="flex flex-col divide-y divide-line/60 text-sm">
                {[
                  ["Kind", item.mimeType?.split("/").at(-1)?.toUpperCase() ?? "—"],
                  ["Size", formatBytes(item.size)],
                  ["Modified", formatDate(item.updatedAt)],
                  ["Created", formatDate(item.createdAt)],
                  ["Opened", formatDate(item.openedAt)],
                  ["Shared", item.share ? "Link" : "No"],
                ].map(([label, value]) => (
                  <div key={label} className="flex items-start justify-between gap-3 py-1.5">
                    <dt className="shrink-0 text-dim">{label}</dt>
                    <dd className="min-w-0 truncate text-muted-foreground">{value}</dd>
                  </div>
                ))}
              </dl>

              <p className="mt-3 text-xs text-dim">{formatDateFull(item.updatedAt)}</p>
            </aside>
          ) : null}
        </div>

        {/* Actions come from the registry, so this footer, the right-click menu
            and the selection toolbar can never disagree about what a file
            allows. */}
        <footer className="flex h-13 shrink-0 items-center gap-1.5 border-t border-line px-3">
          {actions.map((action) => (
            <Button key={action.id} variant="ghost" size="sm" onClick={action.run}>
              <action.icon className="size-3.5" />
              <span className="hidden sm:inline">{action.label}</span>
            </Button>
          ))}

          <span className="ml-auto hidden items-center gap-3 text-2xs text-dim md:flex">
            <span className="flex items-center gap-1.5">
              <Kbd variant="inline">←</Kbd>
              <Kbd variant="inline">→</Kbd>
              browse
            </span>
            <span className="flex items-center gap-1.5">
              <Kbd variant="inline">Space</Kbd>
              close
            </span>
          </span>
        </footer>
      </DialogContent>
    </Dialog>
  );
}
