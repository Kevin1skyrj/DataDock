/**
 * Bringing files in from somewhere else.
 *
 * Google Drive is not a feature here, it is the first entry in a registry. The
 * brief names Dropbox, OneDrive and Box as the ones that follow, and the only
 * way that stays true is if nothing in the UI knows which provider it is
 * talking to. So a provider is an object with five functions, and the import
 * dialog renders whichever it was handed.
 *
 *   connect()             open the account link — OAuth, later
 *   disconnect()
 *   getAccount()          who is connected, or null
 *   listItems(folderId)   one level, the same shape our own listing uses
 *   importItems(ids)      hand the transfer to the server
 *
 * `importItems` deliberately does not stream bytes through the browser. A real
 * Drive import is a server-to-server copy: our API holds the OAuth token, pulls
 * from Google and puts to S3, and the browser only ever polls for progress.
 * Modelling it as a browser download-then-upload would be a design the backend
 * could not adopt.
 */

const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const DRIVE_TREE = {
  root: [
    { id: "gd_folder_work", type: "folder", name: "Work", itemCount: 12 },
    { id: "gd_folder_photos", type: "folder", name: "Photos 2026", itemCount: 214 },
    { id: "gd_doc_plan", type: "file", name: "Q4 plan.gdoc", kind: "doc", size: 48_120 },
    { id: "gd_sheet_budget", type: "file", name: "Budget.gsheet", kind: "sheet", size: 92_400 },
    { id: "gd_pdf_deck", type: "file", name: "Investor deck.pdf", kind: "pdf", size: 4_812_000 },
  ],
  gd_folder_work: [
    { id: "gd_doc_notes", type: "file", name: "Meeting notes.gdoc", kind: "doc", size: 21_000 },
    { id: "gd_pdf_contract", type: "file", name: "Contract.pdf", kind: "pdf", size: 318_000 },
    { id: "gd_folder_archive", type: "folder", name: "Archive", itemCount: 40 },
  ],
  gd_folder_photos: [
    { id: "gd_img_a", type: "file", name: "beach.jpg", kind: "image", size: 3_200_000 },
    { id: "gd_img_b", type: "file", name: "sunset.jpg", kind: "image", size: 2_800_000 },
    { id: "gd_img_c", type: "file", name: "team.jpg", kind: "image", size: 4_100_000 },
  ],
  gd_folder_archive: [],
};

let account = null;

export const googleDrive = {
  id: "google-drive",
  label: "Google Drive",
  description: "Bring documents, sheets and folders across.",

  async getAccount() {
    await wait(80);
    return account;
  },

  /**
   * Stands in for the OAuth round trip.
   *
   * The real one opens a consent window and returns when the callback lands.
   * What matters for the UI is that it is slow, can be refused, and ends with
   * an account — all three of which this reproduces.
   */
  async connect() {
    await wait(1100);
    account = { email: "alex@gmail.com", name: "Alex Rivera", quota: "15 GB" };
    return account;
  },

  async disconnect() {
    await wait(200);
    account = null;
  },

  async listItems(folderId = "root") {
    await wait(340);
    if (!account) throw new Error("Not connected to Google Drive.");

    const children = DRIVE_TREE[folderId];
    if (!children) throw new Error("That folder is no longer available.");
    return children;
  },

  /**
   * @returns {Promise<{imported: number}>}
   *
   * Reports progress the way the real one will: a job the server is running,
   * polled from here. Not a transfer this browser is performing.
   */
  async importItems(ids, { parentId, onProgress } = {}) {
    if (!account) throw new Error("Not connected to Google Drive.");

    for (let index = 0; index < ids.length; index += 1) {
      await wait(420);
      if (ids[index] === "gd_folder_archive") {
        throw new Error("“Archive” could not be read. Check its sharing settings.");
      }
      onProgress?.((index + 1) / ids.length);
    }

    return { imported: ids.length, parentId };
  },
};

/** Test seam. */
export function __resetProviders() {
  account = null;
}
