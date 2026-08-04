"use client";

import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

import { CommandPalette } from "@/components/dashboard/command-palette";
import { ToastProvider } from "@/components/ui/toast";
import { UploadManager } from "@/components/upload/upload-manager";
import { DashboardSidebar } from "@/components/dashboard/dashboard-sidebar";
import { DashboardTopBar } from "@/components/dashboard/dashboard-top-bar";
import { SHELL } from "@/constants/dashboard";
import { useMediaQuery } from "@/hooks/use-media-query";
import { toggleSidebar, useSidebarCollapsed } from "@/lib/sidebar";
import { cn } from "@/lib/utils";

const DRAWER_QUERY = "(max-width: 767.98px)";

/** Where the rail is a choice rather than a consequence of the viewport. */
const TOGGLEABLE_QUERY = "(min-width: 1024px)";

/**
 * The application frame.
 *
 * One client component owns the two pieces of chrome state — is the rail
 * collapsed, is the drawer open — because the sidebar and the top bar both need
 * them and a context for two consumers is machinery without a reason.
 *
 * The whole frame is `h-dvh overflow-hidden` and only `<main>` scrolls. That
 * single decision is most of what separates an application from a website with
 * a sidebar: the navigation and the top bar never move, so the place you are
 * looking stays where you left it.
 *
 * There is intentionally no entrance animation here. The landing page exists to
 * impress and can afford a second and a half of choreography; this is somewhere
 * people work, and every one of those frames is a frame they are waiting. What
 * motion there is answers something the visitor did — a width changing, a
 * drawer arriving, a row lighting under the cursor — and none of it runs longer
 * than 220ms. GSAP is not imported anywhere in the dashboard, so it is not in
 * this bundle at all.
 */
export function DashboardShell({ children }) {
  const pathname = usePathname();
  const collapsed = useSidebarCollapsed();
  const drawer = useMediaQuery(DRAWER_QUERY);
  const toggleable = useMediaQuery(TOGGLEABLE_QUERY);
  // What is stored is *where* the drawer was opened, not whether it is open.
  //
  // Openness is then derived, and two rules that would otherwise each need an
  // effect fall out of the derivation for free: navigating anywhere changes the
  // pathname, so the drawer closes without every link, breadcrumb and palette
  // result having to remember to close it; and growing past the breakpoint
  // makes the sidebar a column again, so the flag stops meaning anything
  // without needing to be cleared.
  const [openedAt, setOpenedAt] = useState(null);
  const mobileOpen = drawer && openedAt === pathname;

  const closeDrawer = () => setOpenedAt(null);

  useEffect(() => {
    if (!mobileOpen) return undefined;

    const onKeyDown = (event) => {
      if (event.key === "Escape") closeDrawer();
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [mobileOpen]);

  // ⌘B / Ctrl+B, the convention every editor and every app of this shape uses.
  //
  // Only where the rail is actually a choice. Below `lg` the width is decided
  // by the viewport, so firing this would write a preference that changes
  // nothing now and surprises you the next time you open a wide window.
  useEffect(() => {
    if (!toggleable) return undefined;

    const onKeyDown = (event) => {
      if (!(event.metaKey || event.ctrlKey) || event.altKey) return;
      if (event.key?.toLowerCase() !== "b") return;
      event.preventDefault();
      toggleSidebar();
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [toggleable]);

  return (
    <div className="flex h-dvh overflow-hidden bg-background">
      {/* Every application should be operable without walking through its
          navigation first. Visually hidden until focused, then a real control. */}
      <a
        href="#dashboard-content"
        className={cn(
          "sr-only rounded-md bg-brand px-4 py-2 text-base font-medium text-brand-contrast",
          "focus:not-sr-only focus:absolute focus:top-3 focus:left-3 focus:z-100",
        )}
      >
        {SHELL.skipToContent}
      </a>

      <DashboardSidebar
        collapsed={collapsed}
        mobileOpen={mobileOpen}
        drawer={drawer}
        pathname={pathname}
        onToggle={toggleSidebar}
        onNavigate={closeDrawer}
      />

      {/* Only ever mounted for the drawer. A scrim behind a column that is
          permanently visible would be a click-blocker over the whole app. */}
      {mobileOpen ? (
        <button
          type="button"
          aria-label={SHELL.closeMenu}
          onClick={closeDrawer}
          className="fixed inset-0 z-40 bg-[color-mix(in_oklab,var(--background)_62%,transparent)] backdrop-blur-[3px] md:hidden"
        />
      ) : null}

      <div className="flex min-w-0 flex-1 flex-col">
        <DashboardTopBar onOpenMenu={() => setOpenedAt(pathname)} />

        <main id="dashboard-content" className="min-h-0 flex-1 overflow-y-auto">
          {children}
        </main>
      </div>

      {/* Both mounted once, for the whole application. The palette answers ⌘K
          from anywhere; the toast viewport receives results from anywhere,
          including from work that finishes after you have navigated away. */}
      <CommandPalette />
      <ToastProvider />

      {/* Mounted here, not in the workspace: a folder of two hundred photos has
          to keep uploading while you browse into Settings. */}
      <UploadManager />
    </div>
  );
}
