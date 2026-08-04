import { DRIVE_QUOTA_BYTES } from "@/services/mock/file-seed";
import { __driveSnapshot } from "@/services/mock/files";

/**
 * What the drive adds up to.
 *
 * Every function here is an aggregate, and every one of them is a query the
 * database should be running rather than something the browser computes over a
 * list it had to download first. That is why they are service calls returning
 * finished numbers, not selectors over `listItems` — a breakdown by kind is one
 * `$group` in Mongo and would be a full collection scan in JavaScript.
 *
 * The activity feed is *derived from timestamps* rather than read from an event
 * log, and that is a deliberate limit of the mock rather than a design. A real
 * deployment writes an events collection; this reconstructs what it can from
 * `createdAt`, `updatedAt`, `trashedAt` and the share, which is enough to be
 * honest and stays correct after any mutation without instrumenting one.
 */

const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const DAY = 86_400_000;
const daysAgo = (iso) => (Date.now() - new Date(iso).getTime()) / DAY;

/* ---------------------------------------------------------- the totals -- */

export async function getStorageSummary() {
  await wait(220);

  const drive = __driveSnapshot();
  const live = drive.filter((item) => item.type === "file" && !item.trashedAt);
  const binned = drive.filter((item) => item.type === "file" && item.trashedAt);

  const used = live.reduce((sum, item) => sum + (item.size ?? 0), 0);
  // Trash still occupies storage. A dashboard that reports it as free is the
  // reason people cannot work out where their space went.
  const trashed = binned.reduce((sum, item) => sum + (item.size ?? 0), 0);

  return {
    used,
    trashed,
    quota: DRIVE_QUOTA_BYTES,
    available: Math.max(0, DRIVE_QUOTA_BYTES - used - trashed),
    fileCount: live.length,
    folderCount: drive.filter((item) => item.type === "folder" && !item.trashedAt).length,
    plan: { name: "Pro", quotaLabel: "100 GB", renews: "2026-09-01T00:00:00.000Z" },
  };
}

/** One `$group` by kind, sorted biggest first. */
export async function getStorageBreakdown() {
  await wait(260);

  const totals = new Map();

  for (const item of __driveSnapshot()) {
    if (item.type !== "file" || item.trashedAt) continue;
    const current = totals.get(item.kind) ?? { kind: item.kind, bytes: 0, count: 0 };
    current.bytes += item.size ?? 0;
    current.count += 1;
    totals.set(item.kind, current);
  }

  return [...totals.values()].sort((a, b) => b.bytes - a.bytes);
}

export async function getLargestFiles(limit = 8) {
  await wait(240);

  return __driveSnapshot()
    .filter((item) => item.type === "file" && !item.trashedAt)
    .sort((a, b) => (b.size ?? 0) - (a.size ?? 0))
    .slice(0, limit)
    .map((item) => ({ ...item }));
}

/* --------------------------------------------------------- the feed -- */

export async function getStorageActivity(limit = 12) {
  await wait(260);

  const events = [];

  for (const item of __driveSnapshot()) {
    if (item.trashedAt) {
      events.push({ id: `${item.id}-trash`, type: "deleted", at: item.trashedAt, item });
      continue;
    }

    events.push({
      id: `${item.id}-create`,
      type: item.type === "folder" ? "created" : "uploaded",
      at: item.createdAt,
      item,
    });

    if (item.updatedAt !== item.createdAt) {
      events.push({ id: `${item.id}-update`, type: "modified", at: item.updatedAt, item });
    }

    if (item.share) {
      events.push({ id: `${item.id}-share`, type: "shared", at: item.updatedAt, item });
    }
  }

  return events.sort((a, b) => b.at.localeCompare(a.at)).slice(0, limit);
}

/* -------------------------------------------------------- the assistant -- */

/** Anything this large is worth a second look before it is worth a bigger plan. */
const LARGE_BYTES = 100_000_000;
const STALE_DAYS = 90;
const OLD_TRASH_DAYS = 30;

/**
 * Things worth doing, ordered by what they would give back.
 *
 * Framed as suggestions rather than warnings on purpose. A storage page that
 * opens with a red bar and the word "full" is a page people close. Each of
 * these is a specific, reversible action with a number attached, and every one
 * of them is optional.
 */
export async function getCleanupSuggestions() {
  await wait(320);

  const drive = __driveSnapshot();
  const live = drive.filter((item) => item.type === "file" && !item.trashedAt);
  const suggestions = [];

  const stale = live.filter(
    (item) => (item.size ?? 0) >= LARGE_BYTES && daysAgo(item.openedAt) > STALE_DAYS,
  );
  if (stale.length) {
    suggestions.push({
      id: "large-unused",
      title: "Large files you have not opened",
      body: `Nothing has touched these in over ${STALE_DAYS} days.`,
      action: "review",
      items: stale,
      reclaimable: stale.reduce((sum, item) => sum + item.size, 0),
    });
  }

  // Same name and same size in two places is what a duplicate actually looks
  // like. Matching on name alone flags every `index.js` in the drive.
  const byFingerprint = new Map();
  for (const item of live) {
    const key = `${item.name.toLowerCase()}:${item.size}`;
    byFingerprint.set(key, [...(byFingerprint.get(key) ?? []), item]);
  }
  const duplicates = [...byFingerprint.values()].filter((group) => group.length > 1).flat();
  if (duplicates.length) {
    suggestions.push({
      id: "duplicates",
      title: "Possible duplicates",
      body: "Same name and same size, in more than one place.",
      action: "review",
      items: duplicates,
      // Only the copies are reclaimable, never the original.
      reclaimable: [...byFingerprint.values()]
        .filter((group) => group.length > 1)
        .reduce((sum, group) => sum + group[0].size * (group.length - 1), 0),
    });
  }

  const oldTrash = drive.filter(
    (item) => item.trashedAt && daysAgo(item.trashedAt) > OLD_TRASH_DAYS,
  );
  if (oldTrash.length) {
    suggestions.push({
      id: "old-trash",
      title: "Trash older than a month",
      body: "Still taking up space until it is emptied.",
      action: "trash",
      items: oldTrash,
      reclaimable: oldTrash.reduce((sum, item) => sum + (item.size ?? 0), 0),
    });
  }

  const empty = drive.filter(
    (item) =>
      item.type === "folder" &&
      !item.trashedAt &&
      !drive.some((child) => child.parentId === item.id && !child.trashedAt),
  );
  if (empty.length) {
    suggestions.push({
      id: "empty-folders",
      title: "Empty folders",
      body: "Nothing inside them.",
      action: "review",
      items: empty,
      reclaimable: 0,
    });
  }

  return suggestions.sort((a, b) => b.reclaimable - a.reclaimable);
}
