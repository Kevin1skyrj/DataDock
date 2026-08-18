import {
  CopyPlus,
  Download,
  FolderInput,
  Scissors,
  Link2,
  Pencil,
  RotateCcw,
  Share2,
  SquareArrowOutUpRight,
  Trash2,
  X,
} from "lucide-react";

/**
 * Everything that can be done to a file, defined once.
 *
 * Three surfaces need this list and they must never disagree: the context menu,
 * the selection toolbar, and — next milestone — the command palette. Written
 * three times, "Rename" would end up enabled for multi-selections in one of
 * them, and that one would be whichever nobody tested.
 *
 * So each action declares its own rules and its own work, and the surfaces only
 * decide how to draw it:
 *
 *   enabled(selection)            whether it applies to what is chosen right now
 *   run(selection, handlers)      what it does
 *   primary                       toolbar shows it, or buries it under "More"
 *   danger                        drawn as destructive
 *   group                         where a separator goes in a menu
 *
 * `run` takes its handlers as an argument rather than being built with them
 * bound in. Binding would mean composing the list during render out of closures
 * that reach into workspace state, and React is right to object to that — the
 * list is data, and calling it is an event. Every surface therefore invokes
 * `action.run(scope, handlers)` from its own click handler.
 *
 * Nothing here imports the service. Actions describe intent; the workspace owns
 * the mutation, the optimistic update and the failure — which is why the same
 * definitions will work unchanged when the service is an HTTP client.
 */

const single = (selection) => selection.length === 1;
const any = (selection) => selection.length > 0;
const onlyFiles = (selection) =>
  selection.length > 0 && selection.every((item) => item.type === "file");

const ACTIONS = {
  open: {
    id: "open",
    label: "Open",
    icon: SquareArrowOutUpRight,
    shortcut: "↵",
    group: "primary",
    enabled: single,
    run: (selection, handlers) => handlers.open(selection[0]),
  },
  preview: {
    id: "preview",
    label: "Preview",
    icon: SquareArrowOutUpRight,
    shortcut: "Space",
    group: "primary",
    // A folder has nothing to preview — it has contents, which is what Open is.
    enabled: (selection) => single(selection) && selection[0].type === "file",
    run: (selection, handlers) => handlers.preview(selection[0]),
  },
  rename: {
    id: "rename",
    label: "Rename",
    icon: Pencil,
    shortcut: "F2",
    group: "edit",
    enabled: single,
    run: (selection, handlers) => handlers.rename(selection[0]),
  },
  move: {
    id: "move",
    label: "Move to…",
    icon: FolderInput,
    group: "edit",
    primary: true,
    enabled: any,
    run: (selection, handlers) => handlers.move(selection),
  },
  duplicate: {
    id: "duplicate",
    label: "Duplicate",
    icon: CopyPlus,
    shortcut: "⌘D",
    group: "edit",
    enabled: any,
    run: (selection, handlers) => handlers.duplicate(selection),
  },
  cut: {
    id: "cut",
    label: "Cut",
    icon: Scissors,
    shortcut: "⌘X",
    group: "edit",
    enabled: any,
    run: (selection, handlers) => handlers.cut(selection),
  },
  share: {
    id: "share",
    label: "Share",
    icon: Share2,
    group: "edit",
    primary: true,
    enabled: single,
    run: (selection, handlers) => handlers.share(selection[0]),
  },
  copyLink: {
    id: "copyLink",
    label: "Copy link",
    icon: Link2,
    group: "edit",
    enabled: (selection) => single(selection) && Boolean(selection[0].share),
    run: (selection, handlers) => handlers.copyLink(selection[0]),
  },
  revokeShare: {
    id: "revokeShare",
    label: "Stop sharing",
    icon: Link2,
    group: "edit",
    enabled: (selection) => single(selection) && Boolean(selection[0].share),
    run: (selection, handlers) => handlers.revokeShare(selection[0]),
  },
  download: {
    id: "download",
    label: "Download",
    icon: Download,
    shortcut: "⌘↓",
    group: "edit",
    primary: true,
    // Zipping a folder is a server job that does not exist yet, and offering it
    // would be a promise the product cannot keep.
    enabled: (selection) => single(selection) && selection[0].type === "file",
    run: (selection, handlers) => handlers.download(selection),
  },
  trash: {
    id: "trash",
    label: "Move to trash",
    icon: Trash2,
    shortcut: "⌫",
    group: "danger",
    primary: true,
    danger: true,
    enabled: any,
    run: (selection, handlers) => handlers.trash(selection),
  },

  /* -------------------------------------------- for the Trash view later -- */

  restore: {
    id: "restore",
    label: "Restore",
    icon: RotateCcw,
    group: "primary",
    primary: true,
    enabled: any,
    run: (selection, handlers) => handlers.restore(selection),
  },
  deleteForever: {
    id: "deleteForever",
    label: "Delete forever",
    icon: X,
    group: "danger",
    primary: true,
    danger: true,
    enabled: any,
    run: (selection, handlers) => handlers.deleteForever(selection),
  },
};

/**
 * The actions a view offers, in the view's order, filtered to what applies.
 *
 * Disabled entries are dropped rather than greyed out. A menu of eight items
 * where five are unavailable is a menu you have to read twice; showing three is
 * faster to use and truthful about what is possible. The toolbar makes the same
 * choice for the same reason.
 */
export function buildFileActions({ view, selection }) {
  return view.actions
    .map((id) => ACTIONS[id])
    .filter((action) => action && action.enabled(selection));
}

/** Grouped for a menu, so separators land between kinds of thing. */
export function groupFileActions(actions) {
  const groups = [];

  for (const action of actions) {
    const last = groups[groups.length - 1];
    if (last && last.group === action.group) last.actions.push(action);
    else groups.push({ group: action.group, actions: [action] });
  }

  return groups;
}
