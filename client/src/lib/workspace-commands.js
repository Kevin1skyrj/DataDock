import { useSyncExternalStore } from "react";

/**
 * What the palette can do to whatever is selected right now.
 *
 * The palette lives in the shell and the workspace lives in the page, so
 * neither is an ancestor of the other and no context reaches between them. The
 * workspace publishes its current selection and the actions that apply to it;
 * the palette reads them.
 *
 * The consequence is the right one: on Settings, where there is no workspace,
 * Rename and Share are simply not offered — rather than being listed and
 * failing, or being listed and disabled. A command that cannot run should not
 * be in the list.
 */
let state = { selection: [], actions: [], handlers: null, folderId: null };
const listeners = new Set();

function subscribe(onStoreChange) {
  listeners.add(onStoreChange);
  return () => {
    listeners.delete(onStoreChange);
  };
}

const getSnapshot = () => state;
const EMPTY = { selection: [], actions: [], handlers: null, folderId: null };
const getServerSnapshot = () => EMPTY;

export function useWorkspaceCommands() {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}

/**
 * Compared before publishing.
 *
 * The workspace re-renders on every keystroke in its filter box and on every
 * frame of an upload; without this, each of those would re-render the palette
 * and everything else reading this store.
 */
export function publishWorkspaceCommands(next) {
  const sameSelection =
    state.selection.length === next.selection.length &&
    state.selection.every((item, index) => item.id === next.selection[index].id);

  const sameActions =
    state.actions.length === next.actions.length &&
    state.actions.every((action, index) => action.id === next.actions[index].id);

  if (sameSelection && sameActions && state.folderId === next.folderId) return;

  state = next;
  for (const listener of listeners) listener();
}

export function clearWorkspaceCommands() {
  if (state === EMPTY) return;
  state = EMPTY;
  for (const listener of listeners) listener();
}
