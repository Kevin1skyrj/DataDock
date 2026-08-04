/**
 * Storage keys live here, in a module with no imports, because the boot script
 * needs them and the boot script runs from a Server Component — see the same
 * note on the sidebar key in `constants/dashboard.js`.
 */
export const DETAILS_STORAGE_KEY = "datadock:details-open";
export const VIEW_MODE_STORAGE_KEY = "datadock:view-mode";

/** Sortable columns, and how each reads in the header and the sort menu. */
export const SORT_FIELDS = [
  { id: "name", label: "Name" },
  { id: "updatedAt", label: "Modified" },
  { id: "size", label: "Size" },
  { id: "kind", label: "Kind" },
];

export const WORKSPACE = {
  upload: "Upload",
  newFolder: "New folder",
  sort: "Sort",
  filter: "Filter",
  details: "Details",
  tableView: "Table view",
  gridView: "Grid view",
  clearSelection: "Clear selection",
  up: "Up",
  selectAll: "Select all",
};
