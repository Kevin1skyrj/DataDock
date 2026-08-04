"use client";

import { ChevronRight, Folder, FolderPlus, Home } from "lucide-react";
import { useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogBody,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { collectDescendants, createFolder, listFolders } from "@/services/files";
import { cn } from "@/lib/utils";

/**
 * Choosing where something goes.
 *
 * One dialog for Move and for Copy, because picking a destination is the same
 * act either way and only the verb differs. Two dialogs would be two places for
 * "you cannot put a folder inside itself" to be enforced, and one of them would
 * eventually forget.
 *
 * It browses rather than showing a tree. A tree has to load the whole hierarchy
 * to draw itself, which is fine for twenty folders and impossible for a real
 * drive; browsing asks for one level at a time, which is the same shape the
 * listing already uses and the same query the backend already has an index for.
 *
 * Invalid destinations are shown and disabled rather than hidden. A folder that
 * silently vanishes from the picker reads as a bug or a sync problem — saying
 * "you are moving this one" is the answer to the question the absence raises.
 */
export function FolderPickerDialog({ open, title, action, items, onSubmit, onClose }) {
  const [parentId, setParentId] = useState(null);
  const [trail, setTrail] = useState([]);
  const [folders, setFolders] = useState(null);
  const [creating, setCreating] = useState(false);

  const movingIds = items.map((item) => item.id);
  // Everything inside what is being moved, plus the things themselves. Computed
  // once per open rather than per row.
  const forbidden = open
    ? movingIds.reduce((set, id) => {
        for (const descendant of collectDescendants(id)) set.add(descendant);
        return set;
      }, new Set())
    : new Set();

  const sourceParent = items[0]?.parentId ?? null;

  // Same shape as the workspace's listing: the loaded folders are tagged with
  // the request they answer, so "still loading" is derived rather than being a
  // flag something has to clear — and a slow response for a folder you have
  // already navigated out of is ignored instead of overwriting the new one.
  const requestKey = open ? `${parentId ?? "root"}:${creating}` : null;
  const loadingFolders = folders?.key !== requestKey;

  useEffect(() => {
    if (!open) return undefined;
    let cancelled = false;
    listFolders(parentId).then((result) => {
      if (!cancelled) setFolders({ key: requestKey, list: result });
    });
    return () => {
      cancelled = true;
    };
  }, [open, parentId, requestKey]);

  const enter = (folder) => {
    setTrail((current) => [...current, folder]);
    setParentId(folder.id);
  };

  const jumpTo = (index) => {
    const next = trail.slice(0, index + 1);
    setTrail(next);
    setParentId(next.at(-1)?.id ?? null);
  };

  const reset = () => {
    setTrail([]);
    setParentId(null);
    onClose();
  };

  const label = items.length === 1 ? items[0].name : `${items.length} items`;
  const here = trail.at(-1)?.name ?? "All files";
  // Moving something into the folder it is already in is a request that costs a
  // round trip to change nothing.
  const sameFolder = parentId === sourceParent;

  return (
    <Dialog open={open} onOpenChange={(next) => (next ? null : reset())}>
      <DialogContent size="sm">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <p className="truncate text-base text-muted-foreground">{label}</p>
        </DialogHeader>

        <DialogBody className="pb-2">
          <nav aria-label="Destination" className="flex items-center gap-1 pb-2 text-sm">
            <button
              type="button"
              onClick={() => jumpTo(-1)}
              className="flex items-center gap-1 rounded-xs text-dim transition-colors duration-150 ease-standard hover:text-foreground"
            >
              <Home className="size-3.5" />
              All files
            </button>

            {trail.map((folder, index) => (
              <span key={folder.id} className="flex min-w-0 items-center gap-1">
                <ChevronRight aria-hidden="true" className="size-3 shrink-0 text-dim" />
                <button
                  type="button"
                  onClick={() => jumpTo(index)}
                  className={cn(
                    "truncate rounded-xs transition-colors duration-150 ease-standard",
                    index === trail.length - 1
                      ? "text-foreground"
                      : "text-dim hover:text-foreground",
                  )}
                >
                  {folder.name}
                </button>
              </span>
            ))}
          </nav>

          <div className="h-56 overflow-y-auto rounded-lg border border-line bg-bg-deep p-1.5">
            {loadingFolders ? (
              <div aria-hidden="true" className="flex flex-col gap-1 p-1">
                {[70, 55, 62].map((width) => (
                  <div
                    key={width}
                    className="h-8 rounded-md bg-surface-2"
                    style={{ width: `${width}%` }}
                  />
                ))}
              </div>
            ) : folders.list.length === 0 ? (
              <p className="grid h-full place-items-center px-6 text-center text-sm text-dim">
                No folders in {here}. It can still be the destination.
              </p>
            ) : (
              folders.list.map((folder) => {
                const blocked = forbidden.has(folder.id);

                return (
                  <button
                    key={folder.id}
                    type="button"
                    disabled={blocked}
                    onClick={() => enter(folder)}
                    className={cn(
                      "flex w-full items-center gap-2.5 rounded-md px-2.5 py-2 text-left text-md",
                      "transition-colors duration-150 ease-standard",
                      "focus-visible:outline-2 focus-visible:-outline-offset-1 focus-visible:outline-brand",
                      blocked
                        ? "cursor-not-allowed text-dim"
                        : "text-muted-foreground hover:bg-surface hover:text-foreground",
                    )}
                  >
                    <Folder
                      className={cn("size-4 shrink-0", blocked ? "text-dim" : "text-brand")}
                      fill="currentColor"
                      fillOpacity={0.15}
                    />
                    <span className="min-w-0 flex-1 truncate">{folder.name}</span>
                    {blocked ? (
                      <span className="shrink-0 text-xs text-dim">moving</span>
                    ) : (
                      <ChevronRight className="size-3.5 shrink-0 text-dim" />
                    )}
                  </button>
                );
              })
            )}
          </div>
        </DialogBody>

        <DialogFooter className="sm:justify-between">
          <Button
            type="button"
            variant="ghost"
            loading={creating}
            onClick={async () => {
              setCreating(true);
              try {
                await createFolder({ parentId, name: "Untitled folder" });
              } finally {
                setCreating(false);
              }
            }}
          >
            <FolderPlus />
            New folder
          </Button>

          <div className="flex gap-2">
            <Button type="button" variant="ghost" onClick={reset}>
              Cancel
            </Button>
            <Button
              type="button"
              disabled={sameFolder}
              onClick={() => {
                onSubmit(parentId);
                reset();
              }}
            >
              {sameFolder ? "Already here" : `${action} to ${here}`}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
