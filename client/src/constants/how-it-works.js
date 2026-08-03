/**
 * The four beats of "How it works".
 *
 * The stage follows one file through all four rather than showing four
 * unrelated demos — and it is deliberately the same file the hero's command
 * palette finds, so the two sections read as one product rather than two
 * illustrations.
 */
export const HOW_STEPS = [
  {
    id: "upload",
    icon: "upload",
    title: "Upload",
    description:
      "Drag in a file, a folder, or a hundred of them. Transfers pick up where they left off if the connection drops.",
    hint: "Drag & drop, or ⌘U",
    status: "Uploaded · 4.2 MB in 1.8s",
  },
  {
    id: "organize",
    icon: "folder",
    title: "Organize",
    description:
      "Drop it once and it lands where it belongs. Folders, stars and tags stay in sync on every device you own.",
    hint: "Choose a home",
    status: "Filed to Invoices 2026",
  },
  {
    id: "search",
    icon: "search",
    title: "Search",
    description:
      "Find anything by name, type or date. Results narrow as you type — usually before you finish the word.",
    hint: "Search everything",
    status: "1 result · 12 ms",
  },
  {
    id: "share",
    icon: "share",
    title: "Share",
    description:
      "Send a link that expires when you say so. Revoke it at any time, and see exactly who opened it.",
    hint: "Anyone with the link",
    status: "Link copied · expires in 14 days",
  },
];

/** How long each step holds before the sequence advances itself, in seconds. */
export const STEP_DWELL = 5.2;

/** Folders offered in the organize step; the second is where the file lands. */
export const HOW_FOLDERS = ["Client work", "Invoices 2026", "Archive"];

/** What the search step has typed so far, matched against the file's name. */
export const HOW_QUERY = "invo";

export const HOW_SHARE_LINK = "datadock.app/s/9fK2xQ";
