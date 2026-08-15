import { Instrument_Sans, JetBrains_Mono } from "next/font/google";

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
