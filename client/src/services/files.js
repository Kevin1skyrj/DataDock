/**
 * The file API, as the application sees it.
 *
 * Every component imports from here and never from `services/mock`. That is the
 * entire seam: when the Node API exists, this file re-exports an HTTP client
 * instead of the in-memory drive and not one component changes. Left to import
 * the mock directly, the swap becomes a rename across every file that ever
 * touched a folder listing — and the one that gets missed is the one that
 * silently keeps serving fixtures.
 *
 * The contract, which both implementations honour:
 *
 * - Lists return `{ items, nextCursor, total }`. Always. Even when everything
 *   fits on one page.
 * - `sort` and `filter` are sent *to* the service. Whoever owns the index owns
 *   the ordering; the browser never sorts a collection it did not fully load.
 * - Mutations resolve to the updated entities, so callers can apply a change
 *   optimistically and reconcile rather than refetch.
 * - Failures throw `FileServiceError` with a `code`, so the UI can tell a name
 *   collision from a permission problem without parsing prose.
 * - No entity carries a URL. `getDownloadUrl` resolves one when it is needed.
 */
export {
  FileServiceError,
  createFolder,
  createShare,
  deleteItems,
  getDownloadUrl,
  getDriveUsage,
  getFolderSummary,
  getItem,
  getPath,
  listItems,
  moveItems,
  renameItem,
  restoreItems,
  revokeShare,
  starItems,
  trashItems,
} from "@/services/mock/files";
