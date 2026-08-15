"use client";

import {
  BarChart3,
  Clock,
  FolderClosed,
  LayoutGrid,
  PanelLeftClose,
  PanelLeftOpen,
  Settings,
  Share2,
  Star,
  Trash2,
  Upload,
} from "lucide-react";
import Link from "next/link";
import { useId, useRef } from "react";

import { StorageMeter } from "@/components/common/storage-meter";
import { SidebarNavItem } from "@/components/dashboard/sidebar-nav-item";
import { Button } from "@/components/ui/button";
import { DASHBOARD_NAV, SHELL } from "@/constants/dashboard";
import { PREVIEW_STORAGE } from "@/constants/preview-data";
import { useFilePicker } from "@/hooks/use-file-picker";
import { useShortcut } from "@/hooks/use-platform";
import { cn } from "@/lib/utils";
import { useWorkspaceCommands } from "@/lib/workspace-commands";

const NAV_ICONS = {
  layout: LayoutGrid,
  folder: FolderClosed,
  clock: Clock,
  star: Star,
  share: Share2,
  trash: Trash2,
  chart: BarChart3,
  settings: Settings,
};

/**
 * The application's spine.
 *
 * One element serves three layouts — drawer, rail, expanded — because they are
 * the same list at three widths, and rendering a separate mobile navigation is
 * how two navigations drift apart. Which one you get is decided entirely in CSS
 * (see the shell block in `globals.css`), so the first paint after a reload is
 * already correct rather than being corrected.
 *
 * Upload sits above the navigation rather than inside it, because it is not a
 * place — it is the verb the whole product exists for, and it is available from
 * every screen. It is the only filled control in the sidebar, which is also
 * what keeps the accent present when the rail has hidden everything else.
 */
export function DashboardSidebar({
  collapsed,
  mobileOpen,
  drawer,
  pathname,
  onToggle,
  onNavigate,
}) {
  const Panel = collapsed ? PanelLeftOpen : PanelLeftClose;
  const shortcut = useShortcut("B");
  const sidebarId = useId();

  /**
   * Uploads land in the folder currently on screen, not always at the root.
   *
   * The sidebar sits in the shell and the workspace sits in the page, so no
   * context reaches between them — but the workspace already publishes the
   * folder it is showing for the command palette to read, and this reads the
   * same store. On Settings or Storage, where there is no workspace, `folderId`
   * is null and the files land at the root, which is the only honest answer
   * when there is no folder in view.
   */
  const { folderId } = useWorkspaceCommands();
  const uploadRef = useRef(null);
  const onPick = useFilePicker(folderId);

  return (
    <aside
      id={sidebarId}
      data-shell="sidebar"
      // "Sidebar", not "Main". The navigation landmark is the `<nav>` inside;
      // naming both the same thing gives a screen reader two regions with one
      // name and no way to tell which is which.
      aria-label="Sidebar"
      // `inert` while the drawer is shut, so its links are out of the tab order
      // and out of the accessibility tree instead of sitting off screen waiting
      // to be tabbed into. It has to come from a media query rather than from
      // CSS — `inert` is an attribute, and there is no way to set one at a
      // breakpoint. From `md` up this is never a drawer, so it is never inert.
      inert={drawer && !mobileOpen}
      className={cn(
        "fixed inset-y-0 left-0 z-50 flex flex-col border-r border-line bg-background",
        mobileOpen ? "translate-x-0" : "-translate-x-full",
        "md:static md:z-auto md:translate-x-0",
      )}
    >
      <div
        data-shell="rail-center"
        className="flex h-14 shrink-0 items-center justify-between gap-2 px-4"
      >
        <Link
          href="/dashboard"
          data-shell="rail-hide"
          className="rounded-xs text-xl font-semibold tracking-tight text-foreground"
        >
          {SHELL.wordmark}
        </Link>

        {/* Only offered where the choice exists. Below `lg` the width is
            decided by the viewport, and a control that appears to do nothing is
            worse than no control. */}
        <Button
          variant="ghost"
          size="icon-sm"
          onClick={onToggle}
          aria-label={collapsed ? SHELL.expand : SHELL.collapse}
          aria-expanded={!collapsed}
          aria-controls={sidebarId}
          title={`${collapsed ? SHELL.expand : SHELL.collapse} (${shortcut})`}
          className="hidden lg:inline-flex"
        >
          <Panel />
        </Button>
      </div>

      <div className="px-3 pb-3">
        {/* A real file input, hidden. It is the only way to raise the native
            picker, and it is what makes this button do the thing its label
            promises rather than merely look like it might. */}
        <input
          ref={uploadRef}
          type="file"
          multiple
          hidden
          onChange={onPick}
        />

        {/* No `dd-shine`. That sweep is a marketing gesture and this is a
            control someone presses fifty times a day — the gloss stops being
            delightful the second time and is noise by the tenth.

            A plain picker rather than the workspace's split button: folder
            upload and the import providers need a menu, and a menu hanging off
            a control that collapses to a 40px rail is a menu nobody can aim at.
            The primary verb belongs here; its variations live in the toolbar,
            where there is room for them. */}
        <Button size="md" className="w-full" onClick={() => uploadRef.current?.click()}>
          <Upload />
          <span data-shell="rail-hide">{SHELL.upload}</span>
        </Button>
      </div>

      {/* The list scrolls, not the sidebar: the upload button and the storage
          meter are pinned, so neither can be scrolled out of reach on a short
          window. */}
      <nav aria-label="Main" className="min-h-0 flex-1 overflow-y-auto px-3 pb-3">
        {DASHBOARD_NAV.map((group) => (
          <div key={group.label} className="mb-5 flex flex-col gap-0.5 last:mb-0">
            <p
              data-shell="rail-hide"
              className="px-2.5 pb-1.5 text-xs tracking-widest text-dim uppercase"
            >
              {group.label}
            </p>

            {group.items.map((item) => (
              <SidebarNavItem
                key={item.id}
                item={item}
                Icon={NAV_ICONS[item.icon]}
                // `startsWith` everywhere except the index, which would
                // otherwise match every route beneath it and light up the whole
                // list at once.
                active={
                  item.href === "/dashboard"
                    ? pathname === "/dashboard"
                    : pathname.startsWith(item.href)
                }
                collapsed={collapsed}
                onNavigate={onNavigate}
              />
            ))}
          </div>
        ))}
      </nav>

      {/* Hidden in the rail rather than shrunk to a stub. Storage has a whole
          page; a 68px column is not the place to summarise it.

          A link, because it was already answering the question the storage page
          exists to answer in detail — and a number you cannot act on is just
          decoration. */}
      <div data-shell="rail-hide" className="shrink-0 p-3 pt-0">
        <Link href="/dashboard/storage" onClick={onNavigate} className="group block rounded-lg">
          <StorageMeter
            value={PREVIEW_STORAGE.percent}
            className="transition-colors duration-150 ease-standard group-hover:border-line-2"
          />
        </Link>
      </div>
    </aside>
  );
}
