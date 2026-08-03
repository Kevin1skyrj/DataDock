import Link from "next/link";

import { AuthWindow } from "@/components/auth/auth-window";
import { AccentPicker } from "@/components/common/accent-picker";
import { HEADER_GUTTER, HeaderIsland } from "@/components/common/header-island";
import { PageAtmosphere } from "@/components/common/page-atmosphere";
import { ThemeToggle } from "@/components/common/theme-toggle";
import { cn } from "@/lib/utils";

/**
 * The shell every authentication screen renders into.
 *
 * The header is not a copy of the marketing header's shape, it is literally the
 * same island, so the top of the screen cannot move when the route does. What
 * it drops is the navigation, and that absence is the message: you have stopped
 * browsing DataDock and started entering it. The theme and accent controls
 * stay, because they belong to the visitor rather than to the page.
 *
 * Everything below is the window, and the window is `AuthWindow`'s problem.
 * Screens themselves render nothing but their sheet.
 */
export default function AuthLayout({ children }) {
  return (
    <>
      <PageAtmosphere />

      <div className="flex min-h-dvh flex-col">
        <header className={cn("shrink-0", HEADER_GUTTER)}>
          <HeaderIsland>
            <Link
              href="/"
              className="text-xl font-semibold tracking-tight text-foreground"
            >
              DataDock
            </Link>

            <div className="flex items-center gap-2">
              <AccentPicker />
              <ThemeToggle />
            </div>
          </HeaderIsland>
        </header>

        {/* `items-center` rather than `place-items-center` on a grid: when the
            window is taller than the viewport this still lets the page scroll
            instead of clipping the top of it. */}
        <main className="flex flex-1 items-center justify-center px-5 py-8 sm:px-10 sm:py-10">
          <AuthWindow>{children}</AuthWindow>
        </main>
      </div>
    </>
  );
}
