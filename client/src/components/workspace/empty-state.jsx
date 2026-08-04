"use client";

import { FolderOpen, SearchX, Upload } from "lucide-react";

import { Button } from "@/components/ui/button";
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
  const { view, filtered, setKinds, setQuery, setStatus } = useWorkspace();

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
      ) : copy.action === "upload" ? (
        <Button
          size="sm"
          onClick={() => setStatus({ text: "Uploading arrives with the Upload Flow." })}
        >
          <Upload />
          Upload files
        </Button>
      ) : null}
    </div>
  );
}
