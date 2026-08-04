"use client";

import { useEffect, useRef, useState } from "react";

import { PreviewDialog } from "@/components/preview/preview-dialog";
import { ShareDialog } from "@/components/sharing/share-dialog";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { ImportDialog } from "@/components/upload/import-dialog";
import { UploadDropZone } from "@/components/upload/upload-drop-zone";
import { DetailsPanel } from "@/components/workspace/details-panel";
import { EmptyState } from "@/components/workspace/empty-state";
import { FolderPickerDialog } from "@/components/workspace/folder-picker-dialog";
import { FileContextMenu } from "@/components/workspace/file-context-menu";
import { FileGrid } from "@/components/workspace/file-grid";
import { FileTable } from "@/components/workspace/file-table";
import { FileToolbar } from "@/components/workspace/file-toolbar";
import { NameDialog } from "@/components/workspace/name-dialog";
import { StatusBar } from "@/components/workspace/status-bar";
import { WorkspaceProvider, useWorkspace } from "@/components/workspace/workspace-context";
import { setDetailsOpen, useDetailsOpen, useViewMode } from "@/lib/workspace-prefs";
import { cn } from "@/lib/utils";

/**
 * The workspace.
 *
 * Composition only — it holds no state of its own and makes no decisions about
 * files. The provider owns state, `lib/` owns behaviour, and this arranges the
 * four regions: toolbar, listing, details, status.
 *
 * `FileWorkspace` takes a view descriptor, which is the whole reason Recent,
 * Starred, Shared and Trash will not need a second implementation. Each is this
 * component with a different object.
 */
export function FileWorkspace({ view, folderId, scope, onNavigate, header }) {
  return (
    <WorkspaceProvider view={view} folderId={folderId} scope={scope} onNavigate={onNavigate}>
      <WorkspaceFrame header={header} />
    </WorkspaceProvider>
  );
}

function WorkspaceFrame({ header }) {
  const {
    items, loading, error, selection, setActiveId, renaming, setRenaming,
    commitRename, creatingFolder, setCreatingFolder, commitNewFolder, reload,
    folderId, destination, setDestination, relocate, drag,
    importing, setImporting, reload: refresh,
    previewIndex, setPreviewIndex, sharing, setSharing,
    confirmingDelete, setConfirmingDelete, commitDelete,
    view, handlers, actionsFor,
  } = useWorkspace();

  const mode = useViewMode();
  const detailsOpen = useDetailsOpen();
  const surfaceRef = useRef(null);

  // What the right-click menu is about. Set by whichever row or card was under
  // the pointer, so one menu instance serves the entire listing rather than one
  // per item — a hundred portals for a menu only ever open once is waste that
  // shows up as jank the moment a folder gets large.
  const [target, setTarget] = useState(null);

  useEffect(() => {
    const onKeyDown = (event) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "i") {
        event.preventDefault();
        setDetailsOpen(!detailsOpen);
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [detailsOpen]);

  const empty = !loading && items.length === 0;

  return (
    <div className="flex min-h-0 flex-1 flex-col" onDragEnd={drag.endDrag} onDrop={drag.endDrag}>
      {/* Whatever the page wants above the toolbar. Search puts its field and
          facets here so results render through the same table, selection and
          preview as every other listing. */}
      {header}
      <FileToolbar />

      {/* Grid rather than flex, because the details column animates from `0fr`
          to a fixed width and grid is the one layout that can interpolate that
          without measuring anything. Above `xl` only — below it the panel is an
          overlay and this stays a single column. */}
      <div
        className={cn(
          "relative grid min-h-0 flex-1",
          "xl:transition-[grid-template-columns] xl:duration-200 xl:ease-standard",
          detailsOpen
            ? "xl:grid-cols-[minmax(0,1fr)_20rem]"
            : "xl:grid-cols-[minmax(0,1fr)_0rem]",
        )}
      >
        <div ref={surfaceRef} className="flex min-w-0 flex-col">
          {error ? (
            <div className="flex flex-1 flex-col items-center justify-center gap-3 p-8 text-center">
              <p className="text-md text-foreground">{error}</p>
              <button
                type="button"
                onClick={() => reload()}
                className="rounded-xs text-base text-brand underline underline-offset-2"
              >
                Try again
              </button>
            </div>
          ) : empty ? (
            <EmptyState />
          ) : (
            <FileContextMenu target={target}>
              <div
                // Clicking the surface but not an item clears the selection —
                // the same gesture as clicking the desktop background. Tested by
                // ancestry rather than by identity, because the click almost
                // always lands on the scroll container rather than on this
                // element.
                onPointerDown={(event) => {
                  if (selection.count === 0) return;
                  if (!event.target.closest?.("[data-item-id]")) selection.clear();
                }}
                // Whichever row or card was focused becomes the keyboard's
                // current item, so tabbing in and pressing ↓ moves to the
                // second row rather than re-selecting the first.
                onFocusCapture={(event) => {
                  const id = event.target?.dataset?.itemId;
                  if (id) setActiveId(id);
                }}
                onContextMenuCapture={(event) => {
                  // Resolve which item the menu is for before Base UI opens it.
                  // The listing owns one menu; the row only says who it is about.
                  const row = event.target.closest?.("[data-file-row],[role='gridcell'][tabindex]");
                  const id = row?.dataset?.itemId;
                  const item = items.find((candidate) => candidate.id === id);
                  setTarget(item ?? null);
                  if (item && !selection.isSelected(item.id)) selection.selectOnly(item);
                }}
                className="flex min-h-0 flex-1 flex-col"
              >
                {/* Keyed on the folder so entering one replays the entrance
                    rather than mutating the old listing in place. It is the
                    only motion in the workspace that is about navigation
                    rather than feedback, and it is 140ms — long enough to say
                    "somewhere else", short enough not to be a transition you
                    wait through. */}
                <div
                  key={folderId ?? "root"}
                  className="flex min-h-0 flex-1 flex-col motion-safe:animate-[dd-detail_140ms_var(--ease-standard)]"
                >
                  {mode === "grid" ? <FileGrid /> : <FileTable />}
                </div>
              </div>
            </FileContextMenu>
          )}
        </div>

        <DetailsPanel />

        {/* Listens on the window, draws inside the workspace. It only ever
            reacts to drags from outside the browser — an internal move carries
            our own MIME type and is rejected outright. */}
        <UploadDropZone parentId={folderId} />
      </div>

      <StatusBar />

      <NameDialog
        key={renaming?.id ?? "rename"}
        open={Boolean(renaming)}
        title="Rename"
        label="Name"
        action="Rename"
        initialValue={renaming?.name ?? ""}
        onSubmit={(name) => commitRename(renaming, name)}
        onClose={() => setRenaming(null)}
      />

      <FolderPickerDialog
        key={destination ? `${destination.mode}-${destination.items[0]?.id}` : "destination"}
        open={Boolean(destination)}
        title={destination?.mode === "copy" ? "Copy to" : "Move to"}
        action={destination?.mode === "copy" ? "Copy" : "Move"}
        items={destination?.items ?? []}
        onSubmit={(targetId) =>
          relocate(destination.items.map((item) => item.id), targetId, destination.mode)
        }
        onClose={() => setDestination(null)}
      />

      {/* Quick Look. It is handed the listing so Previous and Next follow the
          order on screen — the sort you chose, the filter you applied. */}
      <PreviewDialog
        open={previewIndex != null}
        items={items}
        index={previewIndex ?? 0}
        actions={
          previewIndex != null && items[previewIndex]
            ? actionsFor(items[previewIndex])
                .filter((action) => action.id !== "preview" && action.id !== "open")
                .map((action) => ({
                  ...action,
                  run: () => action.run([items[previewIndex]], handlers),
                }))
            : []
        }
        onClose={() => setPreviewIndex(null)}
        onIndex={setPreviewIndex}
      />

      <ShareDialog
        item={sharing}
        open={Boolean(sharing)}
        onClose={() => setSharing(null)}
        onChanged={refresh}
      />

      <ConfirmDialog
        open={Boolean(confirmingDelete)}
        title={
          confirmingDelete?.items.length === 1
            ? `Delete “${confirmingDelete.items[0].name}” for good?`
            : `Delete ${confirmingDelete?.items.length ?? 0} items for good?`
        }
        body="This cannot be undone. The files are removed from storage immediately."
        confirmLabel="Delete forever"
        onConfirm={commitDelete}
        onClose={() => setConfirmingDelete(null)}
      />

      <ImportDialog
        provider={importing}
        parentId={folderId}
        open={Boolean(importing)}
        onClose={() => setImporting(null)}
        onImported={refresh}
      />

      <NameDialog
        key={creatingFolder ? "new-folder-open" : "new-folder"}
        open={creatingFolder}
        title="New folder"
        label="Folder name"
        action="Create"
        initialValue="Untitled folder"
        onSubmit={commitNewFolder}
        onClose={() => setCreatingFolder(false)}
      />
    </div>
  );
}
