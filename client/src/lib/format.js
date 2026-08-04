/**
 * Turning stored values into readable ones.
 *
 * The entity keeps `size: 4404019` and `updatedAt: "2026-08-03T14:22:00Z"`,
 * because those are the only forms you can sort, compare or total. Everything
 * human happens here, at the last possible moment.
 */

const UNITS = ["B", "KB", "MB", "GB", "TB"];

/**
 * Decimal, not binary.
 *
 * 1 KB is 1000 bytes here. Storage is sold in decimal units, the plan says
 * 100 GB, and a drive that reports 93.1 GB used out of 100 GB because it
 * switched to gibibytes halfway through is a support ticket.
 */
export function formatBytes(bytes) {
  if (bytes == null) return "—";
  if (bytes === 0) return "0 B";

  const exponent = Math.min(Math.floor(Math.log10(Math.abs(bytes)) / 3), UNITS.length - 1);
  const value = bytes / 1000 ** exponent;

  // One decimal place below 100, none above: "4.2 MB" and "612 MB" both read at
  // a glance, "612.4 MB" is a number you have to parse.
  const digits = exponent === 0 || value >= 100 ? 0 : 1;

  return `${value.toFixed(digits)} ${UNITS[exponent]}`;
}

const TIME = new Intl.DateTimeFormat("en-GB", { hour: "2-digit", minute: "2-digit" });
const SHORT = new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "short" });
const LONG = new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "short", year: "numeric" });
const FULL = new Intl.DateTimeFormat("en-GB", { dateStyle: "full", timeStyle: "short" });

const startOfDay = (date) => new Date(date.getFullYear(), date.getMonth(), date.getDate());

/**
 * Absolute, the way a file manager does it — not "2 hours ago".
 *
 * Relative time reads well in a feed and badly in a table: it cannot be scanned
 * down a column, it makes two files modified 90 minutes apart look identical,
 * and it changes while you are looking at it. Finder and Explorer both show the
 * clock time for today and a date beyond it, and they are right.
 *
 * This must only run in the browser. Formatting a date on the server produces
 * the server's timezone and the server's idea of "today", which is a hydration
 * mismatch on any visitor who is not sitting in the same region as the machine.
 * The workspace fetches its rows client-side, so that never arises.
 */
export function formatDate(iso) {
  if (!iso) return "—";

  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "—";

  const today = startOfDay(new Date());
  const then = startOfDay(date);
  const days = Math.round((today - then) / 86_400_000);

  if (days === 0) return `Today, ${TIME.format(date)}`;
  if (days === 1) return `Yesterday, ${TIME.format(date)}`;
  if (date.getFullYear() === today.getFullYear()) return SHORT.format(date);
  return LONG.format(date);
}

/** The unabbreviated form, for a `title` or the details panel. */
export function formatDateFull(iso) {
  if (!iso) return "—";
  const date = new Date(iso);
  return Number.isNaN(date.getTime()) ? "—" : FULL.format(date);
}

export function formatCount(count, singular = "item") {
  return `${count.toLocaleString("en-GB")} ${count === 1 ? singular : `${singular}s`}`;
}
