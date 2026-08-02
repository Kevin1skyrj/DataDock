/**
 * Whether the hero's entrance has already played in this browsing session.
 *
 * Cinematic on the first view, respectful on the fifth. The flag is
 * session-scoped on purpose: a returning visitor tomorrow gets the full
 * sequence again, but someone bouncing between the landing page and /login
 * does not sit through it every time.
 *
 * `sessionStorage` throws in Safari's private mode and under some embedding
 * policies, so every access is guarded. Failing to read is treated as "not
 * seen": the worst outcome is that the entrance plays, which is the intended
 * behaviour anyway.
 */
export const ENTRANCE_STORAGE_KEY = "datadock:hero-entrance";

const KEY = ENTRANCE_STORAGE_KEY;

export function hasSeenEntrance() {
  try {
    return window.sessionStorage.getItem(KEY) === "1";
  } catch {
    return false;
  }
}

export function markEntranceSeen() {
  try {
    window.sessionStorage.setItem(KEY, "1");
  } catch {
    /* Non-fatal: the entrance simply plays again next view. */
  }
}
