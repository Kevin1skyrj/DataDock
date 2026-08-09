"use client";

import { FolderOpen, SearchX } from "lucide-react";

import { Button } from "@/components/ui/button";
import { UploadMenu } from "@/components/upload/upload-menu";
import { useWorkspace } from "@/components/workspace/workspace-context";

/**
 * Nothing here.
 *
 * Two different nothings, and conflating them is the mistake. An empty folder is
 * a beginning and wants a way to fill it; a filtered listing with no matches is
 * a dead end and wants a way out. Showing "drop files here" to someone who has
 * simply typed a query that matches nothing is both useless and slightly rude.
 */
export function EmptyState() {
  const { view, filtered, setKinds, setQuery, folderId, setImporting } = useWorkspace();

  const copy = filtered ? (view.emptySearch ?? view.empty) : view.empty;
  const Glyph = filtered ? SearchX : FolderOpen;

  return (
    <div className="flex min-h-64 flex-1 flex-col items-center justify-center gap-4 p-8 text-center">
      <span className="grid size-12 place-items-center rounded-xl bg-surface text-dim">
        <Glyph className="size-5" />
      </span>

      <div className="flex max-w-72 flex-col gap-1.5">
        <p className="text-md font-medium text-foreground">{copy.title}</p>
        <p className="text-base leading-[1.6] text-muted-foreground text-balance">{copy.body}</p>
      </div>

      {filtered ? (
        <Button
          variant="secondary"
          size="sm"
          onClick={() => {
            setKinds([]);
            setQuery("");
          }}
        >
          Clear filters
        </Button>
      ) : copy.action === "upload" && view.canUpload !== false ? (
        // The toolbar's control, not a copy of it. An empty folder is where
        // someone is most likely to want folder upload or an import, and a
        // second button that only did plain files would be the weaker half of
        // the same affordance sitting two inches below the stronger one.
        <UploadMenu parentId={folderId} onImport={setImporting} />
      ) : null}
    </div>
  );
}
