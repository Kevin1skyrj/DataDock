export const ACCENT_STORAGE_KEY = "datadock-accent";

export const DEFAULT_ACCENT = "blue";

/**
 * Swatch values are the dark-theme brand colours, used only to paint the
 * picker itself. Everything else reads `--brand` from the cascade.
 */
export const ACCENTS = [
  { id: "blue", label: "Blue", swatch: "#4c8dff" },
  { id: "purple", label: "Purple", swatch: "#6d5cf5" },
  { id: "teal", label: "Teal", swatch: "#2fbfa5" },
];

export const ACCENT_IDS = ACCENTS.map((accent) => accent.id);
