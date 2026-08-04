import { DRAG_TYPE } from "@/components/workspace/use-drag-drop";

/**
 * Telling an operating-system drag from one of our own.
 *
 * Both arrive as `dragover`, and getting this wrong in either direction is bad:
 * dragging a file between two folders would raise the upload overlay, and
 * dragging a photo off the desktop would try to move a file that does not
 * exist. The test is not "is this a file drag" but "is this *ours*" — a drag
 * carrying our private MIME type is internal, and everything else offering
 * files is external.
 *
 * `types` is the only part of `dataTransfer` readable during `dragover`; the
 * contents are deliberately withheld by the browser until the drop. Which is
 * why this checks the types and `readDropped` reads the rest.
 */
export function isExternalFileDrag(dataTransfer) {
  if (!dataTransfer) return false;
  const types = Array.from(dataTransfer.types ?? []);
  if (types.includes(DRAG_TYPE)) return false;
  return types.includes("Files");
}

/**
 * Everything in a drop, folders walked out flat.
 *
 * A dropped folder arrives as one `DataTransferItem` that has to be walked with
 * the FileSystem entry API. The walk is breadth-first and reads directories in
 * repeated batches, because `readEntries` returns at most a hundred at a time
 * and stopping at the first call is the classic bug — folders quietly upload
 * their first hundred children and nothing says otherwise.
 *
 * Returns `{ file, path }` pairs, where `path` is what the queue turns back
 * into folders. Flat, because the queue creates each folder once however many
 * files mention it.
 */
export async function readDropped(dataTransfer) {
  const items = Array.from(dataTransfer.items ?? []);

  // Captured synchronously. The entries are invalidated the moment the event
  // handler yields, so awaiting before collecting them loses the drop entirely.
  const roots = items
    .map((item) => (item.kind === "file" ? item.webkitGetAsEntry?.() : null))
    .filter(Boolean);

  if (roots.length === 0) {
    // No entry API, or a source that only offers plain files. Still a valid
    // drop, just without folder structure.
    return Array.from(dataTransfer.files ?? []).map((file) => ({ file, path: file.name }));
  }

  const collected = [];
  const queue = roots.map((entry) => ({ entry, prefix: "" }));

  while (queue.length) {
    const { entry, prefix } = queue.shift();
    const path = prefix ? `${prefix}/${entry.name}` : entry.name;

    if (entry.isFile) {
      const file = await new Promise((resolve) => entry.file(resolve, () => resolve(null)));
      if (file) collected.push({ file, path });
      continue;
    }

    if (entry.isDirectory) {
      const reader = entry.createReader();
      for (;;) {
        const batch = await new Promise((resolve) =>
          reader.readEntries(resolve, () => resolve([])),
        );
        if (batch.length === 0) break;
        for (const child of batch) queue.push({ entry: child, prefix: path });
      }
    }
  }

  return collected;
}

/**
 * The same shape, from a file input.
 *
 * `webkitdirectory` inputs hand back a flat list already, with the folder chain
 * on each file — so this is only a rename of that field into the one thing the
 * queue reads either way.
 */
export function readPicked(fileList) {
  return Array.from(fileList ?? []).map((file) => ({
    file,
    path: file.webkitRelativePath || file.name,
  }));
}
