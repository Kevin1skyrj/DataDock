"use client";

import { FileUp, FolderPlus, FolderUp } from "lucide-react";
import { useRef } from "react";

import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuGroup,
  ContextMenuItem,
  ContextMenuLabel,
  ContextMenuSeparator,
  ContextMenuTrigger,
} from "@/components/ui/context-menu";
import { Kbd } from "@/components/ui/kbd";
import { groupFileActions } from "@/lib/file-actions";
import { useWorkspace } from "@/components/workspace/workspace-context";
import { useFilePicker } from "@/hooks/use-file-picker";

/**
 * The right-click menu, rendered from action descriptors.
 *
 * It contains no knowledge of what any entry does. It is handed a list from
 * `buildFileActions`, draws it, and calls `run` — which is exactly why the
 * selection toolbar can draw the same list differently and the command palette
 * will be able to draw it a third way without any of the three disagreeing
 * about whether Rename applies to four files at once.
 *
 * One trigger wraps the whole listing rather than one per row. Base UI reports
 * the event, the workspace resolves which item was under the pointer, and the
 * menu is built for *that* — which also means right-clicking empty space below
 * the rows can offer the folder's own actions later, with nothing to rewire.
 */
export function FileContextMenu({ target, children }) {
  const { actionsFor, scopeFor, handlers, selection, folderId, view } = useWorkspace();
  const filesRef = useRef(null);
  const folderRef = useRef(null);
  const onPick = useFilePicker(folderId);

  const actions = target ? actionsFor(target) : [];
  const groups = groupFileActions(actions);

  // What the menu is about: the selection if the target is part of it, or just
  // the one item. The heading says so, because acting on four files when you
  // meant one is not a mistake you want to discover afterwards.
  const scope =
    target && selection.isSelected(target.id) && selection.count > 1
      ? `${selection.count} items`
      : target?.name;

  return (
    <ContextMenu>
      <ContextMenuTrigger render={children} />

      <input ref={filesRef} type="file" multiple hidden onChange={onPick} />
      <input
        ref={folderRef}
        type="file"
        hidden
        webkitdirectory=""
        directory=""
        onChange={onPick}
      />

      <ContextMenuContent>
        {!target && view.canCreate ? (
          <ContextMenuGroup>
            <ContextMenuItem onClick={() => handlers.newFolder()}>
              <FolderPlus className="size-3.5" />
              <span className="flex-1">New folder</span>
            </ContextMenuItem>
            <ContextMenuItem onClick={() => filesRef.current?.click()}>
              <FileUp className="size-3.5" />
              <span className="flex-1">File upload</span>
            </ContextMenuItem>
            <ContextMenuItem onClick={() => folderRef.current?.click()}>
              <FolderUp className="size-3.5" />
              <span className="flex-1">Folder upload</span>
            </ContextMenuItem>
          </ContextMenuGroup>
        ) : null}

        {scope ? (
          <ContextMenuGroup>
            <ContextMenuLabel>{scope}</ContextMenuLabel>
          </ContextMenuGroup>
        ) : null}

        {groups.map((group, index) => (
          <ContextMenuGroup key={`${group.group}-${index}`}>
            {index > 0 ? <ContextMenuSeparator /> : null}

            {group.actions.map((action) => (
              <ContextMenuItem
                key={action.id}
                danger={action.danger}
                onClick={() => action.run(scopeFor(target), handlers)}
              >
                <action.icon className="size-3.5" />
                <span className="flex-1">{action.label}</span>
                {action.shortcut ? <Kbd variant="bare">{action.shortcut}</Kbd> : null}
              </ContextMenuItem>
            ))}
          </ContextMenuGroup>
        ))}
      </ContextMenuContent>
    </ContextMenu>
  );
}
