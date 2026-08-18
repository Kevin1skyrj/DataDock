"use client";

import { ArrowRight, Clock, Upload } from "lucide-react";
import Link from "next/link";
import { useEffect, useState, useSyncExternalStore } from "react";

import { PreviewDialog } from "@/components/preview/preview-dialog";
import { Panel, PanelSkeleton, StorageActivity } from "@/components/storage/storage-panels";
import { Button } from "@/components/ui/button";
import { UploadMenu } from "@/components/upload/upload-menu";
import { ImportDialog } from "@/components/upload/import-dialog";
import { FileIcon } from "@/components/workspace/file-icon";
import { formatBytes, formatDate } from "@/lib/format";
import { useSession } from "@/providers/session-provider";
import { getStorageActivity, getStorageSummary, listItems } from "@/services/files";
import { cn } from "@/lib/utils";

/** Greets by the time of day, which is the only thing a greeting can honestly know. */
function greeting() {
  const hour = new Date().getHours();
  if (hour < 5) return "Still up";
  if (hour < 12) return "Good morning";
  if (hour < 18) return "Good afternoon";
  return "Good evening";
}

/**
 * The greeting, resolved on the client only.
 *
 * The server has no idea what time it is where you are, so rendering this there
 * would say "Good morning" to someone whose evening it is and then hydrate into
 * a mismatch on the way to being wrong. A store rather than an effect because
 * reading the clock during render is exactly what `getSnapshot` is for — and
 * because the result is one of four strings, so the identity check settles
 * immediately instead of cascading.
 */
const subscribeToNothing = () => () => {};

function useGreeting() {
  return useSyncExternalStore(subscribeToNothing, greeting, () => null);
}

/**
 * The first screen after signing in.
 *
 * Four panels, chosen by what someone actually arrives wanting: get something
 * in, find what they were last working on, see whether they are running out of
 * room, and check nothing has happened that they missed. Anything beyond those
 * would be a dashboard built to look busy.
 *
 * It is composition, not new machinery. The activity feed, the storage figures,
 * the file rows, the preview and the upload menu are all the components the
 * rest of the product already uses.
 */
export function DashboardHome() {
  const session = useSession();
  const [summary, setSummary] = useState(null);
  const [recent, setRecent] = useState(null);
  const [activity, setActivity] = useState(null);
  const [previewIndex, setPreviewIndex] = useState(null);
  const [importing, setImporting] = useState(null);
  const [nonce, setNonce] = useState(0);
  const hello = useGreeting();

  useEffect(() => {
    let cancelled = false;
    const set = (setter) => (value) => {
      if (!cancelled) setter(value);
    };

    getStorageSummary().then(set(setSummary));
    listItems({ sort: { field: "openedAt", direction: "desc" }, filter: { recent: true }, limit: 6 })
      .then((page) => page.items)
      .then(set(setRecent));
    getStorageActivity(6).then(set(setActivity));

    return () => {
      cancelled = true;
    };
  }, [nonce]);

  const used = summary ? summary.used + summary.trashed : 0;
  const percent = summary ? (used / summary.quota) * 100 : 0;

  return (
    <div className="min-h-full overflow-y-auto p-3 sm:p-4">
      <div className="mx-auto flex max-w-5xl flex-col gap-4">
        {/* --------------------------------------------------- welcome -- */}
        <header className="flex flex-wrap items-end justify-between gap-4 px-1 pt-2 pb-1">
          <div className="flex flex-col gap-1">
            {/* Reserved height, so the line does not jump in when the clock is
                read after mount. */}
            <h1 className="min-h-9 text-display-sm font-semibold tracking-tight text-foreground">
              {hello ? `${hello}, ${session.name.split(" ")[0]}` : " "}
            </h1>
            <p className="text-base text-muted-foreground">
              {summary
                ? `${summary.fileCount} files across ${summary.folderCount} folders.`
                : " "}
            </p>
          </div>

          <UploadMenu parentId={null} onImport={setImporting} />
        </header>

        <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_20rem]">
          {/* ------------------------------------------------- recent -- */}
          <Panel
            title="Pick up where you left off"
            action={
              <Button variant="ghost" size="sm" render={<Link href="/dashboard/recent" />}>
                All recent
                <ArrowRight className="size-3.5" />
              </Button>
            }
          >
            {recent === null ? (
              <PanelSkeleton rows={5} />
            ) : recent.length === 0 ? (
              <div className="flex flex-col items-center gap-3 px-6 py-10 text-center">
                <span className="grid size-10 place-items-center rounded-xl bg-surface text-dim">
                  <Clock className="size-4" />
                </span>
                <p className="max-w-64 text-base leading-[1.6] text-muted-foreground text-balance">
                  Nothing opened yet. Files you work on will collect here.
                </p>
                <Button size="sm" render={<Link href="/dashboard/files" />}>
                  <Upload />
                  Add your first file
                </Button>
              </div>
            ) : (
              <ul className="flex flex-col p-1.5">
                {recent.map((file, index) => (
                  <li key={file.id}>
                    <button
                      type="button"
                      onClick={() => setPreviewIndex(index)}
                      className={cn(
                        "flex w-full items-center gap-2.5 rounded-md px-2.5 py-2 text-left",
                        "transition-colors duration-150 ease-standard hover:bg-surface",
                        "focus-visible:outline-2 focus-visible:-outline-offset-1 focus-visible:outline-brand",
                      )}
                    >
                      <FileIcon kind={file.kind} />
                      <span className="min-w-0 flex-1 truncate text-base text-foreground">
                        {file.name}
                      </span>
                      <span className="shrink-0 font-mono text-xs text-dim tabular-nums">
                        {formatBytes(file.size)}
                      </span>
                      <span className="hidden shrink-0 text-xs text-dim sm:block">
                        {formatDate(file.openedAt)}
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </Panel>

          {/* ------------------------------------------------ storage -- */}
          <Panel
            title="Storage"
            action={
              <Button variant="ghost" size="sm" render={<Link href="/dashboard/storage" />}>
                Details
              </Button>
            }
          >
            {summary ? (
              <div className="flex flex-col gap-3 p-5">
                <p className="text-xl font-medium text-foreground">
                  {formatBytes(used)}
                  <span className="ml-1.5 text-base font-normal text-dim">
                    of {formatBytes(summary.quota)}
                  </span>
                </p>

                <div className="h-2 overflow-hidden rounded-full bg-surface-2">
                  <div
                    className="h-full origin-left rounded-full bg-brand transition-transform duration-300 ease-standard"
                    style={{ transform: `scaleX(${percent / 100})` }}
                  />
                </div>

                <p className="text-sm text-dim">
                  {formatBytes(summary.available)} available on {summary.plan.name}
                </p>
              </div>
            ) : (
              <PanelSkeleton rows={3} />
            )}
          </Panel>

          {/* ----------------------------------------------- activity -- */}
          <Panel title="Recent activity" className="lg:col-span-2">
            {activity ? <StorageActivity events={activity} /> : <PanelSkeleton rows={5} />}
          </Panel>
        </div>
      </div>

      <PreviewDialog
        open={previewIndex != null}
        items={recent ?? []}
        index={previewIndex ?? 0}
        actions={[]}
        onClose={() => setPreviewIndex(null)}
        onIndex={setPreviewIndex}
      />
      <ImportDialog
        provider={importing}
        parentId={null}
        open={Boolean(importing)}
        onClose={() => setImporting(null)}
        onImported={() => setNonce((current) => current + 1)}
      />
    </div>
  );
}
