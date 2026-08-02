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
      <body className="min-h-dvh">
        {/* Synchronous by design — see lib/boot-script.js. next/script's
            beforeInteractive defers into __next_s, which is too late. */}
        <script suppressHydrationWarning dangerouslySetInnerHTML={{ __html: bootScript }} />
        <AppProviders>{children}</AppProviders>
      </body>
    </html>
  );
}
