"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";

import { notify } from "@/components/ui/toast";
import { useDragDrop } from "@/components/workspace/use-drag-drop";
import { publishTrail } from "@/lib/breadcrumb-trail";
import { clearWorkspaceCommands, publishWorkspaceCommands } from "@/lib/workspace-commands";
import { useUploadsLandedIn } from "@/lib/upload-store";
import { buildFileActions } from "@/lib/file-actions";
import { setDetailsOpen } from "@/lib/workspace-prefs";
import { useSelection } from "@/lib/use-selection";
import {
  collectDescendants,
  copyItems,
  createFolder,
  deleteItems,
  duplicateItems,
  getDownloadUrl,
  getPreview,
  getPath,
  moveItems,
  renameItem,
  restoreItems,
  revokeShare,
  starItems,
  trashItems,
} from "@/services/files";

const WorkspaceContext = createContext(null);

export function useWorkspace() {
  const value = useContext(WorkspaceContext);
  if (!value) throw new Error("useWorkspace must be used inside <WorkspaceProvider>");
  return value;
}

/**
 * Everything the workspace knows.
 *
 * A context, where the dashboard shell deliberately avoided one. The shell had
 * two consumers one level apart, so props were simpler. Here the same state is
 * read by the toolbar, the table, the grid, every row, every card, the context
 * menu, the details panel and the status bar — eight consumers across four
 * levels — and threading it would mean every one of those taking a dozen props
 * it only passes along.
 *
 * What lives here is state; what lives in `lib/` is behaviour. Selection is a
 * headless hook, actions are a pure registry, formatting is a pure module. This
 * file is the only place that knows all three exist at the same time.
 */
export function WorkspaceProvider({ view, folderId = null, scope, onNavigate, children }) {
  const [sort, setSort] = useState(view.sort);
  const [kinds, setKinds] = useState([]);
  const [query, setQuery] = useState("");
  const [nonce, setNonce] = useState(0);

  const [status, setStatus] = useState(null);
  const [activeId, setActiveId] = useState(null);
  const [renaming, setRenaming] = useState(null);
  const [creatingFolder, setCreatingFolder] = useState(false);
  /** The import provider whose dialog is open, if any. */
  const [importing, setImporting] = useState(null);
  /** Which item the Quick Look is showing, by index into the listing. */
  const [previewIndex, setPreviewIndex] = useState(null);
  const [sharing, setSharing] = useState(null);
  /** `{ items }` while permanent deletion is being confirmed. */
  const [confirmingDelete, setConfirmingDelete] = useState(null);
  /** The selected items while a move destination is being chosen. */
  const [destination, setDestination] = useState(null);
  /**
   * Copied items waiting to be pasted.
   *
   * A real clipboard rather than a dialog-only Move, because ⌘X ⌘V is how
   * people actually reorganise a drive — pick things up here, walk to where
   * they belong, put them down. A dialog cannot express "somewhere I will
   * recognise when I see it".
   */
  const [clipboard, setClipboard] = useState(null);

  /**
   * The listing, tagged with the request it answers.
   *
   * Loading is *derived* from whether the data on hand matches the query being
   * asked, rather than being a flag something has to remember to set and unset.
   * That removes the two bugs this pattern usually ships with: a spinner that
   * never clears because an error path forgot it, and a slow first response
   * landing after a fast second one and overwriting it. Here a stale response
   * simply carries the wrong key and is ignored.
   */
  const [data, setData] = useState({ key: null, items: [], total: 0, facets: null, error: null });

  // Uploads that landed in *this* folder are part of what the listing is a
  // view of, so they belong in the key rather than in an effect watching for
  // them. A file finishing elsewhere changes nothing here and refetches
  // nothing — which an effect on "did any upload complete" could not manage.
  const landed = useUploadsLandedIn(folderId);

  const requestKey = useMemo(
    () => JSON.stringify({ view: view.id, folderId, scope, sort, kinds, query, nonce, landed }),
    [view.id, folderId, scope, sort, kinds, query, nonce, landed],
  );

  const stale = data.key !== requestKey;
  const loading = stale && data.items.length === 0;
  const refreshing = stale && data.items.length > 0;

  const { items, total, facets, error } = data;

  useEffect(() => {
    let cancelled = false;

    view
      .fetch({ folderId, ...scope }, { sort, kinds, query })
      .then((page) => {
        if (!cancelled) {
          setData({
            key: requestKey,
            items: page.items,
            total: page.total,
            facets: page.facets ?? null,
            error: null,
          });
        }
      })
      .catch((failure) => {
        if (!cancelled) {
          setData({
            key: requestKey,
            items: [],
            total: 0,
            facets: null,
            error: failure.message ?? "That listing could not be loaded.",
          });
        }
      });

    return () => {
      cancelled = true;
    };
  }, [requestKey, view, folderId, scope, sort, kinds, query]);

  const [path, setPath] = useState([]);

  useEffect(() => {
    let cancelled = false;
    getPath(folderId)
      .then((trail) => {
        if (cancelled) return;
        setPath(trail);
        // The shell draws the breadcrumb; only this side knows what the folders
        // are called. See lib/breadcrumb-trail.js.
        publishTrail(
          trail.map((rung) => ({
            id: rung.id,
            name: rung.name,
            href: `/dashboard/files?folder=${encodeURIComponent(rung.id)}`,
          })),
        );
      })
      .catch(() => {
        if (cancelled) return;
        setPath([]);
        publishTrail([]);
      });
    return () => {
      cancelled = true;
    };
  }, [folderId]);

  // Leaving the workspace has to retract the trail, or Settings inherits
  // "Home / All files / Brand refresh".
  useEffect(() => () => publishTrail([]), []);

  const reload = useCallback(() => setNonce((current) => current + 1), []);

  const selection = useSelection(items);

  /* --------------------------------------------------------- mutating -- */

  /**
   * Writes the change locally, then reconciles with what the service returns.
   *
   * The optimistic write is why the workspace feels immediate; the reconcile is
   * why it stays correct. On failure the reload puts the truth back — cheaper
   * and more reliable than trying to invert whatever was optimistically done.
   */
  const mutate = useCallback(
    async (optimistic, request, message) => {
      if (optimistic) setData((current) => ({ ...current, ...optimistic(current) }));

      try {
        const updated = await request();
        if (Array.isArray(updated) && updated.length) {
          setData((current) => ({
            ...current,
            items: current.items.map(
              (item) => updated.find((next) => next.id === item.id) ?? item,
            ),
          }));
        }
        if (message) notify(message);
        return updated;
      } catch (failure) {
        notify({ title: failure.message ?? "That did not work.", type: "error" });
        reload();
        return null;
      }
    },
    [reload],
  );

  const handlers = useMemo(
    () => ({
      open: async (item) => {
        // A folder is somewhere to go; a file is something to look at. Enter
        // means "open" for both, and this is what that means for each.
        if (item.type === "folder") {
          onNavigate?.(item.id);
          return;
        }

        // Reserve the tab during the click event. Opening it after awaiting the
        // API would make browsers treat it as an unsolicited popup.
        const tab = window.open("about:blank", "_blank");
        if (!tab) {
          notify({ title: "Allow popups to open this file.", type: "error" });
          return;
        }
        tab.opener = null;

        try {
          const preview = await getPreview(item);
          if (!preview.url) throw new Error(preview.reason ?? "This file cannot be opened.");
          tab.location.replace(preview.url);
        } catch (failure) {
          tab.close();
          notify({ title: failure.message ?? "This file could not be opened.", type: "error" });
        }
      },
      preview: (item) =>
        setPreviewIndex(items.findIndex((candidate) => candidate.id === item.id)),
      rename: (item) => setRenaming(item),
      move: (selected) => setDestination({ mode: "move", items: selected }),

      duplicate: async (selected) => {
        const created = await duplicateItems(selected.map((item) => item.id));
        reload();
        notify({
          title:
            created.length === 1
              ? `Duplicated as ${created[0].name}.`
              : `Duplicated ${created.length} items.`,
          undo: async () => {
            await trashItems(created.map((item) => item.id));
            reload();
          },
        });
      },

      copyToClipboard: (selected) => setClipboard({ mode: "copy", items: selected }),
      share: (item) => setSharing(item),

      copyLink: async (item) => {
        const url = `${window.location.origin}/s/${item.share?.token ?? item.share?.id}`;
        try {
          await navigator.clipboard.writeText(url);
        } catch {
          /* refused — the share dialog shows the link either way */
        }
        notify({ title: "Link copied", description: url });
      },

      revokeShare: (item) =>
        mutate(
          (current) => ({
            items: current.items.map((row) =>
              row.id === item.id ? { ...row, share: null } : row,
            ),
          }),
          () => revokeShare(item.id).then(() => []),
          { title: `Stopped sharing ${item.name}` },
        ),

      download: async (selected) => {
        const [first] = selected;
        try {
          const download = await getDownloadUrl(first.id);
          const link = document.createElement("a");
          link.href = download.url;
          link.download = first.name;
          document.body.append(link);
          link.click();
          link.remove();
          setStatus({
            text: `Downloading ${first.name}.`,
          });
        } catch (failure) {
          setStatus({ tone: "error", text: failure.message });
        }
      },

      trash: async (selected) => {
        const ids = selected.map((item) => item.id);
        selection.clear();

        // Removed locally and left removed. The service returns the trashed
        // entities, but they no longer belong to this listing — reconciling
        // them back in is exactly the bug the reconcile step usually causes.
        await mutate(
          (current) => ({
            items: current.items.filter((item) => !ids.includes(item.id)),
            total: current.total - ids.length,
          }),
          () => trashItems(ids),
          {
            title:
              selected.length === 1
                ? `${selected[0].name} moved to trash`
                : `${selected.length} items moved to trash`,
            // Trash is reversible by design, so this is an undo rather than a
            // confirmation. Asking "are you sure?" before a recoverable action
            // interrupts the case that always happens in order to guard the one
            // that almost never does. Nothing in this milestone is irreversible,
            // so nothing in it asks.
            undo: async () => {
              await restoreItems(ids);
              reload();
            },
          },
        );
      },

      restore: async (selected) => {
        const ids = selected.map((item) => item.id);
        selection.clear();
        await mutate(null, () => restoreItems(ids), { title: `Restored ${ids.length}.` });
        reload();
      },

      newFolder: () => setCreatingFolder(true),
      properties: (item) => {
        selection.selectOnly(item);
        setDetailsOpen(true);
      },

      // The one action in the product with no undo to offer, so the only place
      // left to ask is before. Everything else does the thing and offers a way
      // back — see the note in ui/confirm-dialog.
      deleteForever: (selected) => setConfirmingDelete({ items: selected }),
    }),
    [items, mutate, reload, onNavigate, selection],
  );

  /* -------------------------------------------------- move, copy, paste -- */

  /**
   * The one path every relocation takes.
   *
   * Dragging, the Move dialog and ⌘V all end up here, so "moved 3 items" reads
   * the same and undoes the same however it was started. The undo is the
   * inverse move rather than a snapshot, which is the only version that stays
   * correct when the folder has changed underneath in the meantime.
   */
  const relocate = useCallback(
    async (ids, targetId, mode = "move") => {
      const moving = items.filter((item) => ids.includes(item.id));
      const origins = new Map(moving.map((item) => [item.id, item.parentId]));
      const label = moving.length === 1 ? moving[0]?.name : `${ids.length} items`;

      selection.clear();

      if (mode === "copy") {
        try {
          await copyItems(ids, targetId);
          reload();
          notify({ title: `Copied ${label}.` });
        } catch (failure) {
          notify({ title: failure.message, type: "error" });
        }
        return;
      }

      await mutate(
        (current) => ({
          items: current.items.filter((item) => !ids.includes(item.id)),
          total: current.total - ids.length,
        }),
        () => moveItems(ids, targetId),
        {
          title: `Moved ${label}`,
          undo: async () => {
            // Each item goes back where it came from, which is not necessarily
            // one folder — a multi-selection can span a listing that a filter
            // assembled from several.
            for (const [id, parentId] of origins) {
              await moveItems([id], parentId);
            }
            reload();
          },
        },
      );
    },
    [items, selection, mutate, reload],
  );

  const paste = useCallback(() => {
    if (!clipboard) return;
    relocate(
      clipboard.items.map((item) => item.id),
      folderId,
      clipboard.mode,
    );
  }, [clipboard, folderId, relocate]);

  /* --------------------------------------------------------- dragging -- */

  const drag = useDragDrop({
    onMove: (ids, targetId) => relocate(ids, targetId, "move"),
    onSpringOpen: (targetId) => onNavigate?.(targetId),
    // A folder may not land inside itself or anything it contains. The service
    // refuses too, but by then it has already appeared to move.
    isForbidden: (targetId, ids) =>
      ids.some((id) => targetId !== null && collectDescendants(id).has(targetId)) ||
      items.some((item) => ids.includes(item.id) && item.parentId === targetId),
  });

  const toggleStar = useCallback(
    (item) =>
      mutate(
        (current) => ({
          items: current.items.map((row) =>
            row.id === item.id ? { ...row, starred: !row.starred } : row,
          ),
        }),
        () => starItems([item.id], !item.starred),
      ),
    [mutate],
  );

  const commitRename = useCallback(
    async (item, name) => {
      setRenaming(null);
      await mutate(
        (current) => ({
          items: current.items.map((row) => (row.id === item.id ? { ...row, name } : row)),
        }),
        () => renameItem(item.id, name),
        {
          title: `Renamed to ${name}`,
          undo: async () => {
            await renameItem(item.id, item.name);
            reload();
          },
        },
      );
      // Name is the default sort key, so the row may belong somewhere else now.
      // Re-asking is the only way to find out where.
      if (sort.field === "name") reload();
    },
    [mutate, sort.field, reload],
  );

  const commitDelete = useCallback(async () => {
    const target = confirmingDelete?.items ?? [];
    const ids = target.map((item) => item.id);
    setConfirmingDelete(null);
    selection.clear();

    try {
      await deleteItems(ids);
      reload();
      notify({ title: `Deleted ${ids.length} ${ids.length === 1 ? "item" : "items"} for good` });
    } catch (failure) {
      notify({ title: failure.message, type: "error" });
      reload();
    }
  }, [confirmingDelete, selection, reload]);

  const commitNewFolder = useCallback(
    async (name) => {
      setCreatingFolder(false);
      try {
        const folder = await createFolder({ parentId: folderId, name });
        reload();
        notify({
          title: `Created ${folder.name}`,
          undo: async () => {
            await trashItems([folder.id]);
            reload();
          },
        });
      } catch (failure) {
        notify({ title: failure.message, type: "error" });
      }
    },
    [folderId, reload],
  );

  /* ---------------------------------------------------------- derived -- */

  // Descriptors only. `run` is invoked by whichever surface was clicked, with
  // the handlers passed in then — composing bound closures here would mean
  // building functions that reach into workspace state during render.
  const actions = useMemo(
    () => buildFileActions({ view, selection: selection.selected }),
    [view, selection.selected],
  );

  const scopeFor = useCallback(
    (item) =>
      // Right-clicking inside a selection acts on the selection; right-clicking
      // outside one acts on what was clicked. Getting this backwards is the
      // classic file-manager bug — you lose a careful multi-selection to a
      // stray right-click.
      selection.isSelected(item.id) ? selection.selected : [item],
    [selection],
  );

  const actionsFor = useCallback(
    (item) => buildFileActions({ view, selection: scopeFor(item) }),
    [view, scopeFor],
  );

  // Published for the command palette, which lives in the shell and cannot
  // reach this context. See lib/workspace-commands.js.
  useEffect(() => {
    publishWorkspaceCommands({
      selection: selection.selected,
      actions,
      handlers,
      folderId,
    });
  }, [selection.selected, actions, handlers, folderId]);

  useEffect(() => () => clearWorkspaceCommands(), []);

  const filtered = kinds.length > 0 || query.length > 0;

  const value = useMemo(
    () => ({
      view, folderId, path, items, total, facets, loading, refreshing, error,
      status, setStatus,
      sort, setSort, kinds, setKinds, query, setQuery, filtered,
      selection, activeId, setActiveId,
      actions, actionsFor, scopeFor, handlers, toggleStar,
      renaming, setRenaming, commitRename,
      creatingFolder, setCreatingFolder, commitNewFolder,
      importing, setImporting,
      previewIndex, setPreviewIndex,
      sharing, setSharing,
      confirmingDelete, setConfirmingDelete, commitDelete,
      destination, setDestination, relocate,
      clipboard, setClipboard, paste,
      drag,
      reload, onNavigate,
    }),
    [
      view, folderId, path, items, total, facets, loading, refreshing, error, status,
      sort, kinds, query, filtered, selection, activeId, actions, actionsFor,
      scopeFor, handlers, toggleStar, renaming, commitRename, creatingFolder,
      commitNewFolder, importing, previewIndex, sharing, confirmingDelete,
      commitDelete, destination, relocate, clipboard, paste, drag,
      reload, onNavigate,
    ],
  );

  return <WorkspaceContext.Provider value={value}>{children}</WorkspaceContext.Provider>;
}
