"use client";

import {
  ArrowUp,
  Check,
  ChevronDown,
  ClipboardPaste,
  FolderPlus,
  Info,
  LayoutGrid,
  ListFilter,
  Rows3,
  X,
} from "lucide-react";

import { UploadMenu } from "@/components/upload/upload-menu";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useWorkspace } from "@/components/workspace/workspace-context";
import { FILE_KINDS } from "@/constants/file-kinds";
import { SORT_FIELDS, WORKSPACE } from "@/constants/workspace";
import { setDetailsOpen, setViewMode, useDetailsOpen, useViewMode } from "@/lib/workspace-prefs";
import { cn } from "@/lib/utils";

/**
 * The workspace's controls.
 *
 * Two bars in one slot. At rest it is about the folder — what you can add to it
 * and how you want to look at it. The moment anything is selected it becomes
 * about the selection, in the same place, at the same height.
 *
 * That swap is why there are no permanently disabled buttons anywhere. Download,
 * Move, Share and Delete apply to a selection, so they appear when there is one
 * and are absent when there is not — rather than sitting greyed out for the
 * ninety percent of the time nothing is chosen, teaching people to ignore that
 * whole region of the screen.
 *
 * Actions come from the registry, so this bar and the right-click menu can never
 * disagree about what is possible.
 */
export function FileToolbar() {
  const selecting = useWorkspace().selection.count > 0;

  return (
    <div className="flex h-13 shrink-0 items-center gap-2 border-b border-line px-3">
      {selecting ? <SelectionBar /> : <BrowseBar />}
    </div>
  );
}

/* --------------------------------------------------------------- browse -- */

function BrowseBar() {
  const { view, path, folderId, onNavigate, setCreatingFolder, setImporting, drag, clipboard, paste } =
    useWorkspace();

  const parentId = path.at(-2)?.id ?? null;

  return (
    <>
      {/* Folder navigation lives here rather than in the shell's breadcrumb,
          because the breadcrumb is derived from the route and a folder is not
          one yet. When Folder Navigation lands this becomes the same trail. */}
      {/* Up, not Back. Back is the browser's word and means "the previous
          page", which after a sort change or a filter is not the parent folder.
          It is also a drop target: dragging something onto it is how you move a
          file out of where it is without leaving. */}
      {path.length > 0 ? (
        <Button
          variant="ghost"
          size="icon-sm"
          aria-label={`${WORKSPACE.up} to ${path.at(-2)?.name ?? "All files"}`}
          onClick={() => onNavigate?.(parentId)}
          {...drag.dropProps(parentId)}
          className={cn(drag.dropTarget === parentId && "bg-brand-tint text-brand ring-1 ring-brand")}
        >
          <ArrowUp />
        </Button>
      ) : null}

      {view.canUpload !== false ? (
        <UploadMenu parentId={folderId} onImport={setImporting} />
      ) : null}

      {view.canCreate ? (
        <Button variant="secondary" size="sm" onClick={() => setCreatingFolder(true)}>
          <FolderPlus />
          <span className="hidden sm:inline">{WORKSPACE.newFolder}</span>
        </Button>
      ) : null}

      {/* Paste only exists when there is something to paste — the same rule the
          selection bar follows. A permanently greyed Paste teaches people to
          stop looking at that corner. */}
      {clipboard ? (
        <Button variant="ghost" size="sm" onClick={paste}>
          <ClipboardPaste />
          <span className="hidden sm:inline">
            Paste {clipboard.items.length > 1 ? `${clipboard.items.length} items` : ""}
          </span>
        </Button>
      ) : null}

      <div className="ml-auto flex items-center gap-1.5">
        <SortMenu />
        {view.canFilter !== false ? <FilterMenu /> : null}
        <ViewToggle />
        <DetailsToggle />
      </div>
    </>
  );
}

function SortMenu() {
  const { sort, setSort } = useWorkspace();
  const current = SORT_FIELDS.find((field) => field.id === sort.field);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <Button variant="ghost" size="sm" className="gap-1.5">
            <span className="hidden text-dim sm:inline">{WORKSPACE.sort}</span>
            <span className="text-foreground">{current?.label}</span>
            <ChevronDown className="size-3.5 text-dim" />
          </Button>
        }
      />

      <DropdownMenuContent className="w-48">
        {/* The label lives inside the group: Base UI reads that context to wire
            `aria-labelledby`, and throws outright without it. */}
        <DropdownMenuGroup>
          <DropdownMenuLabel>Sort by</DropdownMenuLabel>

          {SORT_FIELDS.map((field) => (
            <DropdownMenuItem
              key={field.id}
              onClick={() => setSort({ field: field.id, direction: sort.direction })}
            >
              <span className="flex-1">{field.label}</span>
              {sort.field === field.id ? <Check className="size-3.5 text-brand" /> : null}
            </DropdownMenuItem>
          ))}
        </DropdownMenuGroup>

        <DropdownMenuSeparator />

        {[
          { id: "asc", label: "Ascending" },
          { id: "desc", label: "Descending" },
        ].map((option) => (
          <DropdownMenuItem
            key={option.id}
            onClick={() => setSort({ field: sort.field, direction: option.id })}
          >
            <span className="flex-1">{option.label}</span>
            {sort.direction === option.id ? <Check className="size-3.5 text-brand" /> : null}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function FilterMenu() {
  const { kinds, setKinds } = useWorkspace();

  const toggle = (id) =>
    setKinds(kinds.includes(id) ? kinds.filter((kind) => kind !== id) : [...kinds, id]);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <Button variant="ghost" size="sm" className="gap-1.5">
            <ListFilter className="size-3.5" />
            <span className="hidden sm:inline">{WORKSPACE.filter}</span>
            {/* The count is the affordance that says a filter is on. A funnel
                icon that looks identical filtered and unfiltered is how people
                end up convinced their files have vanished. */}
            {kinds.length ? (
              <span className="rounded-sm bg-brand-tint px-1.5 text-2xs text-brand">
                {kinds.length}
              </span>
            ) : null}
          </Button>
        }
      />

      <DropdownMenuContent className="w-48">
        <DropdownMenuGroup>
          <DropdownMenuLabel>Kind</DropdownMenuLabel>

          {Object.entries(FILE_KINDS).map(([id, kind]) => (
            <DropdownMenuItem key={id} closeOnClick={false} onClick={() => toggle(id)}>
              <span className="flex-1">{kind.label}</span>
              {kinds.includes(id) ? <Check className="size-3.5 text-brand" /> : null}
            </DropdownMenuItem>
          ))}
        </DropdownMenuGroup>

        {kinds.length ? (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => setKinds([])}>
              <span className="flex-1">Clear filters</span>
            </DropdownMenuItem>
          </>
        ) : null}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function ViewToggle() {
  const mode = useViewMode();

  return (
    <div
      role="radiogroup"
      aria-label="Layout"
      className="flex items-center rounded-md border border-line p-0.5"
    >
      {[
        { id: "table", Icon: Rows3, label: WORKSPACE.tableView },
        { id: "grid", Icon: LayoutGrid, label: WORKSPACE.gridView },
      ].map(({ id, Icon, label }) => (
        <button
          key={id}
          type="button"
          role="radio"
          aria-checked={mode === id}
          aria-label={label}
          onClick={() => setViewMode(id)}
          className={cn(
            "grid size-6 place-items-center rounded-sm transition-colors duration-150 ease-standard",
            "focus-visible:outline-2 focus-visible:-outline-offset-1 focus-visible:outline-brand",
            mode === id ? "bg-surface-2 text-foreground" : "text-dim hover:text-foreground",
          )}
        >
          <Icon className="size-3.5" />
        </button>
      ))}
    </div>
  );
}

function DetailsToggle() {
  const open = useDetailsOpen();

  return (
    <Button
      variant="ghost"
      size="icon-sm"
      aria-label={WORKSPACE.details}
      aria-pressed={open}
      title={`${WORKSPACE.details} (⌘I)`}
      onClick={() => setDetailsOpen(!open)}
      className={cn(open && "bg-surface-2 text-foreground")}
    >
      <Info />
    </Button>
  );
}

/* ------------------------------------------------------------ selection -- */

function SelectionBar() {
  const { selection, actions, handlers } = useWorkspace();

  const primary = actions.filter((action) => action.primary);
  const overflow = actions.filter((action) => !action.primary);

  return (
    <>
      <Button
        variant="ghost"
        size="icon-sm"
        aria-label={WORKSPACE.clearSelection}
        onClick={selection.clear}
      >
        <X />
      </Button>

      <span aria-live="polite" className="mr-1 text-md font-medium text-foreground">
        {selection.count} selected
      </span>

      <div className="flex min-w-0 items-center gap-1.5 overflow-x-auto">
        {primary.map((action) => (
          <Button
            key={action.id}
            variant={action.danger ? "destructive" : "secondary"}
            size="sm"
            onClick={() => action.run(selection.selected, handlers)}
          >
            <action.icon />
            <span className="hidden sm:inline">{action.label}</span>
          </Button>
        ))}

        {overflow.length ? (
          <DropdownMenu>
            <DropdownMenuTrigger
              render={
                <Button variant="ghost" size="sm" aria-label="More actions">
                  More
                  <ChevronDown className="size-3.5" />
                </Button>
              }
            />

            <DropdownMenuContent className="w-48">
              {overflow.map((action) => (
                <DropdownMenuItem
                  key={action.id}
                  onClick={() => action.run(selection.selected, handlers)}
                >
                  <action.icon className="size-3.5" />
                  <span className="flex-1">{action.label}</span>
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        ) : null}
      </div>

      <div className="ml-auto flex items-center gap-1.5">
        <ViewToggle />
        <DetailsToggle />
      </div>
    </>
  );
}
