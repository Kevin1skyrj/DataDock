import { DRIVE_QUOTA_BYTES, FILE_SEED } from "@/services/mock/file-seed";

/**
 * The drive, in memory.
 *
 * Every function here has the signature its replacement will have. The mock
 * filters an array; the real one sends a Mongo query and signs an S3 URL. What
 * matters is that no component can tell the difference, which is why the awkward
 * parts are modelled rather than skipped:
 *
 * - **Sorting and filtering are arguments, not array methods.** It would be
 *   easier to hand the UI everything and let it sort. That works until a folder
 *   has ten thousand files in it, and then the entire component tree is built
 *   on an assumption the backend cannot honour. Sorting belongs to whoever owns
 *   the index.
 * - **Every list is paginated.** `nextCursor` is null at this size and will stay
 *   null for a while, but the shape is the expensive part to add later — it
 *   changes every caller.
 * - **Mutations return the updated entities**, so the UI can apply a change
 *   optimistically and reconcile against the response rather than refetching
 *   the world.
 * - **Latency is real.** A service that resolves instantly hides every missing
 *   loading state until the day it is deployed.
 */

const LIST_LATENCY = 320;
const WRITE_LATENCY = 420;

const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

/** Mutable working copy, so mutations survive within a session. */
let drive = FILE_SEED.map((item) => ({ ...item }));

export class FileServiceError extends Error {
  constructor(message, { code = "unknown", id = null } = {}) {
    super(message);
    this.name = "FileServiceError";
    this.code = code;
    this.id = id;
  }
}

/* ------------------------------------------------------------- reading -- */

const clone = (item) => ({ ...item });
const byId = (id) => drive.find((item) => item.id === id);

/**
 * Folders before files, always — then the requested field.
 *
 * The grouping is not a preference, it is what every desktop file manager does
 * and what people navigate by: containers first, contents second. Sorting by
 * size with folders interleaved at `null` is nonsense in any direction.
 */
const SORT_FIELDS = {
  name: (item) => item.name.toLowerCase(),
  size: (item) => item.size ?? -1,
  updatedAt: (item) => item.updatedAt,
  createdAt: (item) => item.createdAt,
  openedAt: (item) => item.openedAt,
  kind: (item) => item.kind,
};

function compare(a, b, sort) {
  if (a.type !== b.type) return a.type === "folder" ? -1 : 1;

  const read = SORT_FIELDS[sort.field] ?? SORT_FIELDS.name;
  const left = read(a);
  const right = read(b);

  let result = 0;
  if (left < right) result = -1;
  else if (left > right) result = 1;
  // Name is the tie-break, so equal sizes or equal dates never shuffle between
  // renders. A list that reorders itself when nothing changed reads as a bug.
  else result = a.name.localeCompare(b.name);

  return sort.direction === "desc" ? -result : result;
}

function matches(item, { parentId, kinds, query, starred, trashed }) {
  // Trash is a view over the whole drive, not a folder — an item in the bin
  // keeps the parent it will be restored to, so trashed items must be excluded
  // from their own folder's listing.
  if (trashed) {
    if (!item.trashedAt) return false;
  } else {
    if (item.trashedAt) return false;
    if (parentId !== undefined && item.parentId !== parentId) return false;
  }

  if (starred && !item.starred) return false;
  if (kinds?.length && !kinds.includes(item.kind)) return false;
  if (query && !item.name.toLowerCase().includes(query.trim().toLowerCase())) return false;

  return true;
}

/**
 * @param {object} [options]
 * @param {string|null} [options.parentId] folder to list; `null` is the root
 * @param {{field: string, direction: "asc"|"desc"}} [options.sort]
 * @param {{kinds?: string[], query?: string, starred?: boolean, trashed?: boolean}} [options.filter]
 * @param {string|null} [options.cursor]
 * @param {number} [options.limit]
 * @returns {Promise<{items: object[], nextCursor: string|null, total: number}>}
 */
export async function listItems({
  parentId,
  sort = { field: "name", direction: "asc" },
  filter = {},
  cursor = null,
  limit = 100,
} = {}) {
  await wait(LIST_LATENCY);

  const matched = drive
    .filter((item) => matches(item, { parentId, ...filter }))
    .sort((a, b) => compare(a, b, sort));

  // An opaque offset. The real one will be a sort-key cursor; callers must not
  // read it either way, which is the only property that has to hold.
  const start = cursor ? Number.parseInt(cursor, 10) || 0 : 0;
  const page = matched.slice(start, start + limit);
  const next = start + limit < matched.length ? String(start + limit) : null;

  return { items: page.map(clone), nextCursor: next, total: matched.length };
}

export async function getItem(id) {
  await wait(120);
  const item = byId(id);
  if (!item) throw new FileServiceError("That item no longer exists.", { code: "not-found", id });
  return clone(item);
}

/**
 * The folder chain from the root down to `id`, for breadcrumbs.
 *
 * Walked here rather than in the browser because the browser only holds the
 * folder it is looking at — it cannot name the ancestors it never loaded.
 */
export async function getPath(folderId) {
  await wait(80);
  const trail = [];
  let current = folderId ? byId(folderId) : null;

  while (current) {
    trail.unshift({ id: current.id, name: current.name });
    current = current.parentId ? byId(current.parentId) : null;
  }

  return trail;
}

/** Totals for the details panel when nothing is selected. */
export async function getFolderSummary(parentId = null) {
  await wait(120);
  const items = drive.filter((item) => matches(item, { parentId }));

  return {
    count: items.length,
    folderCount: items.filter((item) => item.type === "folder").length,
    size: items.reduce((total, item) => total + (item.size ?? 0), 0),
    updatedAt: items.reduce(
      (latest, item) => (item.updatedAt > latest ? item.updatedAt : latest),
      "",
    ) || null,
  };
}

export async function getDriveUsage() {
  await wait(120);
  const used = drive
    .filter((item) => item.type === "file" && !item.trashedAt)
    .reduce((total, item) => total + (item.size ?? 0), 0);

  return { used, quota: DRIVE_QUOTA_BYTES };
}

/* ------------------------------------------------------------ writing -- */

/** Deterministic enough to read in a log, unique enough not to collide. */
let sequence = 0;
const nextId = (prefix) => `${prefix}_${Date.now().toString(36)}${(sequence++).toString(36)}`;

function patch(ids, changes) {
  const touched = [];

  drive = drive.map((item) => {
    if (!ids.includes(item.id)) return item;
    const updated = { ...item, ...changes(item) };
    touched.push(updated);
    return updated;
  });

  return touched.map(clone);
}

export async function createFolder({ parentId = null, name }) {
  await wait(WRITE_LATENCY);

  const trimmed = name.trim();
  if (!trimmed) throw new FileServiceError("Give the folder a name.", { code: "empty-name" });

  const taken = drive.some(
    (item) =>
      item.parentId === parentId &&
      !item.trashedAt &&
      item.name.toLowerCase() === trimmed.toLowerCase(),
  );
  if (taken) {
    throw new FileServiceError(`“${trimmed}” already exists here.`, { code: "name-conflict" });
  }

  const now = new Date().toISOString();
  const folder = {
    id: nextId("fld"),
    type: "folder",
    name: trimmed,
    parentId,
    kind: "folder",
    mimeType: null,
    size: null,
    itemCount: 0,
    storageKey: null,
    thumbnailKey: null,
    ownerId: "usr_mock",
    createdAt: now,
    updatedAt: now,
    openedAt: now,
    starred: false,
    trashedAt: null,
    share: null,
  };

  drive = [...drive, folder];
  return clone(folder);
}

export async function renameItem(id, name) {
  await wait(WRITE_LATENCY);

  const item = byId(id);
  if (!item) throw new FileServiceError("That item no longer exists.", { code: "not-found", id });

  const trimmed = name.trim();
  if (!trimmed) throw new FileServiceError("A name cannot be empty.", { code: "empty-name", id });

  const taken = drive.some(
    (other) =>
      other.id !== id &&
      other.parentId === item.parentId &&
      !other.trashedAt &&
      other.name.toLowerCase() === trimmed.toLowerCase(),
  );
  if (taken) {
    throw new FileServiceError(`“${trimmed}” already exists here.`, { code: "name-conflict", id });
  }

  return patch([id], () => ({ name: trimmed, updatedAt: new Date().toISOString() }))[0];
}

export async function moveItems(ids, parentId) {
  await wait(WRITE_LATENCY);

  // A folder cannot be moved inside itself or its own descendants, and the
  // check has to walk upward from the destination — the loop it would create is
  // invisible from the folder being moved.
  for (const id of ids) {
    let ancestor = parentId ? byId(parentId) : null;
    while (ancestor) {
      if (ancestor.id === id) {
        throw new FileServiceError("A folder cannot be moved into itself.", {
          code: "cyclic-move",
          id,
        });
      }
      ancestor = ancestor.parentId ? byId(ancestor.parentId) : null;
    }
  }

  return patch(ids, () => ({ parentId, updatedAt: new Date().toISOString() }));
}

export async function starItems(ids, starred) {
  await wait(200);
  return patch(ids, () => ({ starred }));
}

export async function trashItems(ids) {
  await wait(WRITE_LATENCY);
  const now = new Date().toISOString();
  return patch(ids, () => ({ trashedAt: now }));
}

export async function restoreItems(ids) {
  await wait(WRITE_LATENCY);
  return patch(ids, () => ({ trashedAt: null }));
}

export async function deleteItems(ids) {
  await wait(WRITE_LATENCY);

  // Reserved so the irreversible path has a reachable failure. Deleting is the
  // one action whose error state must be designed rather than assumed.
  if (ids.includes("fil_legacy_export")) {
    throw new FileServiceError("This file is locked and cannot be deleted.", {
      code: "locked",
      id: "fil_legacy_export",
    });
  }

  drive = drive.filter((item) => !ids.includes(item.id));
  return { deleted: [...ids] };
}

export async function createShare(id) {
  await wait(WRITE_LATENCY);

  const share = {
    id: nextId("shr"),
    scope: "link",
    expiresAt: null,
    viewCount: 0,
  };

  patch([id], () => ({ share }));
  return share;
}

export async function revokeShare(id) {
  await wait(300);
  return patch([id], () => ({ share: null }))[0];
}

/**
 * Resolved at the moment of use, never stored on the entity.
 *
 * S3 presigned URLs expire. An entity carrying one is a bug with a timer on it:
 * it works in every test and fails for whoever left the tab open.
 */
export async function getDownloadUrl(id) {
  await wait(200);

  const item = byId(id);
  if (!item) throw new FileServiceError("That item no longer exists.", { code: "not-found", id });
  if (item.type === "folder") {
    throw new FileServiceError("Folders cannot be downloaded yet.", { code: "unsupported", id });
  }

  return {
    url: `https://mock.datadock.app/${item.storageKey}?signature=mock`,
    expiresAt: new Date(Date.now() + 15 * 60_000).toISOString(),
  };
}

/** Test seam — restores the drive to its seeded state. */
export function __resetDrive() {
  drive = FILE_SEED.map((item) => ({ ...item }));
}
