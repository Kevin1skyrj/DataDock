/**
 * Keys live here, in a module with no imports, because the boot script needs
 * them and the boot script runs from a Server Component.
 */
export const DENSITY_STORAGE_KEY = "datadock:density";
export const MOTION_STORAGE_KEY = "datadock:reduce-motion";

export const SETTINGS_SECTIONS = [
  { id: "profile", label: "Profile", href: "/dashboard/settings" },
  { id: "appearance", label: "Appearance", href: "/dashboard/settings/appearance" },
  { id: "notifications", label: "Notifications", href: "/dashboard/settings/notifications" },
  { id: "security", label: "Security", href: "/dashboard/settings/security" },
  { id: "shortcuts", label: "Shortcuts", href: "/dashboard/settings/shortcuts" },
  { id: "billing", label: "Billing", href: "/dashboard/settings/billing" },
];

export const DENSITY_OPTIONS = [
  { id: "comfortable", label: "Comfortable", hint: "Roomier rows, easier to hit" },
  { id: "compact", label: "Compact", hint: "More on screen at once" },
];

export const THEME_OPTIONS = [
  { id: "light", label: "Light" },
  { id: "dark", label: "Dark" },
  { id: "system", label: "System" },
];

/**
 * What we would email about.
 *
 * Grouped by whether the message is about *your* work or about your *account*,
 * because those are the two reasons anyone opens a notification settings page —
 * and because security notices are the one group that should feel harder to
 * turn off than the rest.
 */
export const NOTIFICATION_GROUPS = [
  {
    id: "activity",
    label: "Activity",
    items: [
      {
        id: "uploads",
        label: "Upload finished",
        hint: "When a large upload or import completes.",
      },
      {
        id: "sharing",
        label: "Someone opened a share link",
        hint: "The first time each person views a file you shared.",
      },
      {
        id: "comments",
        label: "Comments and mentions",
        hint: "When someone replies on a file you can see.",
      },
    ],
  },
  {
    id: "account",
    label: "Account",
    items: [
      {
        id: "security",
        label: "Security alerts",
        hint: "New sign-ins, password changes, and recovery attempts.",
        // Turning these off is how account takeovers go unnoticed. Offered, but
        // marked — this is the one switch that should give someone pause.
        sensitive: true,
      },
      {
        id: "storage",
        label: "Storage warnings",
        hint: "When the drive passes 80% and again at 95%.",
      },
      {
        id: "product",
        label: "Product updates",
        hint: "Occasional notes about what is new. No more than monthly.",
      },
    ],
  },
];

export const NOTIFICATION_DEFAULTS = {
  uploads: true,
  sharing: true,
  comments: false,
  security: true,
  storage: true,
  product: false,
};

/**
 * Every shortcut the product actually binds.
 *
 * Written down in one place because a shortcuts page that drifts from the code
 * is worse than no shortcuts page — it teaches keys that do nothing. Each entry
 * here corresponds to a real handler; `mod` is substituted for ⌘ or Ctrl at
 * render, so the page is right on whichever keyboard is reading it.
 */
export const SHORTCUT_GROUPS = [
  {
    id: "global",
    label: "Anywhere",
    items: [
      { keys: ["mod", "K"], label: "Open the command palette" },
      { keys: ["mod", "B"], label: "Collapse or expand the sidebar" },
      { keys: ["mod", "I"], label: "Show or hide the details panel" },
      { keys: ["Esc"], label: "Close whatever is open" },
    ],
  },
  {
    id: "browsing",
    label: "Browsing files",
    items: [
      { keys: ["↑", "↓"], label: "Move between files" },
      { keys: ["←", "→"], label: "Move across the grid" },
      { keys: ["Shift", "↑↓"], label: "Extend the selection" },
      { keys: ["mod", "A"], label: "Select everything" },
      { keys: ["Space"], label: "Preview the focused file" },
      { keys: ["Enter"], label: "Open a folder, or preview a file" },
      { keys: ["mod", "↑"], label: "Go up a folder" },
    ],
  },
  {
    id: "editing",
    label: "Working with files",
    items: [
      { keys: ["F2"], label: "Rename" },
      { keys: ["mod", "C"], label: "Copy" },
      { keys: ["mod", "V"], label: "Paste into this folder" },
      { keys: ["mod", "D"], label: "Duplicate" },
      { keys: ["Delete"], label: "Move to trash" },
    ],
  },
  {
    id: "preview",
    label: "In the preview",
    items: [
      { keys: ["←", "→"], label: "Previous or next file" },
      { keys: ["Space"], label: "Close the preview" },
    ],
  },
];
