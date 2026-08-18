"use client";

import { ChevronLeft, Download, Eye } from "lucide-react";
import { useState } from "react";

import { PREVIEW_RENDERERS } from "@/components/preview/preview-renderers";
import { Button } from "@/components/ui/button";
import { FileIcon } from "@/components/workspace/file-icon";
import { formatBytes } from "@/lib/format";

export function SharedFolderBrowser({ apiUrl, token, root, initialItems }) {
  const [trail, setTrail] = useState([root]);
  const [items, setItems] = useState(initialItems);
  const [preview, setPreview] = useState(null);
  const [loading, setLoading] = useState(false);
  const encodedToken = encodeURIComponent(token);

  const load = async (folder, nextTrail) => {
    setLoading(true);
    const query = folder.id === root.id ? "" : `?parentId=${encodeURIComponent(folder.id)}`;
    const response = await fetch(`${apiUrl}/shares/${encodedToken}/items${query}`);
    if (response.ok) {
      const { data } = await response.json();
      setItems(data.items);
      setTrail(nextTrail);
    }
    setLoading(false);
  };

  const openPreview = async (item) => {
    const response = await fetch(
      `${apiUrl}/shares/${encodedToken}/items/${encodeURIComponent(item.id)}/preview`,
    );
    if (!response.ok) return;
    setPreview({ item, ...(await response.json()).data });
  };

  const Renderer = PREVIEW_RENDERERS[preview?.kind] ?? PREVIEW_RENDERERS.unsupported;

  return (
    <div className="mt-6 text-left">
      <div className="mb-2 flex items-center gap-2">
        <Button
          variant="ghost"
          size="icon-sm"
          aria-label="Go to parent folder"
          disabled={trail.length === 1}
          onClick={() => {
            const next = trail.slice(0, -1);
            load(next.at(-1), next);
          }}
        >
          <ChevronLeft />
        </Button>
        <span className="truncate text-sm text-muted-foreground">
          {trail.map((folder) => folder.name).join(" / ")}
        </span>
      </div>

      <div className="overflow-hidden rounded-lg border border-line">
        {loading ? <p className="p-5 text-sm text-muted-foreground">Loading…</p> : null}
        {!loading && items.length === 0 ? (
          <p className="p-5 text-sm text-muted-foreground">This folder is empty.</p>
        ) : null}
        {!loading
          ? items.map((item) => (
              <div key={item.id} className="flex items-center gap-3 border-b border-line px-4 py-3 last:border-b-0">
                <FileIcon kind={item.kind} />
                <button
                  type="button"
                  className="min-w-0 flex-1 truncate text-left text-sm text-foreground"
                  onClick={() =>
                    item.type === "folder"
                      ? load(item, [...trail, item])
                      : openPreview(item)
                  }
                >
                  {item.name}
                </button>
                <span className="hidden text-xs text-dim sm:block">
                  {item.type === "folder" ? `${item.itemCount ?? 0} items` : formatBytes(item.size)}
                </span>
                {item.type === "file" ? (
                  <>
                    <Button variant="ghost" size="icon-sm" aria-label={`Preview ${item.name}`} onClick={() => openPreview(item)}>
                      <Eye />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      aria-label={`Download ${item.name}`}
                      render={<a href={`${apiUrl}/shares/${encodedToken}/items/${encodeURIComponent(item.id)}/download`} />}
                    >
                      <Download />
                    </Button>
                  </>
                ) : null}
              </div>
            ))
          : null}
      </div>

      {preview ? (
        <div className="mt-5 overflow-hidden rounded-lg border border-line bg-bg-deep">
          <div className="flex items-center justify-between border-b border-line px-4 py-2">
            <span className="truncate text-sm text-foreground">{preview.item.name}</span>
            <Button variant="ghost" size="sm" onClick={() => setPreview(null)}>Close</Button>
          </div>
          <div className="flex h-[55dvh] items-center justify-center overflow-auto p-4">
            <Renderer preview={preview} item={preview.item} />
          </div>
        </div>
      ) : null}
    </div>
  );
}
