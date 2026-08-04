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
 *   query      what to ask the service for
 *   columns    which optional columns the table shows
 *   actions    which entries the context menu offers, in order
 *   sort       where the view starts
 *   empty      what to say when there is nothing
 *
 * Only `files` is wired up in this milestone. The rest are here because writing
 * them down is what proves the shape holds — and because adding Trash later
 * should be a route and an object, not a second file browser.
 */

const FULL_ACTIONS = [
  "open",
  "preview",
  "rename",
  "move",
  "share",
  "download",
  "trash",
];

export const WORKSPACE_VIEWS = {
  files: {
    id: "files",
    label: "All files",
    /** `parentId: null` is the root. Folder navigation supplies its own. */
    query: ({ folderId = null } = {}) => ({ parentId: folderId }),
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

  /* ------------------------------------------- described, not yet wired -- */

  recent: {
    id: "recent",
    label: "Recent",
    query: () => ({ filter: { recent: true } }),
    columns: ["size", "opened"],
    actions: FULL_ACTIONS,
    sort: { field: "openedAt", direction: "desc" },
    canCreate: false,
    empty: { title: "Nothing opened yet", body: "Files you open will collect here." },
  },

  starred: {
    id: "starred",
    label: "Starred",
    query: () => ({ filter: { starred: true } }),
    columns: ["size", "modified", "shared"],
    actions: FULL_ACTIONS,
    sort: { field: "updatedAt", direction: "desc" },
    canCreate: false,
    empty: { title: "Nothing starred", body: "Star a file to keep it close." },
  },

  shared: {
    id: "shared",
    label: "Shared",
    query: () => ({ filter: { shared: true } }),
    columns: ["size", "modified", "shared"],
    actions: [...FULL_ACTIONS, "copyLink", "revokeShare"],
    sort: { field: "updatedAt", direction: "desc" },
    canCreate: false,
    empty: { title: "Nothing shared", body: "Links you create will be listed here." },
  },

  trash: {
    id: "trash",
    label: "Trash",
    query: () => ({ filter: { trashed: true } }),
    columns: ["size", "deleted"],
    /** A different set entirely — nothing in the bin can be renamed or shared. */
    actions: ["restore", "deleteForever"],
    sort: { field: "updatedAt", direction: "desc" },
    canCreate: false,
    empty: { title: "Trash is empty", body: "Deleted files wait here before they go." },
  },
};
