"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useCallback } from "react";

import { FileWorkspace } from "@/components/workspace/file-workspace";
import { WORKSPACE_VIEWS } from "@/constants/workspace-views";

/**
 * All files.
 *
 * The entire page. Every other listing — Recent, Starred, Shared, Trash, search
 * results — will be this file with a different descriptor, which is what the
 * whole architecture was for.
 *
 * The current folder rides in the query string rather than the path, and that is
 * a deliberately temporary choice. Real segments would put folder ids in the URL
 * where the shell's breadcrumb would render them as ids, because it maps
 * segments to labels and has never heard of `fld_brand_refresh`. Folder
 * Navigation is the milestone that resolves that properly; until then this
 * survives a reload and a back button, which is what actually matters.
 */
export function FilesRoute() {
  const router = useRouter();
  const params = useSearchParams();
  const folderId = params.get("folder");

  const navigate = useCallback(
    (id) => {
      router.push(id ? `/dashboard/files?folder=${encodeURIComponent(id)}` : "/dashboard/files");
    },
    [router],
  );

  return (
    <FileWorkspace view={WORKSPACE_VIEWS.files} folderId={folderId} onNavigate={navigate} />
  );
}
