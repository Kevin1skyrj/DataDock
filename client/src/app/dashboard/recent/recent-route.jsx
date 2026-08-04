"use client";

import { FileWorkspace } from "@/components/workspace/file-workspace";
import { WORKSPACE_VIEWS } from "@/constants/workspace-views";

/**
 * Recent.
 *
 * The entire page. Every listing in the product is `FileWorkspace` with a
 * different descriptor — the table, the grid, selection, sorting, the context
 * menu, the details panel, drag and drop, Quick Look and sharing are all the
 * same components underneath.
 *
 * These four views are drive-wide, so there is no folder to navigate into and
 * no `onNavigate`. Opening a folder from Starred would mean leaving the view
 * you asked for, which is what All files is already there to do.
 */
export function RecentRoute() {
  return <FileWorkspace view={WORKSPACE_VIEWS.recent} />;
}
