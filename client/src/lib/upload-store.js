import { useSyncExternalStore } from "react";

import { ensureFolder, uploadFile, validateUpload } from "@/services/files";

/**
 * The upload queue.
 *
 * Module scope, not React state, and that is the entire design. The brief says
 * the queue stays reachable while you carry on working — which means it has to
 * outlive the workspace, the route and every component that can see it. A
 * provider high enough to survive navigation would still be a provider that
 * re-renders the whole application on every progress tick.
 *
 * So the queue lives here, components subscribe to the slice they need, and
 * uploads keep running while you browse into another folder or open Settings.
 *
 * Two things it deliberately does not do:
 *
 * - It does not hold `File` objects in the snapshot. They are kept in a side
 *   map keyed by id, because a snapshot compared by identity should not carry
 *   megabytes of binary that never changes.
 * - It does not emit per progress event. Six concurrent uploads reporting ten
 *   times a second is sixty renders a second of a panel showing three bars.
 *   Emissions are coalesced to one per frame.
 */

/** How many transfers run at once. Beyond this, browsers queue them anyway. */
const CONCURRENCY = 3;

/** Window over which the speed readout is smoothed, in milliseconds. */
const SPEED_WINDOW = 2000;

let items = [];
let completions = 0;
const listeners = new Set();

/** `id -> { file, controller }`. Never part of the snapshot. */
const payloads = new Map();

let frame = null;

function emit() {
  // Coalesced to a frame. Progress arrives far faster than anything can be
  // drawn, and the extra renders are pure waste.
  if (frame !== null) return;
  frame = requestAnimationFrame(() => {
    frame = null;
    for (const listener of listeners) listener();
  });
}

function patch(id, changes) {
  items = items.map((item) => (item.id === id ? { ...item, ...changes } : item));
  emit();
}

/* --------------------------------------------------------------- reading -- */

function subscribe(onStoreChange) {
  listeners.add(onStoreChange);
  return () => {
    listeners.delete(onStoreChange);
  };
}

const getSnapshot = () => items;
const EMPTY = [];
const getServerSnapshot = () => EMPTY;

export function useUploads() {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}

/**
 * How many uploads have landed in a folder.
 *
 * The workspace folds this into the key its listing is fetched against, so a
 * finished upload refreshes the folder it landed in without an effect watching
 * for it and without touching any folder it did not.
 */
export function useUploadsLandedIn(parentId) {
  return useSyncExternalStore(
    subscribe,
    () => items.filter((item) => item.status === "done" && item.parentId === parentId).length,
    () => 0,
  );
}

/** Rolled up for the manager's header and the toolbar's indicator. */
export function summarise(list) {
  const active = list.filter((item) => item.status === "uploading");
  const queued = list.filter((item) => item.status === "queued");
  const failed = list.filter((item) => item.status === "failed");
  const done = list.filter((item) => item.status === "done");

  const running = [...active, ...queued];
  const total = running.reduce((sum, item) => sum + item.size, 0);
  const loaded = running.reduce((sum, item) => sum + item.loaded, 0);
  const speed = active.reduce((sum, item) => sum + item.speed, 0);

  return {
    active,
    queued,
    failed,
    done,
    inFlight: running.length,
    total,
    loaded,
    speed,
    // Only meaningful while something is moving; a stalled queue would
    // otherwise report an eternity.
    eta: speed > 0 && total > loaded ? Math.round((total - loaded) / speed) : null,
  };
}

/* --------------------------------------------------------------- writing -- */

let sequence = 0;

/**
 * @param {{file: File, path?: string}[]} entries `path` is the folder chain a
 *   dropped or picked directory carried with it, `Photos/2026/img.jpg`
 * @param {string|null} parentId where the upload was started
 */
export function enqueue(entries, parentId) {
  const added = entries.map(({ file, path }) => {
    const id = `up_${Date.now().toString(36)}_${sequence++}`;
    payloads.set(id, { file, controller: null });

    const invalid = validateUpload({ name: file.name, size: file.size });

    return {
      id,
      name: file.name,
      // The folder chain, without the filename. Empty for a plain file upload.
      path: path ? path.split("/").slice(0, -1).filter(Boolean) : [],
      size: file.size,
      mimeType: file.type,
      // Where the *upload* was started. The real parent is resolved later, once
      // the folder chain has been created.
      rootId: parentId,
      parentId,
      loaded: 0,
      speed: 0,
      status: invalid ? "failed" : "queued",
      error: invalid,
      startedAt: null,
    };
  });

  items = [...items, ...added];
  emit();
  pump();
  return added;
}

export function cancel(id) {
  const payload = payloads.get(id);
  payload?.controller?.abort();
  patch(id, { status: "cancelled", speed: 0 });
  pump();
}

export function retry(id) {
  patch(id, { status: "queued", error: null, loaded: 0, speed: 0, startedAt: null });
  pump();
}

export function retryAll() {
  items = items.map((item) =>
    item.status === "failed"
      ? { ...item, status: "queued", error: null, loaded: 0, speed: 0, startedAt: null }
      : item,
  );
  emit();
  pump();
}

export function remove(id) {
  payloads.delete(id);
  items = items.filter((item) => item.id !== id);
  emit();
}

export function clearFinished() {
  for (const item of items) {
    if (item.status === "done" || item.status === "cancelled") payloads.delete(item.id);
  }
  items = items.filter((item) => item.status !== "done" && item.status !== "cancelled");
  emit();
}

export function clearAll() {
  for (const item of items) {
    if (item.status === "uploading") payloads.get(item.id)?.controller?.abort();
  }
  payloads.clear();
  items = [];
  emit();
}

/* ----------------------------------------------------------------- pump -- */

/**
 * Resolves `Photos/2026/June` into a real folder id, making what is missing.
 *
 * The cache holds *promises*, not ids, and that is the whole point of it.
 *
 * Three uploads from the same dropped folder start at once and all three need
 * `Photos/2026`. Caching resolved ids means all three find the cache empty, all
 * three call `ensureFolder`, and the two that lose the race are rejected for a
 * name conflict — so a folder of two hundred photos uploads the first three and
 * fails the rest. Caching the in-flight promise makes the other two await the
 * first one's creation instead of competing with it.
 *
 * A rejection is evicted rather than cached, or one transient failure would
 * poison that folder for the rest of the session.
 */
const folderCache = new Map();

async function resolveParent(item) {
  if (item.path.length === 0) return item.rootId;

  let parentId = item.rootId;
  let key = String(item.rootId);

  for (const segment of item.path) {
    key += `/${segment}`;

    let pending = folderCache.get(key);
    if (!pending) {
      const cacheKey = key;
      pending = ensureFolder({ parentId, name: segment })
        .then((folder) => folder.id)
        .catch((failure) => {
          folderCache.delete(cacheKey);
          throw failure;
        });
      folderCache.set(cacheKey, pending);
    }

    // Sequential by necessity: each level needs the id of the one above it.
    parentId = await pending;
  }

  return parentId;
}

function pump() {
  const running = items.filter((item) => item.status === "uploading").length;
  const next = items.filter((item) => item.status === "queued").slice(0, CONCURRENCY - running);

  if (running === 0 && next.length === 0) folderCache.clear();

  for (const item of next) start(item.id);
}

async function start(id) {
  const payload = payloads.get(id);
  const item = items.find((candidate) => candidate.id === id);
  if (!payload || !item) return;

  const controller = new AbortController();
  payload.controller = controller;

  patch(id, { status: "uploading", startedAt: Date.now(), loaded: 0 });

  // A short history of (time, bytes) so the speed readout is an average rather
  // than whatever the last tick happened to be.
  const samples = [{ at: Date.now(), loaded: 0 }];

  try {
    const parentId = await resolveParent(item);
    if (controller.signal.aborted) return;
    patch(id, { parentId });

    await uploadFile({
      file: payload.file,
      parentId,
      signal: controller.signal,
      onProgress: (loaded) => {
        const now = Date.now();
        samples.push({ at: now, loaded });
        while (samples.length > 2 && now - samples[0].at > SPEED_WINDOW) samples.shift();

        const first = samples[0];
        const seconds = (now - first.at) / 1000;
        const speed = seconds > 0 ? (loaded - first.loaded) / seconds : 0;

        patch(id, { loaded, speed });
      },
    });

    completions += 1;
    patch(id, { status: "done", loaded: item.size, speed: 0 });
  } catch (failure) {
    if (controller.signal.aborted) patch(id, { status: "cancelled", speed: 0 });
    else patch(id, { status: "failed", error: failure.message, speed: 0 });
  } finally {
    payload.controller = null;
    pump();
  }
}

/** Test seams — the queue is worth exercising without a browser. */
export const __peek = () => items;

export function __resetUploads() {
  items = [];
  completions = 0;
  payloads.clear();
  folderCache.clear();
}
