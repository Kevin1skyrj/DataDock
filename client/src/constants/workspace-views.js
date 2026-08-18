import { listItems, searchDrive } from "@/services/files";

/**
 * What makes one workspace different from another.
 *
 * Files, Recent, Starred, Shared, Trash and search results are not six screens.
 * They are one screen against six of these, and everything they have in common
 * — selection, sorting, the context menu, the details panel, keyboard handling,
 * the empty and loading states — is written once and shared by all of them.
 *
 * A descriptor declares only the differences:
 *
 *   fetch      how to ask for this view's items
 *   columns    which optional columns the table shows
 *   actions    which entries the context menu offers, in order
 *   sort       where the view starts
 *   empty      what to say when there is nothing
 *
 * `fetch` rather than a query object, because search is not a listing. A folder
 * is `parentId` plus a sort — one compound index. Search is a text match across
 * the whole drive with facets on top, which is a different query against
 * different infrastructure. Letting each view name its own call is what lets
 * results render through the same table, selection, context menu and preview
 * without the workspace knowing which kind of question was asked.
 *
 * All six are wired up, and every one of them renders through the same
 * `FileWorkspace`. Adding a seventh is a route and an object, not a second file
 * browser — which is the property this shape existed to prove.
 */

const FULL_ACTIONS = [
  "open",
  "preview",
  "rename",
  "duplicate",
  "cut",
  "move",
  "share",
  "download",
  "trash",
];

export const WORKSPACE_VIEWS = {
  files: {
    id: "files",
    label: "All files",
    fetch: ({ folderId = null } = {}, { sort, kinds, query }) =>
      listItems({ parentId: folderId, sort, filter: { kinds, query } }),
    columns: ["size", "modified", "shared"],
    actions: FULL_ACTIONS,
    sort: { field: "name", direction: "asc" },
    canCreate: true,
    empty: {
      title: "Nothing here yet",
      body: "Drop files in, or create a folder to get started.",
      action: "upload",
    },
    emptySearch: {
      title: "No matches",
      body: "Nothing in this folder matches what you are looking for.",
      action: "clear",
    },
  },

  recent: {
    id: "recent",
    label: "Recent",
    fetch: (scope, { sort, kinds, query }) =>
      listItems({ sort, filter: { recent: true, kinds, query } }),
    columns: ["size", "opened"],
    actions: FULL_ACTIONS,
    sort: { field: "openedAt", direction: "desc" },
    canCreate: false,
    canUpload: false,
    empty: { title: "Nothing opened yet", body: "Files you open will collect here." },
  },

  starred: {
    id: "starred",
    label: "Starred",
    fetch: (scope, { sort, kinds, query }) =>
      listItems({ sort, filter: { starred: true, kinds, query } }),
    columns: ["size", "modified", "shared"],
    actions: FULL_ACTIONS,
    sort: { field: "updatedAt", direction: "desc" },
    canCreate: false,
    canUpload: false,
    empty: { title: "Nothing starred", body: "Star a file to keep it close." },
  },

  shared: {
    id: "shared",
    label: "Shared",
    fetch: (scope, { sort, kinds, query }) =>
      listItems({ sort, filter: { shared: true, kinds, query } }),
    columns: ["size", "modified", "shared"],
    actions: [...FULL_ACTIONS, "copyLink", "revokeShare"],
    sort: { field: "updatedAt", direction: "desc" },
    canCreate: false,
    canUpload: false,
    empty: { title: "Nothing shared", body: "Links you create will be listed here." },
  },

  /**
   * Results, rendered as a workspace.
   *
   * Everything the page narrows by lives in `scope`, which comes from the URL —
   * so the workspace's own filter control is turned off rather than competing
   * with the one above it for the same job.
   */
  search: {
    id: "search",
    label: "Search results",
    fetch: (scope, { sort }) => searchDrive({ ...scope, sort }),
    columns: ["size", "modified", "shared"],
    actions: FULL_ACTIONS,
    sort: { field: "name", direction: "asc" },
    canCreate: false,
    canUpload: false,
    canFilter: false,
    empty: {
      title: "Nothing matches",
      body: "Try fewer words, or widen the filters.",
    },
  },

  trash: {
    id: "trash",
    label: "Trash",
    fetch: (scope, { sort, kinds, query }) =>
      listItems({ sort, filter: { trashed: true, kinds, query } }),
    columns: ["size", "deleted"],
    /** A different set entirely — nothing in the bin can be renamed or shared. */
    actions: ["restore", "deleteForever"],
    sort: { field: "updatedAt", direction: "desc" },
    canCreate: false,
    canUpload: false,
    empty: { title: "Trash is empty", body: "Deleted files wait here before they go." },
  },
};
