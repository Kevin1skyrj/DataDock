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

function matches(item, { parentId, kinds, query, starred, trashed, shared, recent }) {
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
  // Shared and Recent are drive-wide views, not folders. Neither passes a
  // `parentId`, so the parent check above is skipped for both.
  if (shared && !item.share) return false;
  // Folders are not "opened" in the sense Recent means — they are walked
  // through. A recent list full of folders is a list of where you have been,
  // which is what the breadcrumb is for.
  if (recent && item.type !== "file") return false;
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

/**
 * Copies items into a folder, deeply.
 *
 * A folder's copy has to bring its contents, and the contents' contents — which
 * is why this walks rather than mapping. On a real backend this is the one
 * operation here that is genuinely expensive: Mongo gets a recursive insert and
 * S3 gets a server-side object copy per file, neither of which the browser
 * should ever be asked to orchestrate. The signature is what matters, and it
 * already returns only the top-level results.
 */
async function copyTree(id, parentId, renamer) {
  const source = byId(id);
  if (!source) return [];

  const now = new Date().toISOString();
  const copy = {
    ...source,
    id: nextId(source.type === "folder" ? "fld" : "fil"),
    name: renamer ? renamer(source.name) : source.name,
    parentId,
    createdAt: now,
    updatedAt: now,
    openedAt: now,
    // A copy is nobody's favourite and nobody's shared link yet. Carrying those
    // over is the kind of detail that quietly leaks a private file.
    starred: false,
    share: null,
    trashedAt: null,
  };

  drive = [...drive, copy];

  if (source.type === "folder") {
    const children = drive.filter((item) => item.parentId === id && !item.trashedAt);
    for (const child of children) {
      // Sequential on purpose: each level needs its parent's new id.
      await copyTree(child.id, copy.id, null);
    }
  }

  return [copy];
}

/** Makes a unique name in a folder — "Report copy", then "Report copy 2". */
function uniqueName(name, parentId, type) {
  const dot = type === "folder" ? -1 : name.lastIndexOf(".");
  const stem = dot > 0 ? name.slice(0, dot) : name;
  const extension = dot > 0 ? name.slice(dot) : "";

  const taken = (candidate) =>
    drive.some(
      (item) =>
        item.parentId === parentId &&
        !item.trashedAt &&
        item.name.toLowerCase() === candidate.toLowerCase(),
    );

  let candidate = `${stem} copy${extension}`;
  let counter = 2;
  while (taken(candidate)) {
    candidate = `${stem} copy ${counter}${extension}`;
    counter += 1;
  }

  return candidate;
}

export async function copyItems(ids, parentId) {
  await wait(WRITE_LATENCY);

  const created = [];
  for (const id of ids) {
    const source = byId(id);
    if (!source) continue;
    // Copying into the same folder needs a new name; copying elsewhere does not.
    const renamer =
      source.parentId === parentId
        ? (name) => uniqueName(name, parentId, source.type)
        : null;
    created.push(...(await copyTree(id, parentId, renamer)));
  }

  return created.map(clone);
}

/** Copy, into the folder the original already lives in. */
export async function duplicateItems(ids) {
  await wait(WRITE_LATENCY);

  const created = [];
  for (const id of ids) {
    const source = byId(id);
    if (!source) continue;
    created.push(
      ...(await copyTree(id, source.parentId, (name) =>
        uniqueName(name, source.parentId, source.type),
      )),
    );
  }

  return created.map(clone);
}

/** Every folder in the drive, for a destination picker. */
export async function listFolders(parentId = null) {
  await wait(120);
  return drive
    .filter((item) => item.type === "folder" && item.parentId === parentId && !item.trashedAt)
    .sort((a, b) => a.name.localeCompare(b.name))
    .map(clone);
}

/** Ids of `id` and everything beneath it — what a move may not land inside. */
export function collectDescendants(id) {
  const found = new Set([id]);
  let frontier = [id];

  while (frontier.length) {
    const next = drive
      .filter((item) => frontier.includes(item.parentId))
      .map((item) => item.id);
    frontier = next.filter((candidate) => !found.has(candidate));
    for (const candidate of frontier) found.add(candidate);
  }

  return found;
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
    // `link` is anyone with the URL; `private` is named people only. Both are
    // shares — the difference is who the token is checked against.
    scope: "link",
    access: "view",
    expiresAt: null,
    viewCount: 0,
    // Opaque and short. The real one is signed; nothing in the UI reads it.
    token: nextId("tok").slice(4),
  };

  patch([id], () => ({ share }));
  return share;
}

/** Mock collaborators, so the share dialog has something honest to draw. */
const RECIPIENTS = [
  { id: "usr_dana", name: "Dana Okafor", email: "dana@northline.co", access: "view" },
  { id: "usr_sam", name: "Sam Patel", email: "sam@datadock.app", access: "edit" },
  { id: "usr_priya", name: "Priya Raman", email: "priya@datadock.app", access: "comment" },
];

export async function listShareRecipients(id) {
  await wait(180);
  const item = byId(id);
  if (!item?.share) return [];
  // Deterministic from the id, so the same file always shows the same people.
  const count = (item.id.length % 3) + 1;
  return RECIPIENTS.slice(0, count);
}

/**
 * Changes an existing link's terms.
 *
 * Separate from `createShare` because the two are different operations on a
 * real backend — one mints a token and writes a row, the other updates a row
 * that already has a token people may already be holding. Collapsing them
 * would mean every permission change silently invalidated every link.
 *
 * @param {string} id
 * @param {{access?: "view"|"comment"|"edit", expiresAt?: string|null, scope?: "link"|"private"}} changes
 */
export async function updateShare(id, changes) {
  await wait(260);

  const item = byId(id);
  if (!item?.share) {
    throw new FileServiceError("This file is not shared.", { code: "not-shared", id });
  }

  const [updated] = patch([id], (current) => ({ share: { ...current.share, ...changes } }));
  return updated.share;
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

/**
 * Adds an entity the upload flow has just finished putting in storage.
 *
 * Separate from `createFolder` because it is not a creation the user performed
 * — the bytes already exist in S3 by the time this runs, and the API's job is
 * only to record where. Name collisions resolve by numbering rather than by
 * throwing: an upload that fails at the last step, after the transfer, is the
 * worst possible moment to refuse.
 */
export function attachUploaded({ name, size, mimeType, kind, parentId, storageKey }) {
  const now = new Date().toISOString();
  const taken = (candidate) =>
    drive.some(
      (item) =>
        item.parentId === parentId &&
        !item.trashedAt &&
        item.name.toLowerCase() === candidate.toLowerCase(),
    );

  let finalName = name;
  if (taken(finalName)) {
    const dot = name.lastIndexOf(".");
    const stem = dot > 0 ? name.slice(0, dot) : name;
    const extension = dot > 0 ? name.slice(dot) : "";
    let counter = 2;
    while (taken(`${stem} (${counter})${extension}`)) counter += 1;
    finalName = `${stem} (${counter})${extension}`;
  }

  const entity = {
    id: nextId("fil"),
    type: "file",
    name: finalName,
    parentId,
    kind,
    mimeType,
    size,
    itemCount: null,
    storageKey,
    thumbnailKey: null,
    ownerId: "usr_mock",
    createdAt: now,
    updatedAt: now,
    openedAt: now,
    starred: false,
    trashedAt: null,
    share: null,
  };

  drive = [...drive, entity];
  return clone(entity);
}

/**
 * Finds a folder by name inside a parent, or makes it.
 *
 * What a folder upload needs: the browser hands over a flat list of files with
 * paths like `Photos/2026/June/img.jpg`, and every segment has to become a real
 * folder exactly once however many files mention it.
 */
export async function ensureFolder({ parentId, name }) {
  await wait(60);

  const existing = drive.find(
    (item) =>
      item.type === "folder" &&
      item.parentId === parentId &&
      !item.trashedAt &&
      item.name.toLowerCase() === name.toLowerCase(),
  );
  if (existing) return clone(existing);

  return createFolder({ parentId, name });
}

export const __driveSnapshot = () => drive;

/** Test seam — restores the drive to its seeded state. */
export function __resetDrive() {
  drive = FILE_SEED.map((item) => ({ ...item }));
}
