"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";

import { buildFileActions } from "@/lib/file-actions";
import { useSelection } from "@/lib/use-selection";
import {
  createFolder,
  getDownloadUrl,
  getPath,
  listItems,
  renameItem,
  restoreItems,
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
export function WorkspaceProvider({ view, folderId = null, onNavigate, children }) {
  const [sort, setSort] = useState(view.sort);
  const [kinds, setKinds] = useState([]);
  const [query, setQuery] = useState("");
  const [nonce, setNonce] = useState(0);

  const [status, setStatus] = useState(null);
  const [activeId, setActiveId] = useState(null);
  const [renaming, setRenaming] = useState(null);
  const [creatingFolder, setCreatingFolder] = useState(false);

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
  const [data, setData] = useState({ key: null, items: [], total: 0, error: null });

  const requestKey = useMemo(
    () => JSON.stringify({ view: view.id, folderId, sort, kinds, query, nonce }),
    [view.id, folderId, sort, kinds, query, nonce],
  );

  const stale = data.key !== requestKey;
  const loading = stale && data.items.length === 0;
  const refreshing = stale && data.items.length > 0;

  const { items, total, error } = data;

  useEffect(() => {
    let cancelled = false;
    const base = view.query({ folderId });

    listItems({ ...base, sort, filter: { ...base.filter, kinds, query } })
      .then((page) => {
        if (!cancelled) {
          setData({ key: requestKey, items: page.items, total: page.total, error: null });
        }
      })
      .catch((failure) => {
        if (!cancelled) {
          setData({
            key: requestKey,
            items: [],
            total: 0,
            error: failure.message ?? "That listing could not be loaded.",
          });
        }
      });

    return () => {
      cancelled = true;
    };
  }, [requestKey, view, folderId, sort, kinds, query]);

  const [path, setPath] = useState([]);

  useEffect(() => {
    let cancelled = false;
    getPath(folderId).then((trail) => {
      if (!cancelled) setPath(trail);
    });
    return () => {
      cancelled = true;
    };
  }, [folderId]);

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
        if (message) setStatus(message);
        return updated;
      } catch (failure) {
        setStatus({ tone: "error", text: failure.message ?? "That did not work." });
        reload();
        return null;
      }
    },
    [reload],
  );

  const handlers = useMemo(
    () => ({
      open: (item) => {
        if (item.type === "folder") onNavigate?.(item.id);
        else setStatus({ text: `Preview for ${item.name} arrives with File Preview.` });
      },
      preview: (item) => setStatus({ text: `Preview for ${item.name} arrives with File Preview.` }),
      rename: (item) => setRenaming(item),
      move: (selected) =>
        setStatus({
          text: `Moving ${selected.length === 1 ? selected[0].name : `${selected.length} items`} arrives with its own milestone.`,
        }),
      share: (item) => setStatus({ text: `Sharing ${item.name} arrives with Sharing.` }),
      copyLink: (item) => setStatus({ text: `Link to ${item.name} copied.` }),
      revokeShare: (item) => setStatus({ text: `Stopped sharing ${item.name}.` }),

      download: async (selected) => {
        const [first] = selected;
        try {
          await getDownloadUrl(first.id);
          setStatus({
            text:
              selected.length === 1
                ? `Downloading ${first.name}.`
                : `Downloading ${selected.length} files.`,
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
            text:
              selected.length === 1
                ? `${selected[0].name} moved to trash.`
                : `${selected.length} items moved to trash.`,
            // Trash is reversible by design, so this is an undo rather than a
            // confirmation. Asking "are you sure?" before a recoverable action
            // interrupts the case that always happens in order to guard the one
            // that almost never does.
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
        await mutate(null, () => restoreItems(ids), { text: `Restored ${ids.length}.` });
        reload();
      },

      deleteForever: (selected) =>
        setStatus({ text: `Permanent delete arrives with the Trash view. (${selected.length})` }),
    }),
    [mutate, reload, onNavigate, selection],
  );

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
        { text: `Renamed to ${name}.` },
      );
      // Name is the default sort key, so the row may belong somewhere else now.
      // Re-asking is the only way to find out where.
      if (sort.field === "name") reload();
    },
    [mutate, sort.field, reload],
  );

  const commitNewFolder = useCallback(
    async (name) => {
      setCreatingFolder(false);
      try {
        const folder = await createFolder({ parentId: folderId, name });
        setStatus({ text: `Created ${folder.name}.` });
        reload();
      } catch (failure) {
        setStatus({ tone: "error", text: failure.message });
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

  const filtered = kinds.length > 0 || query.length > 0;

  const value = useMemo(
    () => ({
      view, folderId, path, items, total, loading, refreshing, error,
      status, setStatus,
      sort, setSort, kinds, setKinds, query, setQuery, filtered,
      selection, activeId, setActiveId,
      actions, actionsFor, scopeFor, handlers, toggleStar,
      renaming, setRenaming, commitRename,
      creatingFolder, setCreatingFolder, commitNewFolder,
      reload, onNavigate,
    }),
    [
      view, folderId, path, items, total, loading, refreshing, error, status,
      sort, kinds, query, filtered, selection, activeId, actions, actionsFor,
      scopeFor, handlers, toggleStar, renaming, commitRename, creatingFolder,
      commitNewFolder, reload, onNavigate,
    ],
  );

  return <WorkspaceContext.Provider value={value}>{children}</WorkspaceContext.Provider>;
}
