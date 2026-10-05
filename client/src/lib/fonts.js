import localFont from "next/font/local";

export const instrumentSans = localFont({
  src: "../assets/fonts/instrument-sans-latin.woff2",
  variable: "--font-instrument-sans",
  weight: "400 700",
  style: "normal",
  display: "swap",
});

export const jetbrainsMono = localFont({
  src: "../assets/fonts/jetbrains-mono-latin.woff2",
  variable: "--font-jetbrains-mono",
  weight: "100 800",
  style: "normal",
  display: "swap",
});

/** Both variables, for the elements that host them. */
export const fontVariables = `${instrumentSans.variable} ${jetbrainsMono.variable}`;
