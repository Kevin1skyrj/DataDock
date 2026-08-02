/**
 * Content for the landing page's product preview.
 *
 * Deliberately concrete — real-looking names, sizes and dates. A preview full
 * of "File 1 / File 2" reads as a mockup; this reads as somebody's actual drive.
 */

export const PREVIEW_NAV = [
  {
    label: "Browse",
    items: [
      { id: "dashboard", label: "Dashboard", icon: "layout" },
      { id: "files", label: "All files", icon: "folder", count: "248", active: true },
      { id: "recent", label: "Recent", icon: "clock" },
    ],
  },
  {
    label: "Organize",
    items: [
      { id: "starred", label: "Starred", icon: "star" },
      { id: "shared", label: "Shared", icon: "share", count: "12" },
      { id: "trash", label: "Trash", icon: "trash" },
    ],
  },
  {
    label: "Account",
    items: [
      { id: "storage", label: "Storage", icon: "chart" },
      { id: "settings", label: "Settings", icon: "settings" },
    ],
  },
];

export const PREVIEW_FILES = [
  {
    id: "brand",
    name: "Brand guidelines.pdf",
    kind: "pdf",
    size: "4.2 MB",
    modified: "2 hours ago",
    shared: "Link",
    meta: "PDF · 4.2 MB · 24 pages",
    owner: "You",
    link: "Active",
    expires: "In 14 days",
  },
  {
    id: "invoice",
    name: "Q3 invoice — Northline.pdf",
    kind: "pdf",
    size: "218 KB",
    modified: "Yesterday",
    shared: null,
    meta: "PDF · 218 KB · 2 pages",
    owner: "You",
    link: "Off",
    expires: "—",
  },
  {
    id: "hero",
    name: "homepage-hero@2x.png",
    kind: "image",
    size: "1.8 MB",
    modified: "Yesterday",
    shared: null,
    meta: "PNG · 1.8 MB · 2880×1620",
    owner: "You",
    link: "Off",
    expires: "—",
  },
  {
    id: "kickoff",
    name: "Kickoff recording.mp4",
    kind: "video",
    size: "612 MB",
    modified: "Mar 14",
    shared: "Link",
    meta: "MP4 · 612 MB · 48 min",
    owner: "You",
    link: "Active",
    expires: "In 3 days",
  },
  {
    id: "tokens",
    name: "design-tokens.json",
    kind: "code",
    size: "12 KB",
    modified: "Mar 11",
    shared: null,
    meta: "JSON · 12 KB · 420 lines",
    owner: "You",
    link: "Off",
    expires: "—",
  },
  {
    id: "sow",
    name: "Statement of work.docx",
    kind: "doc",
    size: "86 KB",
    modified: "Mar 9",
    shared: null,
    meta: "DOCX · 86 KB · 9 pages",
    owner: "You",
    link: "Off",
    expires: "—",
  },
];

export const PREVIEW_STORAGE = {
  used: "61.2 GB",
  total: "100 GB",
  percent: 61,
  /** The idle loop creeps toward this, as a background upload would. */
  ceiling: 64,
};

/** What the palette demo types, and the actions it offers alongside results. */
export const PALETTE_DEMO = {
  query: "invoice",
  actions: [
    { id: "new-folder", label: "Create new folder", hint: "⌘N" },
    { id: "share", label: "Create share link", hint: "⌘⇧S" },
  ],
};
