/**
 * The application's own navigation, and the copy around it.
 *
 * The shape deliberately matches `PREVIEW_NAV`, the fixture the landing page's
 * hero renders. A visitor who studied the product preview and then signed in
 * should find the drive they were shown, in the order they were shown it —
 * anything else quietly admits the preview was a picture.
 *
 * Billing is not here. It belongs under Settings, which is where every product
 * of this shape keeps it, and a top-level entry for something you visit twice a
 * year costs a permanent slot in a list you read every day.
 */
export const DASHBOARD_NAV = [
  {
    label: "Browse",
    items: [
      { id: "dashboard", label: "Dashboard", icon: "layout", href: "/dashboard" },
      { id: "files", label: "All files", icon: "folder", href: "/dashboard/files" },
      { id: "recent", label: "Recent", icon: "clock", href: "/dashboard/recent" },
    ],
  },
  {
    label: "Organize",
    items: [
      { id: "starred", label: "Starred", icon: "star", href: "/dashboard/starred" },
      { id: "shared", label: "Shared", icon: "share", href: "/dashboard/shared" },
      { id: "trash", label: "Trash", icon: "trash", href: "/dashboard/trash" },
    ],
  },
  {
    label: "Account",
    items: [
      { id: "storage", label: "Storage", icon: "chart", href: "/dashboard/storage" },
      { id: "settings", label: "Settings", icon: "settings", href: "/dashboard/settings" },
    ],
  },
];

/**
 * How a URL segment reads in the breadcrumb trail.
 *
 * Segments missing from this map are shown as-is, which is exactly what folder
 * navigation will need later: `/dashboard/files/client-work` should render the
 * folder's own name, and that name will come from the folder, not from here.
 */
export const SEGMENT_LABELS = {
  dashboard: "Home",
  files: "All files",
  recent: "Recent",
  starred: "Starred",
  shared: "Shared",
  trash: "Trash",
  search: "Search",
  storage: "Storage",
  settings: "Settings",
  appearance: "Appearance",
  notifications: "Notifications",
  security: "Security",
  shortcuts: "Shortcuts",
  billing: "Billing",
  admin: "Admin",
  users: "Users",
};

/**
 * Where the collapsed sidebar preference is kept.
 *
 * It lives here, in a module with no imports, rather than next to the hook that
 * reads it. The boot script needs this string and the boot script runs from a
 * Server Component — reaching for it through a module that imports React hooks
 * pulls `useSyncExternalStore` into the server graph and the build stops.
 */
export const SIDEBAR_STORAGE_KEY = "datadock:sidebar-collapsed";

export const SHELL = {
  wordmark: "DataDock",
  upload: "Upload",
  /** Says "command interface", not "search box" — because that is what it is. */
  commandTrigger: "Search or run a command",
  skipToContent: "Skip to content",
  collapse: "Collapse sidebar",
  expand: "Expand sidebar",
  openMenu: "Open navigation",
  closeMenu: "Close navigation",
};

export const NOTIFICATIONS = [
  {
    id: "share-viewed",
    icon: "share",
    title: "Northline viewed your link",
    body: "Q3 invoice — Northline.pdf",
    time: "12m ago",
    unread: true,
  },
  {
    id: "upload-done",
    icon: "upload",
    title: "4 files finished uploading",
    body: "Client work / Brand refresh",
    time: "1h ago",
    unread: true,
  },
  {
    id: "link-expiring",
    icon: "clock",
    title: "A share link expires in 3 days",
    body: "Kickoff recording.mp4",
    time: "Yesterday",
    unread: false,
  },
  {
    id: "storage",
    icon: "chart",
    title: "You've used 61% of your storage",
    body: "61.2 GB of 100 GB",
    time: "2 days ago",
    unread: false,
  },
];
