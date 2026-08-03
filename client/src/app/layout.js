import { Instrument_Sans, JetBrains_Mono } from "next/font/google";

import { bootScript } from "@/lib/boot-script";
import { AppProviders } from "@/providers/app-providers";

import "./globals.css";

const instrumentSans = Instrument_Sans({
  variable: "--font-instrument-sans",
  subsets: ["latin"],
  display: "swap",
});

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-jetbrains-mono",
  subsets: ["latin"],
  display: "swap",
});

export const metadata = {
  title: {
    default: "DataDock — Store smarter. Organize beautifully.",
    template: "%s · DataDock",
  },
  description:
    "A cloud drive that behaves like a desktop app. Upload, find, and share files in seconds — without the clutter of an enterprise suite.",
};

export const viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#fbfbfc" },
    { media: "(prefers-color-scheme: dark)", color: "#08090b" },
  ],
};

export default function RootLayout({ children }) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${instrumentSans.variable} ${jetbrainsMono.variable}`}
    >
      {/* Extensions edit `<body>` before React hydrates — ClickUp adds
          `clickup-chrome-ext_installed`, password managers and Grammarly add
          their own — and React reports the resulting attribute mismatch as a
          hydration error on every load. It suppresses this element's own
          attributes and text only, one level deep, so a genuine mismatch
          anywhere inside the tree is still reported. Same reason `<html>`
          above carries it for next-themes. */}
      <body suppressHydrationWarning className="min-h-dvh">
        {/* Synchronous by design — see lib/boot-script.js. next/script's
            beforeInteractive defers into __next_s, which is too late. */}
        <script suppressHydrationWarning dangerouslySetInnerHTML={{ __html: bootScript }} />

        {/* Page-wide grain. It belongs here rather than on any one section:
            scoped to the hero it stopped at that section's edge, and a 3.5%
            lift ending on a hard line reads as two different backgrounds.
            Fixed rather than absolute so it is one viewport-sized layer that
            never repaints on scroll. */}
        <div aria-hidden="true" className="dd-noise pointer-events-none fixed inset-0 -z-10" />

        <AppProviders>{children}</AppProviders>
      </body>
    </html>
  );
}
