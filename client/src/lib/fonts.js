import { Instrument_Sans, JetBrains_Mono } from "next/font/google";

/**
 * The product's two faces, declared once.
 *
 * `next/font` treats every call site as a separate font: two files asking for
 * JetBrains Mono produce two hashed modules, two stylesheets and two fetches
 * from Google at build time. The root layout and the global error boundary both
 * need them — the boundary replaces the layout, so it cannot inherit anything
 * from it — and declaring them in both places meant the build depended on
 * fetching the same font twice. When the second fetch failed, the build failed
 * with it.
 *
 * Importing the instances instead gives one declaration, one fetch, one cache
 * entry, and one place to change if the typeface ever does.
 */

export const instrumentSans = Instrument_Sans({
  variable: "--font-instrument-sans",
  subsets: ["latin"],
  display: "swap",
});

export const jetbrainsMono = JetBrains_Mono({
  variable: "--font-jetbrains-mono",
  subsets: ["latin"],
  display: "swap",
});

/** Both variables, for the elements that host them. */
export const fontVariables = `${instrumentSans.variable} ${jetbrainsMono.variable}`;
