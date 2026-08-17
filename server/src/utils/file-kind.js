const EXACT_KINDS = {
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

export function getFileKind(mimeType) {
  if (EXACT_KINDS[mimeType]) return EXACT_KINDS[mimeType];
  if (mimeType.startsWith("image/")) return "image";
  if (mimeType.startsWith("video/")) return "video";
  if (mimeType.startsWith("audio/")) return "audio";
  if (mimeType.startsWith("text/")) return "code";
  return "other";
}
