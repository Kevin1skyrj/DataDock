/**
 * The buckets a file falls into.
 *
 * `kind` is stored on the entity rather than derived in the browser, because
 * filtering by it has to happen in the query. Deriving it from the MIME type at
 * render works right up until a folder has ten thousand files in it and the
 * filter needs an index — at which point the derivation is in the wrong place
 * and every component that reads it has to change.
 *
 * `kindOf` exists for the other direction: uploads arrive with a MIME type and
 * need a bucket assigned. Today the mock uses it to seed; later it runs on the
 * server at upload time. It is the single definition either way.
 */
export const FILE_KINDS = {
  folder: { label: "Folders" },
  pdf: { label: "PDFs" },
  image: { label: "Images" },
  video: { label: "Video" },
  audio: { label: "Audio" },
  doc: { label: "Documents" },
  sheet: { label: "Spreadsheets" },
  code: { label: "Code" },
  archive: { label: "Archives" },
  other: { label: "Other" },
};

export const FILE_KIND_IDS = Object.keys(FILE_KINDS);

const EXACT = {
  "application/pdf": "pdf",
  "application/json": "code",
  "application/zip": "archive",
  "application/x-tar": "archive",
  "application/msword": "doc",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document": "doc",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": "sheet",
  "application/vnd.openxmlformats-officedocument.presentationml.presentation": "doc",
  "text/markdown": "doc",
  "text/plain": "doc",
  "text/csv": "sheet",
  "image/svg+xml": "image",
};

const PREFIX = [
  ["image/", "image"],
  ["video/", "video"],
  ["audio/", "audio"],
  ["text/", "code"],
];

/** @returns {keyof FILE_KINDS} */
export function kindOf(mimeType) {
  if (!mimeType) return "other";
  const exact = EXACT[mimeType];
  if (exact) return exact;

  for (const [prefix, kind] of PREFIX) {
    if (mimeType.startsWith(prefix)) return kind;
  }

  return "other";
}
