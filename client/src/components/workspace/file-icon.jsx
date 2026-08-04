import {
  File,
  FileArchive,
  FileAudio,
  FileCode,
  FileImage,
  FileSpreadsheet,
  FileText,
  FileType,
  FileVideo,
  Folder,
} from "lucide-react";

import { cn } from "@/lib/utils";

/**
 * The glyph for a kind.
 *
 * Deliberately monochrome. Every other file manager colour-codes by type, and
 * doing that here would mean either inventing a palette of hues — which this
 * design system does not have and which the rules forbid — or borrowing the
 * status colours, so a PDF would be red and a spreadsheet green while red and
 * green already mean *failed* and *succeeded* everywhere else in the product.
 * A row full of confident colour that means nothing is worse than a row of
 * grey that means exactly what it says.
 *
 * The one distinction that earns colour is the one that matters: folders are
 * the thing you can go into, so they carry the accent and files do not. On a
 * selected row both warm to the accent, because the whole row has.
 */
const ICONS = {
  folder: Folder,
  pdf: FileText,
  doc: FileType,
  sheet: FileSpreadsheet,
  image: FileImage,
  video: FileVideo,
  audio: FileAudio,
  code: FileCode,
  archive: FileArchive,
  other: File,
};

export function FileIcon({ kind, selected = false, className }) {
  const Glyph = ICONS[kind] ?? ICONS.other;
  const isFolder = kind === "folder";

  return (
    <Glyph
      aria-hidden="true"
      // Folders are drawn filled so they read as containers at 16px, where an
      // outline folder and an outline document are nearly the same shape.
      fill={isFolder ? "currentColor" : "none"}
      fillOpacity={isFolder ? 0.15 : undefined}
      className={cn(
        "size-4 shrink-0 transition-colors duration-150 ease-standard",
        selected || isFolder ? "text-brand" : "text-dim",
        className,
      )}
    />
  );
}
