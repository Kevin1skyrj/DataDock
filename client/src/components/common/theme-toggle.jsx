"use client";

import { Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";

import { Button } from "@/components/ui/button";
import { useMounted } from "@/hooks/use-mounted";
import { cn } from "@/lib/utils";

/**
 * Switches between the dark and light themes.
 *
 * The resolved theme is unknown during SSR, so the icon and label are held back
 * until after hydration — rendering the wrong one first would both mismatch and
 * announce the wrong action to a screen reader.
 *
 * Both icons stay mounted and cross-rotate rather than one swapping for the
 * other. Swapping gives the control no feedback of its own: the page changes,
 * but the thing you pressed does not acknowledge that you pressed it. The
 * rotation is what makes it feel like a switch being thrown.
 *
 * The transition names `rotate` and `scale` explicitly — Tailwind v4 writes
 * those as their own CSS properties, so `transition-transform` would not cover
 * them and the icons would snap.
 */
const ICON =
  "col-start-1 row-start-1 transition-[rotate,scale,opacity] duration-300 ease-out-expo";

export function ThemeToggle({ className }) {
  const { resolvedTheme, setTheme } = useTheme();
  const mounted = useMounted();
  const isDark = resolvedTheme === "dark";

  // Dark is the default, so the pre-hydration render matches the dark state and
  // the first client render agrees with the server.
  const showMoon = mounted && !isDark;

  return (
    <Button
      variant="ghost"
      size="icon-sm"
      className={className}
      aria-label={mounted ? `Switch to ${isDark ? "light" : "dark"} theme` : "Switch theme"}
      onClick={() => setTheme(isDark ? "light" : "dark")}
    >
      <span className="grid size-4 place-items-center">
        <Sun
          aria-hidden="true"
          className={cn(ICON, showMoon ? "scale-50 rotate-90 opacity-0" : "scale-100 rotate-0 opacity-100")}
        />
        <Moon
          aria-hidden="true"
          className={cn(ICON, showMoon ? "scale-100 rotate-0 opacity-100" : "scale-50 -rotate-90 opacity-0")}
        />
      </span>
    </Button>
  );
}
