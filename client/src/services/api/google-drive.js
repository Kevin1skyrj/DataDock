import { apiRequest } from "./api-client";

const API_URL = process.env.NEXT_PUBLIC_API_URL;
const MESSAGE_TYPE = "datadock:google-drive";

export function getAccount() {
  return apiRequest("/imports/google-drive/account");
}

export function connect() {
  return new Promise((resolve, reject) => {
    const popup = window.open(
      `${API_URL}/imports/google-drive/connect`,
      "datadock-google-drive",
      "popup,width=520,height=700",
    );
    if (!popup) {
      reject(new Error("Allow popups to connect Google Drive."));
      return;
    }

    const cleanup = () => {
      window.removeEventListener("message", onMessage);
      window.clearInterval(closedCheck);
    };
    const onMessage = async (event) => {
      if (event.origin !== window.location.origin || event.data?.type !== MESSAGE_TYPE) return;
      cleanup();
      if (event.data.status !== "success") {
        reject(new Error("Google Drive could not be connected."));
        return;
      }
      try {
        resolve(await getAccount());
      } catch (error) {
        reject(error);
      }
    };
    window.addEventListener("message", onMessage);
    const closedCheck = window.setInterval(() => {
      if (popup.closed) {
        cleanup();
        reject(new Error("Google Drive connection was cancelled."));
      }
    }, 500);
  });
}

export function disconnect() {
  return apiRequest("/imports/google-drive/connection", { method: "DELETE" });
}

export function listItems(folderId = "root") {
  return apiRequest(`/imports/google-drive/items?folderId=${encodeURIComponent(folderId)}`);
}

const wait = (ms) => new Promise((resolve) => window.setTimeout(resolve, ms));

export async function importItems(fileIds, { parentId = null, onProgress } = {}) {
  const { jobId } = await apiRequest("/imports/google-drive/jobs", {
    method: "POST",
    body: { fileIds, parentId },
  });

  while (true) {
    const job = await apiRequest(`/imports/google-drive/jobs/${encodeURIComponent(jobId)}`);
    onProgress?.(job.progress ?? 0);
    if (job.status === "complete") return { imported: job.imported };
    if (job.status === "failed") throw new Error(job.error ?? "Google Drive import failed.");
    await wait(600);
  }
}

export const googleDrive = {
  id: "google-drive",
  label: "Google Drive",
  description: "Bring documents, sheets and folders across.",
  getAccount,
  connect,
  disconnect,
  listItems,
  importItems,
};
