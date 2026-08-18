"use client";

import { useState } from "react";

import { FileWorkspace } from "@/components/workspace/file-workspace";
import { useWorkspace } from "@/components/workspace/workspace-context";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { WORKSPACE_VIEWS } from "@/constants/workspace-views";
import { emptyTrash } from "@/services/files";

/**
 * Trash.
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
export function TrashRoute() {
  return <FileWorkspace view={WORKSPACE_VIEWS.trash} header={<TrashActions />} />;
}

function TrashActions() {
  const { total, reload } = useWorkspace();
  const [confirming, setConfirming] = useState(false);

  return (
    <>
      {total > 0 ? (
        <div className="flex justify-end border-b border-line px-3 py-2">
          <Button variant="destructive" size="sm" onClick={() => setConfirming(true)}>
            Empty trash
          </Button>
        </div>
      ) : null}
      <ConfirmDialog
        open={confirming}
        title="Empty trash?"
        body="Every item in Trash will be permanently removed from DataDock and S3. This cannot be undone."
        confirmLabel="Empty trash"
        onConfirm={async () => {
          await emptyTrash();
          setConfirming(false);
          reload();
        }}
        onClose={() => setConfirming(false)}
      />
    </>
  );
}
