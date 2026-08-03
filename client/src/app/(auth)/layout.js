import Link from "next/link";

import { AuthWindow } from "@/components/auth/auth-window";
import { AccentPicker } from "@/components/common/accent-picker";
import { PageAtmosphere } from "@/components/common/page-atmosphere";
import { ThemeToggle } from "@/components/common/theme-toggle";

/**
 * The shell every authentication screen renders into.
 *
 * The header repeats the marketing header's geometry exactly — same height,
 * same container, same padding, same wordmark — so the top of the screen does
 * not move when the route does. What it drops is the navigation, and that
 * absence is the message: you have stopped browsing DataDock and started
 * entering it. The theme and accent controls stay, because they belong to the
 * visitor rather than to the page.
 *
 * Everything below is the window, and the window is `AuthWindow`'s problem.
 * Screens themselves render nothing but their sheet.
 */
export default function AuthLayout({ children }) {
  return (
    <>
      <PageAtmosphere />

      <div className="flex min-h-dvh flex-col">
        <header className="shrink-0">
          <div className="mx-auto flex h-16 max-w-page items-center justify-between gap-8 px-5 sm:px-10">
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
          </div>
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
