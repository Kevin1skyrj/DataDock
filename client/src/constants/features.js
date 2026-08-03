/**
 * The six capabilities the landing page leads with.
 *
 * Drawn from the PRD's core features (§12.3 – §12.8), but written as outcomes
 * rather than as a capability list: what stops being annoying, not what the
 * product technically contains. "Restore deleted files" is a feature; "nothing
 * disappears without your say-so" is the reason anyone cares.
 */
export const FEATURES = [
  {
    id: "search",
    icon: "search",
    title: "Find it before you finish typing",
    description:
      "Results narrow with every keystroke — across names, types and dates. No folder archaeology, no waiting on a spinner.",
  },
  {
    id: "share",
    icon: "link",
    title: "Share a link, keep the keys",
    description:
      "Links expire when you say so and can be revoked the moment you change your mind. You always know who opened what.",
  },
  {
    id: "organize",
    icon: "folder",
    title: "Organize the way you already think",
    description:
      "Nest folders as deep as you like, star what you reach for daily, move things by dragging them. It syncs everywhere at once.",
  },
  {
    id: "storage",
    icon: "gauge",
    title: "Always know where you stand",
    description:
      "A live picture of what you are using and what is taking up the room — before you run out, rather than after.",
  },
  {
    id: "trash",
    icon: "restore",
    title: "Nothing leaves without your say-so",
    description:
      "Deleted files wait in Trash for thirty days. One click puts them back exactly where they were, folder and all.",
  },
  {
    id: "preview",
    icon: "preview",
    title: "Open anything without downloading it",
    description:
      "Documents, images, video, audio and code render in place — on any device, without hunting for the right app first.",
  },
];

/** File types the preview card advertises. */
export const PREVIEW_KINDS = ["PDF", "PNG", "MP4", "JSON", "DOCX"];
