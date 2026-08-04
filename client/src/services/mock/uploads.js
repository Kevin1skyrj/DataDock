import { kindOf } from "@/constants/file-kinds";
import { FileServiceError } from "@/services/mock/files";
import { attachUploaded } from "@/services/mock/files";

/**
 * Putting bytes somewhere.
 *
 * The real flow is three calls, not one: ask the API for a presigned target,
 * PUT the bytes straight at S3, then tell the API it landed. The browser never
 * streams a file through your own server, which is the whole reason for the
 * dance. This mock keeps that shape rather than collapsing it, because the
 * middle step is the only one that reports progress and the only one that can
 * be aborted — and a component built against a single opaque `upload()` would
 * have nowhere to put either.
 *
 *   createUpload()   → { uploadId, uploadUrl }      the API
 *   transfer()       → progress, abortable          S3, directly
 *   completeUpload() → the entity                   the API again
 *
 * Only `uploadFile` is exported to the queue. It is the seam: swap its three
 * internals for real calls and nothing above it changes.
 */

/** Bytes per second the mock pretends the connection manages. */
const MOCK_BPS = 2_600_000;
const TICK_MS = 120;

/** Anything larger is refused before a single byte moves. */
export const MAX_UPLOAD_BYTES = 2_000_000_000;

/** Reserved names that always fail, so the failure path is reachable on demand. */
const DOOMED = /(^|\/)fail[-.]/i;

const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * Refused before anything is transferred.
 *
 * Validation belongs here rather than in the queue because the server will
 * enforce it regardless — quota, type bans, name length — and a rule the client
 * owns alone is a rule that disagrees with the server the first time someone
 * uses a different client.
 */
export function validateUpload({ name, size }) {
  if (!name?.trim()) return "That file has no name.";
  if (size === 0) return "That file is empty.";
  if (size > MAX_UPLOAD_BYTES) return "That file is larger than 2 GB.";
  return null;
}

let sequence = 0;
const nextId = (prefix) => `${prefix}_${Date.now().toString(36)}${(sequence++).toString(36)}`;

async function createUpload({ name, size, parentId }) {
  await wait(90);
  return {
    uploadId: nextId("upl"),
    // Where the bytes go. Presigned, short-lived, and never stored on an entity.
    uploadUrl: `https://mock-s3.datadock.app/${parentId ?? "root"}/${encodeURIComponent(name)}`,
    storageKey: `usr_mock/${new Date().getFullYear()}/${nextId("fil")}`,
  };
}

/**
 * The transfer itself.
 *
 * Reports bytes rather than percentages, because percentages cannot be summed:
 * an upload manager showing overall progress across six files of wildly
 * different sizes has to add up bytes, and converting back and forth loses the
 * only number that is actually additive.
 */
function transfer({ size, onProgress, signal }) {
  return new Promise((resolve, reject) => {
    if (signal?.aborted) {
      reject(new FileServiceError("Upload cancelled.", { code: "aborted" }));
      return;
    }

    let loaded = 0;
    // Jitter, so six simultaneous uploads do not advance in lockstep like a
    // progress bar nobody believes.
    const rate = MOCK_BPS * (0.7 + Math.random() * 0.6);

    const step = () => {
      loaded = Math.min(size, loaded + (rate * TICK_MS) / 1000);
      onProgress?.(loaded);
      if (loaded >= size) {
        cleanup();
        resolve();
      }
    };

    const timer = window.setInterval(step, TICK_MS);

    const onAbort = () => {
      cleanup();
      reject(new FileServiceError("Upload cancelled.", { code: "aborted" }));
    };

    function cleanup() {
      window.clearInterval(timer);
      signal?.removeEventListener("abort", onAbort);
    }

    signal?.addEventListener("abort", onAbort);
  });
}

async function completeUpload({ name, size, mimeType, parentId, storageKey }) {
  await wait(140);

  if (DOOMED.test(name)) {
    throw new FileServiceError("The server rejected this file.", { code: "upload-rejected" });
  }

  return attachUploaded({
    name,
    size,
    mimeType: mimeType || "application/octet-stream",
    kind: kindOf(mimeType),
    parentId,
    storageKey,
  });
}

/**
 * @param {object} options
 * @param {{name: string, size: number, type: string}} options.file
 * @param {string|null} options.parentId
 * @param {(loaded: number) => void} [options.onProgress] bytes, not percent
 * @param {AbortSignal} [options.signal]
 * @returns {Promise<object>} the created entity
 */
export async function uploadFile({ file, parentId, onProgress, signal }) {
  const invalid = validateUpload(file);
  if (invalid) throw new FileServiceError(invalid, { code: "invalid" });

  const { storageKey } = await createUpload({ name: file.name, size: file.size, parentId });
  await transfer({ size: file.size, onProgress, signal });

  return completeUpload({
    name: file.name,
    size: file.size,
    mimeType: file.type,
    parentId,
    storageKey,
  });
}
