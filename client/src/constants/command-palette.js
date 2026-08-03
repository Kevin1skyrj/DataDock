import { PREVIEW_FILES } from "@/constants/preview-data";

/**
 * The command set behind the showcase palette.
 *
 * Three groups on purpose — Find, Do, Go — because that is the whole mental
 * model of a command palette, and a visitor who leaves understanding those
 * three understands the product's keyboard story.
 *
 * Files come from the same fixture the hero renders, so the palette is
 * searching the drive the visitor has already seen rather than a second,
 * invented one.
 */
export const COMMAND_GROUPS = [
  { id: "files", label: "Files" },
  { id: "actions", label: "Actions" },
  { id: "navigate", label: "Go to" },
];

const FILE_COMMANDS = PREVIEW_FILES.map((file) => ({
  id: `file-${file.id}`,
  group: "files",
  icon: file.kind,
  label: file.name,
  hint: file.size,
  keywords: [file.kind, "file", "open", file.modified],
  result: `Opened ${file.name}`,
}));

const ACTION_COMMANDS = [
  {
    id: "upload",
    group: "actions",
    icon: "upload",
    label: "Upload files",
    hint: "⌘U",
    keywords: ["add", "import", "new", "drop"],
    result: "Upload started — 3 files queued",
  },
  {
    id: "new-folder",
    group: "actions",
    icon: "folder-plus",
    label: "Create new folder",
    hint: "⌘⇧N",
    keywords: ["add", "directory", "organize"],
    result: "Created “Untitled folder”",
  },
  {
    id: "share",
    group: "actions",
    icon: "link",
    label: "Create share link",
    hint: "⌘⇧S",
    keywords: ["send", "invite", "public", "url"],
    result: "Share link copied — expires in 14 days",
  },
  {
    id: "star",
    group: "actions",
    icon: "star",
    label: "Star selection",
    hint: "⌘D",
    keywords: ["favourite", "favorite", "bookmark", "pin"],
    result: "Added to Starred",
  },
  {
    id: "trash",
    group: "actions",
    icon: "trash",
    label: "Move to Trash",
    hint: "⌘⌫",
    keywords: ["delete", "remove", "bin"],
    result: "Moved to Trash — recoverable for 30 days",
  },
];

const NAVIGATE_COMMANDS = [
  {
    id: "go-dashboard",
    group: "navigate",
    icon: "layout",
    label: "Dashboard",
    hint: "G D",
    keywords: ["home", "overview"],
    result: "Jumped to Dashboard",
  },
  {
    id: "go-files",
    group: "navigate",
    icon: "folder",
    label: "All files",
    hint: "G F",
    keywords: ["browse", "drive"],
    result: "Jumped to All files",
  },
  {
    id: "go-starred",
    group: "navigate",
    icon: "star",
    label: "Starred",
    hint: "G S",
    keywords: ["favourite", "favorite", "pinned"],
    result: "Jumped to Starred",
  },
  {
    id: "go-shared",
    group: "navigate",
    icon: "share",
    label: "Shared with others",
    hint: "G H",
    keywords: ["links", "people", "collaborate"],
    result: "Jumped to Shared",
  },
  {
    id: "go-storage",
    group: "navigate",
    icon: "chart",
    label: "Storage & usage",
    hint: "G U",
    keywords: ["space", "quota", "plan", "billing"],
    result: "Jumped to Storage",
  },
  {
    id: "go-settings",
    group: "navigate",
    icon: "settings",
    label: "Settings",
    hint: "G ,",
    keywords: ["preferences", "account", "profile"],
    result: "Jumped to Settings",
  },
];

export const COMMANDS = [...FILE_COMMANDS, ...ACTION_COMMANDS, ...NAVIGATE_COMMANDS];

/** Most a single group contributes, so no one group can crowd out the others. */
export const GROUP_LIMIT = 4;

/** Offered under an empty field, the way a real palette suggests a starting point. */
export const SUGGESTIONS = ["invoice", "share", "starred", "upload"];

/**
 * The keyboard vocabulary, shown as physical keycaps. Chords are arrays so each
 * key renders as its own cap, which is what `Kbd`'s docblock asks for.
 */
export const SHORTCUTS = [
  { keys: ["⌘", "K"], label: "Open the palette" },
  { keys: ["⌘", "U"], label: "Upload" },
  { keys: ["⌘", "⇧", "N"], label: "New folder" },
  { keys: ["⌘", "⇧", "S"], label: "Share link" },
  { keys: ["G", "S"], label: "Go to Starred" },
  { keys: ["⌘", "⌫"], label: "Move to Trash" },
];
