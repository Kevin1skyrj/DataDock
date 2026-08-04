"use client";

import { Link2, X } from "lucide-react";
import { useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import { FileIcon } from "@/components/workspace/file-icon";
import { useWorkspace } from "@/components/workspace/workspace-context";
import { formatBytes, formatCount, formatDate, formatDateFull } from "@/lib/format";
import { getFolderSummary } from "@/services/files";
import { setDetailsOpen, useDetailsOpen } from "@/lib/workspace-prefs";
import { cn } from "@/lib/utils";

function Field({ label, children, tone }) {
  return (
    <div className="flex items-start justify-between gap-3 py-1.5">
      <dt className="shrink-0 text-sm text-dim">{label}</dt>
      <dd className={cn("min-w-0 truncate text-sm text-muted-foreground", tone)}>{children}</dd>
    </div>
  );
}

/**
 * What is selected, in detail.
 *
 * Toggled by hand and remembered, never opened on its own. Auto-opening is the
 * worst of the options available: the workspace changes width every time you
 * click a file, so the row under your cursor moves and the columns reflow
 * mid-interaction. Finder's Inspector and Linear's issue panel are both
 * user-toggled and both remember, and they are right.
 *
 * Because it never opens itself, it has to be useful when open with nothing
 * chosen — so that state shows the folder's own totals rather than an apology.
 */
export function DetailsPanel() {
  const { selection, folderId, items } = useWorkspace();
  const open = useDetailsOpen();
  const [summary, setSummary] = useState(null);

  const one = selection.count === 1 ? selection.selected[0] : null;

  useEffect(() => {
    if (!open || selection.count > 0) return undefined;
    let live = true;
    getFolderSummary(folderId).then((result) => {
      if (live) setSummary(result);
    });
    return () => {
      live = false;
    };
  }, [open, selection.count, folderId, items.length]);

  return (
    <aside
      data-workspace="details"
      aria-label="Details"
      // Never focusable while closed. The panel is still in the tree — that is
      // what lets it animate — so without this its controls stay tabbable from
      // a zero-width column.
      inert={!open}
      className={cn(
        "flex min-h-0 flex-col overflow-hidden border-line bg-bg-deep",
        "xl:border-l",
        // Below xl it is an overlay rather than a column: three panes do not fit,
        // and squeezing the listing to fit a fourth is worse than covering it.
        "absolute inset-y-0 right-0 z-20 w-80 max-w-[85vw] shadow-elevated",
        "transition-[translate,opacity] duration-200 ease-standard",
        open ? "translate-x-0 opacity-100" : "translate-x-full opacity-0",
        "xl:static xl:z-auto xl:w-auto xl:max-w-none xl:translate-x-0 xl:opacity-100 xl:shadow-none",
        "xl:transition-none",
      )}
    >
      <div className="flex h-13 shrink-0 items-center justify-between gap-2 border-b border-line px-4">
        <span className="text-md font-medium text-foreground">Details</span>
        <Button
          variant="ghost"
          size="icon-sm"
          aria-label="Close details"
          onClick={() => setDetailsOpen(false)}
        >
          <X />
        </Button>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto p-4">
        {one ? <SingleDetails item={one} /> : null}
        {selection.count > 1 ? <ManyDetails items={selection.selected} /> : null}
        {selection.count === 0 ? <FolderDetails summary={summary} /> : null}
      </div>
    </aside>
  );
}

function SingleDetails({ item }) {
  return (
    <div className="flex flex-col gap-5">
      <div className="grid aspect-4/3 place-items-center rounded-lg border border-line bg-surface">
        <FileIcon kind={item.kind} className="size-10" />
      </div>

      <div className="flex flex-col gap-1">
        <p className="text-md font-medium text-foreground break-words">{item.name}</p>
        <p className="text-sm text-dim">
          {item.type === "folder"
            ? formatCount(item.itemCount ?? 0)
            : `${item.mimeType?.split("/").at(-1)?.toUpperCase()} · ${formatBytes(item.size)}`}
        </p>
      </div>

      <dl className="flex flex-col divide-y divide-line/60">
        <Field label="Modified">{formatDate(item.updatedAt)}</Field>
        <Field label="Created">{formatDate(item.createdAt)}</Field>
        <Field label="Last opened">{formatDate(item.openedAt)}</Field>
        <Field label="Starred" tone={item.starred ? "text-brand" : undefined}>
          {item.starred ? "Yes" : "No"}
        </Field>
      </dl>

      <div className="flex flex-col gap-2">
        <p className="text-2xs tracking-widest text-dim uppercase">Sharing</p>

        {item.share ? (
          <div className="flex flex-col gap-2 rounded-lg border border-line bg-surface p-3">
            <span className="flex items-center gap-2 text-sm text-foreground">
              <Link2 className="size-3.5 text-brand" />
              Anyone with the link
            </span>
            <dl className="flex flex-col">
              <Field label="Views">{item.share.viewCount}</Field>
              <Field label="Expires">
                {item.share.expiresAt ? formatDate(item.share.expiresAt) : "Never"}
              </Field>
            </dl>
          </div>
        ) : (
          <p className="rounded-lg border border-line bg-surface p-3 text-sm text-dim">
            Not shared. Only you can see this.
          </p>
        )}
      </div>

      <div className="flex flex-col gap-2">
        <p className="text-2xs tracking-widest text-dim uppercase">Activity</p>
        <ol className="flex flex-col gap-2.5 text-sm">
          <li className="flex flex-col">
            <span className="text-muted-foreground">Modified</span>
            <span className="text-dim">{formatDateFull(item.updatedAt)}</span>
          </li>
          <li className="flex flex-col">
            <span className="text-muted-foreground">Uploaded</span>
            <span className="text-dim">{formatDateFull(item.createdAt)}</span>
          </li>
        </ol>
      </div>
    </div>
  );
}

function ManyDetails({ items }) {
  const size = items.reduce((total, item) => total + (item.size ?? 0), 0);
  const folders = items.filter((item) => item.type === "folder").length;

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-col gap-1">
        <p className="text-md font-medium text-foreground">{formatCount(items.length)} selected</p>
        <p className="text-sm text-dim">{formatBytes(size)} in total</p>
      </div>

      <dl className="flex flex-col divide-y divide-line/60">
        <Field label="Folders">{folders}</Field>
        <Field label="Files">{items.length - folders}</Field>
        <Field label="Combined size">{formatBytes(size)}</Field>
      </dl>

      <ul className="flex flex-col gap-1.5">
        {items.slice(0, 8).map((item) => (
          <li key={item.id} className="flex items-center gap-2 text-sm text-muted-foreground">
            <FileIcon kind={item.kind} />
            <span className="truncate">{item.name}</span>
          </li>
        ))}
        {items.length > 8 ? (
          <li className="text-sm text-dim">and {items.length - 8} more</li>
        ) : null}
      </ul>
    </div>
  );
}

function FolderDetails({ summary }) {
  if (!summary) {
    return (
      <div aria-hidden="true" className="flex flex-col gap-3">
        {[70, 45, 55].map((width) => (
          <div key={width} className="h-3 rounded-full bg-surface-2" style={{ width: `${width}%` }} />
        ))}
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-col gap-1">
        <p className="text-md font-medium text-foreground">Nothing selected</p>
        <p className="text-sm text-dim">Showing what is in this folder.</p>
      </div>

      <dl className="flex flex-col divide-y divide-line/60">
        <Field label="Items">{formatCount(summary.count)}</Field>
        <Field label="Folders">{summary.folderCount}</Field>
        <Field label="Size">{formatBytes(summary.size)}</Field>
        <Field label="Last change">{formatDate(summary.updatedAt)}</Field>
      </dl>
    </div>
  );
}
