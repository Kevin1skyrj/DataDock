/**
 * Lets the header ask for the command palette without owning it.
 *
 * The header sits above the preview in the tree, so passing a callback down
 * would mean lifting palette state into the page for one button. A window event
 * keeps both sides independent — and when the real global palette replaces the
 * preview's demo, it listens for the same event and nothing else changes.
 */
export const OPEN_PALETTE_EVENT = "datadock:open-palette";

export function requestPalette() {
  window.dispatchEvent(new CustomEvent(OPEN_PALETTE_EVENT));
}
