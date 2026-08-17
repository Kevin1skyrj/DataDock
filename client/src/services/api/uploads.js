import { apiRequest } from "./api-client";

export const MAX_UPLOAD_BYTES = 2_000_000_000;

export function validateUpload({ name, size }) {
  if (!name?.trim()) return "That file has no name.";
  if (size === 0) return "That file is empty.";
  if (size > MAX_UPLOAD_BYTES) return "That file is larger than 2 GB.";
  return null;
}

function transfer({ file, uploadUrl, headers, onProgress, signal }) {
  return new Promise((resolve, reject) => {
    const request = new XMLHttpRequest();
    request.open("PUT", uploadUrl);

    for (const [name, value] of Object.entries(headers)) {
      request.setRequestHeader(name, value);
    }

    request.upload.addEventListener("progress", (event) => {
      if (event.lengthComputable) onProgress?.(event.loaded);
    });
    request.addEventListener("load", () => {
      if (request.status >= 200 && request.status < 300) resolve();
      else reject(new Error("S3 rejected the upload."));
    });
    request.addEventListener("error", () => reject(new Error("The upload connection failed.")));
    request.addEventListener("abort", () => reject(new DOMException("Upload cancelled", "AbortError")));

    const abort = () => request.abort();
    signal?.addEventListener("abort", abort, { once: true });
    request.addEventListener("loadend", () => signal?.removeEventListener("abort", abort));
    request.send(file);
  });
}

export async function uploadFile({ file, parentId, onProgress, signal }) {
  const invalid = validateUpload(file);
  if (invalid) throw new Error(invalid);

  const upload = await apiRequest("/uploads", {
    method: "POST",
    body: {
      name: file.name,
      size: file.size,
      mimeType: file.type || "application/octet-stream",
      parentId,
    },
  });

  await transfer({
    file,
    uploadUrl: upload.uploadUrl,
    headers: upload.headers,
    onProgress,
    signal,
  });

  return apiRequest(`/uploads/${encodeURIComponent(upload.uploadId)}/complete`, {
    method: "POST",
  });
}
