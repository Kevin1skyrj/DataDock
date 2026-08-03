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
    name: "Search",
    icon: "search",
    shortcut: ["⌘", "K"],
    title: "Find it before you finish typing.",
    description: "Results narrow with every keystroke — across names, types and dates.",
  },
  {
    id: "share",
    name: "Sharing",
    icon: "link",
    shortcut: ["⌘", "⇧", "S"],
    title: "Share a link, keep the keys.",
    description:
      "Links expire when you say so, can be revoked at any time, and tell you who opened them.",
  },
  {
    id: "organize",
    name: "Folders",
    icon: "folder",
    shortcut: ["⌘", "⇧", "N"],
    title: "Organize the way you already think.",
    description: "Nest as deep as you like, star what you reach for, drag things where they go.",
  },
  {
    id: "storage",
    name: "Storage",
    icon: "gauge",
    shortcut: ["G", "U"],
    title: "Always know where you stand.",
    description:
      "What you are using and what is taking up the room — before you run out, not after.",
  },
  {
    id: "trash",
    name: "Trash",
    icon: "restore",
    shortcut: ["⌘", "⌫"],
    title: "Nothing leaves without your say-so.",
    description: "Deleted files wait thirty days. One click puts them back, folder and all.",
  },
  {
    id: "preview",
    name: "Previews",
    icon: "preview",
    shortcut: ["space"],
    title: "Open anything without downloading it.",
    description: "Documents, images, video, audio and code render in place, on any device.",
  },
];

/**
 * Where each card's light sits, as a percentage across its top edge.
 *
 * The reference this pattern comes from gives every card its own hue. That
 * cannot work here: DataDock has one switchable accent, so six fixed colours
 * would abandon the palette for anyone who is not on blue. Varying the origin
 * of a brand-derived wash gives the cards the same individuality while every
 * one of them still answers the accent switch.
 */
export const CARD_LIGHT = [22, 55, 80, 38, 68, 48];
