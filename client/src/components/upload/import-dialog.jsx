"use client";

import { ChevronRight, CircleAlert, Folder, Home } from "lucide-react";
import { useEffect, useState } from "react";

import { ProviderMark } from "@/components/upload/provider-mark";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogBody,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { notify } from "@/components/ui/toast";
import { FileIcon } from "@/components/workspace/file-icon";
import { formatBytes } from "@/lib/format";
import { cn } from "@/lib/utils";

/**
 * Bringing files in from another service.
 *
 * Written against the provider interface, never against Google. It receives a
 * provider and calls `getAccount`, `connect`, `listItems` and `importItems` —
 * so Dropbox is a new object in the registry and nothing in this file changes.
 *
 * Three states in one dialog rather than three dialogs, because they are one
 * task with a prerequisite: connect, choose, import. Splitting them would mean
 * three focus traps and two dead ends.
 *
 * The import is not a browser transfer and is not shown as one. A real Drive
 * import is a server-to-server copy — our API holds the token, pulls from
 * Google, puts to S3 — so this reports a job's progress rather than a queue of
 * uploads, and it does not go anywhere near the upload manager.
 */
export function ImportDialog({ provider, parentId, open, onClose, onImported }) {
  const [account, setAccount] = useState(undefined);
  const [connecting, setConnecting] = useState(false);
  const [folderId, setFolderId] = useState("root");
  const [trail, setTrail] = useState([]);
  const [listing, setListing] = useState(null);
  const [chosen, setChosen] = useState(() => new Set());
  const [progress, setProgress] = useState(null);
  /**
   * Two kinds of failure, kept apart.
   *
   * A listing error belongs to the folder that produced it, so it is tagged and
   * disappears when you navigate away from that folder — no effect has to clear
   * it. A connect or import error belongs to the act, and stays until the act is
   * repeated.
   */
  const [listError, setListError] = useState(null);
  const [actionError, setActionError] = useState(null);

  useEffect(() => {
    if (!open || !provider) return undefined;
    let cancelled = false;
    provider.getAccount().then((result) => {
      if (!cancelled) setAccount(result);
    });
    return () => {
      cancelled = true;
    };
  }, [open, provider]);

  // Tagged with the request it answers, so a slow folder cannot land after a
  // faster one — the same rule the workspace listing follows.
  const requestKey = open && account ? folderId : null;
  const loading = listing?.key !== requestKey;

  useEffect(() => {
    if (!open || !account || !provider) return undefined;
    let cancelled = false;
    provider
      .listItems(folderId)
      .then((items) => {
        if (!cancelled) setListing({ key: folderId, items });
      })
      .catch((failure) => {
        if (!cancelled) setListError({ key: folderId, message: failure.message });
      });
    return () => {
      cancelled = true;
    };
  }, [open, account, provider, folderId]);

  const error = actionError ?? (listError?.key === folderId ? listError.message : null);

  if (!provider) return null;

  const toggle = (id) =>
    setChosen((current) => {
      const next = new Set(current);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  const enter = (item) => {
    setTrail((current) => [...current, item]);
    setFolderId(item.id);
  };

  const jumpTo = (index) => {
    const next = trail.slice(0, index + 1);
    setTrail(next);
    setFolderId(next.at(-1)?.id ?? "root");
  };

  const reset = () => {
    setTrail([]);
    setFolderId("root");
    setChosen(new Set());
    setProgress(null);
    setActionError(null);
    setListError(null);
    onClose();
  };

  const runImport = async () => {
    const ids = [...chosen];
    setProgress(0);
    setActionError(null);

    try {
      await provider.importItems(ids, { parentId, onProgress: setProgress });
      reset();
      notify({
        title: `Imported ${ids.length} ${ids.length === 1 ? "item" : "items"} from ${provider.label}`,
      });
      onImported?.();
    } catch (failure) {
      setProgress(null);
      setActionError(failure.message);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(next) => (next ? null : reset())}>
      <DialogContent size="md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2.5">
            <ProviderMark id={provider.id} />
            Import from {provider.label}
          </DialogTitle>
          {account ? (
            <p className="truncate text-base text-muted-foreground">{account.email}</p>
          ) : null}
        </DialogHeader>

        <DialogBody className="pb-2">
          {account === undefined ? (
            <div aria-hidden="true" className="flex h-56 flex-col gap-2 p-1">
              {[60, 45, 52].map((width) => (
                <div key={width} className="h-8 rounded-md bg-surface-2" style={{ width: `${width}%` }} />
              ))}
            </div>
          ) : !account ? (
            <div className="flex h-56 flex-col items-center justify-center gap-4 text-center">
              <ProviderMark id={provider.id} className="size-10" />
              <div className="flex max-w-72 flex-col gap-1.5">
                <p className="text-md font-medium text-foreground">
                  Connect your {provider.label} account
                </p>
                <p className="text-base leading-[1.6] text-muted-foreground text-balance">
                  DataDock will only read the files you choose. Nothing is changed on
                  {" "}
                  {provider.label}.
                </p>
              </div>
              <Button
                loading={connecting}
                onClick={async () => {
                  setConnecting(true);
                  try {
                    setAccount(await provider.connect());
                  } catch (failure) {
                    setActionError(failure.message);
                  } finally {
                    setConnecting(false);
                  }
                }}
              >
                Connect {provider.label}
              </Button>
            </div>
          ) : (
            <>
              <nav aria-label="Folder" className="flex items-center gap-1 pb-2 text-sm">
                <button
                  type="button"
                  onClick={() => jumpTo(-1)}
                  className="flex items-center gap-1 rounded-xs text-dim transition-colors duration-150 ease-standard hover:text-foreground"
                >
                  <Home className="size-3.5" />
                  {provider.label}
                </button>
                {trail.map((item, index) => (
                  <span key={item.id} className="flex min-w-0 items-center gap-1">
                    <ChevronRight aria-hidden="true" className="size-3 shrink-0 text-dim" />
                    <button
                      type="button"
                      onClick={() => jumpTo(index)}
                      className={cn(
                        "truncate rounded-xs transition-colors duration-150 ease-standard",
                        index === trail.length - 1
                          ? "text-foreground"
                          : "text-dim hover:text-foreground",
                      )}
                    >
                      {item.name}
                    </button>
                  </span>
                ))}
              </nav>

              <div className="h-64 overflow-y-auto rounded-lg border border-line bg-bg-deep p-1.5">
                {loading && !error ? (
                  <div aria-hidden="true" className="flex flex-col gap-1 p-1">
                    {[68, 52, 60, 44].map((width) => (
                      <div key={width} className="h-8 rounded-md bg-surface-2" style={{ width: `${width}%` }} />
                    ))}
                  </div>
                ) : (
                  listing?.items.map((item) => (
                    <div
                      key={item.id}
                      className="flex items-center gap-2.5 rounded-md px-2 py-1.5 transition-colors duration-150 ease-standard hover:bg-surface"
                    >
                      <Checkbox
                        checked={chosen.has(item.id)}
                        onCheckedChange={() => toggle(item.id)}
                        aria-label={`Select ${item.name}`}
                      />

                      <FileIcon kind={item.type === "folder" ? "folder" : item.kind} />

                      <span className="min-w-0 flex-1 truncate text-md text-foreground">
                        {item.name}
                      </span>

                      <span className="shrink-0 text-xs text-dim">
                        {item.type === "folder"
                          ? `${item.itemCount} items`
                          : formatBytes(item.size)}
                      </span>

                      {item.type === "folder" ? (
                        <button
                          type="button"
                          aria-label={`Open ${item.name}`}
                          onClick={() => enter(item)}
                          className="grid size-6 shrink-0 place-items-center rounded-sm text-dim transition-colors duration-150 ease-standard hover:bg-surface-2 hover:text-foreground"
                        >
                          <ChevronRight className="size-3.5" />
                        </button>
                      ) : (
                        <span className="size-6 shrink-0" />
                      )}
                    </div>
                  ))
                )}
              </div>
            </>
          )}

          {error ? (
            <p
              role="alert"
              className="mt-3 flex items-start gap-2.5 rounded-lg border border-error/30 bg-error/10 px-3.5 py-3 text-base text-error"
            >
              <CircleAlert className="mt-px size-4 shrink-0" />
              {error}
            </p>
          ) : null}

          {progress != null ? (
            <div className="mt-3 flex items-center gap-3">
              <div className="h-1 flex-1 overflow-hidden rounded-full bg-surface-2">
                <div
                  className="h-full origin-left rounded-full bg-brand transition-transform duration-200 ease-standard"
                  style={{ transform: `scaleX(${progress})` }}
                />
              </div>
              <span className="shrink-0 font-mono text-xs text-dim tabular-nums">
                {Math.round(progress * 100)}%
              </span>
            </div>
          ) : null}
        </DialogBody>

        <DialogFooter className="sm:justify-between">
          {account ? (
            <Button
              variant="ghost"
              onClick={async () => {
                await provider.disconnect();
                setAccount(null);
                setListing(null);
                setChosen(new Set());
              }}
            >
              Disconnect
            </Button>
          ) : (
            <span />
          )}

          <div className="flex gap-2">
            <Button variant="ghost" onClick={reset}>
              Cancel
            </Button>
            {account ? (
              <Button
                disabled={chosen.size === 0}
                loading={progress != null}
                onClick={runImport}
              >
                {chosen.size ? `Import ${chosen.size}` : "Import"}
              </Button>
            ) : null}
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
