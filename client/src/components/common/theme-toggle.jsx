"use client";

import { Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";

import { Button } from "@/components/ui/button";
import { useMounted } from "@/hooks/use-mounted";

/**
 * Switches between the dark and light themes.
 *
 * The resolved theme is unknown during SSR, so the icon and label are held back
 * until after hydration — rendering the wrong one first would both mismatch and
 * announce the wrong action to a screen reader.
 */
export function ThemeToggle({ className }) {
  const { resolvedTheme, setTheme } = useTheme();
  const mounted = useMounted();
  const isDark = resolvedTheme === "dark";

  return (
    <Button
      variant="ghost"
      size="icon-sm"
      className={className}
      aria-label={mounted ? `Switch to ${isDark ? "light" : "dark"} theme` : "Switch theme"}
      onClick={() => setTheme(isDark ? "light" : "dark")}
    >
      {mounted && !isDark ? <Moon /> : <Sun />}
    </Button>
  );
}
