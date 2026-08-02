"use client";

import { AccentProvider } from "@/providers/accent-provider";
import { ThemeProvider } from "@/providers/theme-provider";

/**
 * Single mount point for every global provider, so `layout.js` stays a
 * document shell and providers can be reordered in one place.
 */
export function AppProviders({ children }) {
  return (
    <ThemeProvider>
      <AccentProvider>{children}</AccentProvider>
    </ThemeProvider>
  );
}
