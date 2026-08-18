import { googleDrive } from "@/services/api/google-drive";

/**
 * Where files can come from, besides this computer.
 *
 * A list, not a special case. Adding Dropbox is an entry here plus an object
 * implementing the same five functions — the menu, the dialog, the picker and
 * the progress reporting are already written against the interface and none of
 * them will need to change.
 *
 * `available: false` entries render as coming soon rather than being hidden,
 * because "can I get my files out of Dropbox" is a question people ask before
 * they sign up, and an empty Import section answers it wrongly.
 */
export const IMPORT_PROVIDERS = [
  { ...googleDrive, available: true },
  {
    id: "dropbox",
    label: "Dropbox",
    description: "Coming soon.",
    available: false,
  },
  {
    id: "onedrive",
    label: "OneDrive",
    description: "Coming soon.",
    available: false,
  },
];

export const getProvider = (id) => IMPORT_PROVIDERS.find((provider) => provider.id === id);
